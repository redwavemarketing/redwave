/**
 * Typed API client — `openapi-fetch` over the types generated from contract/openapi.yaml
 * (`npm run gen:api`). The path keys already include `/v1`, so there is NO `baseUrl` (a `/v1` baseUrl
 * would double it); the Vite dev proxy forwards `/v1` → the backend.
 *
 *  • onRequest: attaches `Authorization: Bearer <access token>` from the session.
 *  • onResponse: on a 401 for a non-auth request, performs a SINGLE-FLIGHT refresh and RETRIES the
 *    original request ONCE; if refresh fails, signals session-expired (the AuthProvider redirects).
 */
import createClient, { type Middleware } from 'openapi-fetch';
import type { paths } from './generated/schema';
import { getAccessToken } from './auth-store';
import { notifySessionExpired, refreshAccessToken } from '../auth/session';

const AUTH_PATHS = ['/v1/auth/login', '/v1/auth/refresh', '/v1/auth/logout'];
const isAuthRequest = (url: string) => AUTH_PATHS.some((p) => url.includes(p));
const RETRIED = 'x-redwave-retried';

const authMiddleware: Middleware = {
  onRequest({ request }) {
    const token = getAccessToken();
    if (token) {
      request.headers.set('Authorization', `Bearer ${token}`);
    }
    return request;
  },

  async onResponse({ request, response }) {
    // Only intercept auth failures on protected endpoints, and never a request we already retried.
    if (response.status !== 401 || isAuthRequest(request.url) || request.headers.has(RETRIED)) {
      return response;
    }
    const token = await refreshAccessToken();
    if (!token) {
      notifySessionExpired(); // session is dead → AuthProvider clears + redirects to /login
      return response;
    }
    // Retry the original request ONCE with the new token via raw fetch (no middleware re-entry).
    const retried = request.clone();
    retried.headers.set('Authorization', `Bearer ${token}`);
    retried.headers.set(RETRIED, '1');
    return fetch(retried);
  },
};

export const api = createClient<paths>({});
api.use(authMiddleware);
