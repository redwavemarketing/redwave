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
let refreshPromise: Promise<string | null> | null = null;

/** Renew the access token using the stored refresh token. Concurrent callers share ONE request. */
export function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function doRefresh(): Promise<string | null> {
  const refresh_token = getRefreshToken();
  if (!refresh_token) {
    return null;
  }
  try {
    // Raw fetch (not the api client) → no import cycle, and never re-enters the 401 interceptor.
    const res = await fetch('/v1/auth/refresh', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refresh_token }),
    });
    if (!res.ok) {
      clearSession(); // refresh token is dead — drop it
      return null;
    }
    const data = (await res.json()) as RefreshResponse;
    setAccessToken(data.access_token);
    return data.access_token;
  } catch {
    clearSession();
    return null;
  }
}
