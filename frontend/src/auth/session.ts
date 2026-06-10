/**
 * Session core — access-token storage + cookie-based refresh, shared by the API client and the
 * AuthProvider. Kept React-free so the non-React client can use it without a cycle.
 *
 * Storage (hardened): the ACCESS token lives only in JS memory (`api/auth-store`). The REFRESH token is an
 * httpOnly `rw_refresh` cookie set by the server — JS never reads or stores it (XSS can't exfiltrate it),
 * and each /auth/refresh ROTATES it. CSRF uses double-submit: the server sets a readable `rw_csrf` cookie
 * the client echoes in the `X-CSRF-Token` header. Multi-tab logout syncs via a localStorage ping key.
 * — arch §security
 */
import { getAccessToken, setAccessToken } from '../api/auth-store';
import type { RefreshResponse } from './auth.types';

/** localStorage ping written on logout/expiry so other tabs clear their session (no token is stored here). */
export const LOGOUT_PING_KEY = 'redwave-logout';

// Backend origin in production (cross-subdomain: app. → api.); '' in dev (same-origin via the Vite proxy).
// Mirrors api/client.ts so the raw refresh fetch hits the SAME origin as the typed client. — arch §security
const API_BASE = import.meta.env.VITE_API_BASE_URL?.trim() || '';

export { getAccessToken, setAccessToken };

/** Read the readable CSRF cookie the server set (double-submit). Returns '' if absent (pre-login). */
export function getCsrfToken(): string {
  const m = document.cookie.match(/(?:^|;\s*)rw_csrf=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : '';
}

/** Store the access token after login/refresh (the refresh + CSRF tokens are server-set cookies). */
export function setSession(accessToken: string): void {
  setAccessToken(accessToken);
}

/** Wipe the in-memory access token and ping other tabs. The httpOnly cookie is cleared by /auth/logout. */
export function clearSession(): void {
  setAccessToken(null);
  try {
    localStorage.setItem(LOGOUT_PING_KEY, String(Date.now()));
  } catch {
    // ignore (private mode etc.)
  }
}

// ── Session-expired signalling (client → React) ───────────────────────────────────────
let sessionExpiredCb: (() => void) | null = null;
export function onSessionExpired(cb: () => void): void {
  sessionExpiredCb = cb;
}
export function notifySessionExpired(): void {
  sessionExpiredCb?.();
}

// ── Single-flight access-token refresh ────────────────────────────────────────────────
/**
 * The outcome of a refresh attempt. `expired` distinguishes a DEFINITIVE failure (the refresh cookie is
 * invalid/expired/missing → hard logout) from a TRANSIENT one (5xx / network / cold start → keep the
 * session; a later attempt may succeed). We NEVER log out on a transient failure.
 */
export type RefreshResult = { ok: true; token: string } | { ok: false; expired: boolean };

let refreshPromise: Promise<RefreshResult> | null = null;

/** Renew the access token via the refresh cookie. Concurrent callers share ONE request. */
export function refreshAccessToken(): Promise<RefreshResult> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

/**
 * One refresh attempt. Sends the httpOnly refresh cookie (`credentials: 'include'`) + the double-submit
 * CSRF header. `clearSession()` runs ONLY on a definitive expiry (401/403) — never on a 5xx/network error,
 * so a backend cold start can't log the user out. Exported for unit testing. NEVER throws.
 */
export async function doRefresh(): Promise<RefreshResult> {
  let res: Response;
  try {
    // Raw fetch (not the api client) → no import cycle, and never re-enters the 401 interceptor.
    res = await fetch(`${API_BASE}/v1/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'X-CSRF-Token': getCsrfToken() },
    });
  } catch {
    return { ok: false, expired: false }; // network error (offline / cold start) — TRANSIENT, keep session
  }
  if (res.ok) {
    const data = (await res.json()) as RefreshResponse;
    setAccessToken(data.access_token);
    return { ok: true, token: data.access_token };
  }
  if (res.status === 401 || res.status === 403) {
    clearSession(); // the refresh cookie itself is invalid/expired/missing → real logout
    return { ok: false, expired: true };
  }
  return { ok: false, expired: false }; // 5xx / 408 / 429 / etc. (cold start) — TRANSIENT, keep session
}
