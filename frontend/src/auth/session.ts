/**
 * Session core — token storage + refresh, shared by the API client and the AuthProvider. Kept
 * React-free so the client (which lives outside React) can use it without a cycle.
 *
 * Storage (confirmed): the ACCESS token lives only in JS memory (`api/auth-store`); the REFRESH token
 * persists in localStorage so a reload silently re-authenticates (up to the 7d refresh TTL). Tradeoff
 * accepted for an internal ERP — an httpOnly refresh cookie is a flagged future BACKEND addition.
 * The non-React client signals "session dead" back to React via the `onSessionExpired` callback.
 */
import { getAccessToken, setAccessToken } from '../api/auth-store';
import type { RefreshResponse } from './auth.types';

/** localStorage key for the refresh token. Watched by the multi-tab `storage` listener. */
export const REFRESH_STORAGE_KEY = 'redwave-refresh';

export { getAccessToken, setAccessToken };

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_STORAGE_KEY);
}

/** Store both tokens after a successful login (access in memory, refresh in localStorage). */
export function setSession(accessToken: string, refreshToken: string): void {
  setAccessToken(accessToken);
  localStorage.setItem(REFRESH_STORAGE_KEY, refreshToken);
}

/** Wipe the session. Removing the refresh key also fires the `storage` event other tabs listen to. */
export function clearSession(): void {
  setAccessToken(null);
  localStorage.removeItem(REFRESH_STORAGE_KEY);
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
 * The outcome of a refresh attempt. `expired` distinguishes a DEFINITIVE failure (the refresh token
 * itself is invalid/expired → hard logout) from a TRANSIENT one (5xx / network / Render cold start →
 * keep the session; a later attempt may succeed). We NEVER log out on a transient failure.
 */
export type RefreshResult = { ok: true; token: string } | { ok: false; expired: boolean };

let refreshPromise: Promise<RefreshResult> | null = null;

/** Renew the access token using the stored refresh token. Concurrent callers share ONE request. */
export function refreshAccessToken(): Promise<RefreshResult> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

/**
 * One refresh attempt. `clearSession()` is called ONLY on a definitive expiry (no token, or the refresh
 * endpoint returns 401/403) — never on a 5xx or a network error, so a backend cold start can't log the
 * user out. Exported for unit testing. NEVER throws.
 */
export async function doRefresh(): Promise<RefreshResult> {
  const refresh_token = getRefreshToken();
  if (!refresh_token) {
    return { ok: false, expired: true }; // nothing to refresh with → treat as logged out
  }
  let res: Response;
  try {
    // Raw fetch (not the api client) → no import cycle, and never re-enters the 401 interceptor.
    res = await fetch('/v1/auth/refresh', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refresh_token }),
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
    clearSession(); // the refresh token itself is invalid/expired → real logout
    return { ok: false, expired: true };
  }
  return { ok: false, expired: false }; // 5xx / 408 / 429 / etc. (cold start) — TRANSIENT, keep session
}
