/**
 * Typed API client — `openapi-fetch` over the types generated from contract/openapi.yaml
 * (`npm run gen:api`). The generated path keys already include `/v1`, so the baseUrl must be the backend
 * ORIGIN ONLY.
 *
 * Environment-aware base URL:
 *  • PRODUCTION (e.g. Vercel — no dev proxy): set `VITE_API_BASE_URL` to the backend origin ONLY —
 *    e.g. `https://api.redwave.example` — with NO `/v1` and NO trailing slash (openapi-fetch joins
 *    baseUrl + the `/v1/...` path key, so either would produce a malformed/doubled URL).
 *  • DEVELOPMENT (unset): no baseUrl, so requests stay same-origin (`/v1/...`) and the Vite dev proxy
 *    forwards `/v1` → the backend at localhost:3000. Dev behaviour is unchanged.
 *
 *  • onRequest: attaches `Authorization: Bearer <access token>` from the session.
 *  • onResponse: on a 401 for a non-auth request, performs a SINGLE-FLIGHT refresh and RETRIES the
 *    original request ONCE. We hard-logout ONLY if the refresh fails because the refresh token is itself
 *    expired (401/403). A transient refresh failure (5xx / network / Render cold start) does NOT log out —
 *    the original error is surfaced and the session is preserved for a later retry.
 */
import createClient, { type Middleware } from 'openapi-fetch';
import type { paths } from './generated/schema';
import { getAccessToken } from './auth-store';
import { getCsrfToken, notifySessionExpired, refreshAccessToken } from '../auth/session';

const AUTH_PATHS = ['/v1/auth/login', '/v1/auth/refresh', '/v1/auth/logout'];
const isAuthRequest = (url: string) => AUTH_PATHS.some((p) => url.includes(p));
const RETRIED = 'x-redwave-retried';

const authMiddleware: Middleware = {
  onRequest({ request }) {
    const token = getAccessToken();
    if (token) {
      request.headers.set('Authorization', `Bearer ${token}`);
    }
    // Double-submit CSRF: echo the readable rw_csrf cookie on every request (the server checks it on
    // mutating cookie-session requests; harmless on GETs and on the exempt pre-auth routes). — arch §security
    const csrf = getCsrfToken();
    if (csrf) {
      request.headers.set('X-CSRF-Token', csrf);
    }
    return request;
  },

  async onResponse({ request, response }) {
    // Only intercept auth failures on protected endpoints, and never a request we already retried.
    if (response.status !== 401 || isAuthRequest(request.url) || request.headers.has(RETRIED)) {
      return response;
    }
    const result = await refreshAccessToken();
    if (!result.ok) {
      // Only a DEFINITIVE expiry logs out; a transient failure keeps the session (no logout on 5xx/network).
      if (result.expired) {
        notifySessionExpired(); // session is dead → AuthProvider clears + redirects to /login
      }
      return response;
    }
    // Retry the original request ONCE with the new token via raw fetch (no middleware re-entry).
    const retried = request.clone();
    retried.headers.set('Authorization', `Bearer ${result.token}`);
    retried.headers.set(RETRIED, '1');
    return fetch(retried);
  },
};

// Backend origin in production; undefined in development (Vite dev proxy handles /v1). Must NOT end in
// `/v1` or a trailing slash — see the header note above.
const baseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || undefined;

// `credentials: 'include'` so the httpOnly refresh cookie + readable CSRF cookie ride every request
// (cross-subdomain in prod, same-origin in dev). The backend CORS allowlist must echo the FE origin. — arch §security
export const api = createClient<paths>({ ...(baseUrl ? { baseUrl } : {}), credentials: 'include' });
api.use(authMiddleware);
