import { beforeEach, describe, expect, it, vi } from 'vitest';

// Minimal localStorage + cookie + fetch shims for the node test env (session.ts uses all three at call time).
const store = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
  clear: () => store.clear(),
});
vi.stubGlobal('document', { cookie: 'rw_csrf=csrf-token-xyz' });
const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

import { doRefresh, getAccessToken, getCsrfToken, LOGOUT_PING_KEY } from './session';
import { setAccessToken } from '../api/auth-store';

const res = (status: number, body?: unknown): Response =>
  ({ ok: status >= 200 && status < 300, status, json: async () => body }) as unknown as Response;

beforeEach(() => {
  store.clear();
  fetchMock.mockReset();
  setAccessToken('old-access'); // a live session before the refresh
});

describe('doRefresh — cookie-based silent refresh; logs out ONLY on a definitive expiry', () => {
  it('200 → returns the new access token, keeps the session', async () => {
    fetchMock.mockResolvedValue(res(200, { access_token: 'new-access' }));
    const result = await doRefresh();
    expect(result).toEqual({ ok: true, token: 'new-access' });
    expect(getAccessToken()).toBe('new-access');
  });

  it('sends the refresh cookie (credentials) + the double-submit CSRF header, no body', async () => {
    fetchMock.mockResolvedValue(res(200, { access_token: 'x' }));
    await doRefresh();
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.credentials).toBe('include');
    expect((init.headers as Record<string, string>)['X-CSRF-Token']).toBe('csrf-token-xyz');
    expect(init.body).toBeUndefined();
  });

  it('401 (refresh cookie invalid/expired) → expired, clears the session + pings other tabs', async () => {
    fetchMock.mockResolvedValue(res(401));
    const result = await doRefresh();
    expect(result).toEqual({ ok: false, expired: true });
    expect(getAccessToken()).toBeNull(); // session cleared → hard logout
    expect(store.get(LOGOUT_PING_KEY)).toBeTruthy(); // multi-tab logout ping written
  });

  it('503 (Render cold start) → transient: NO logout, session kept', async () => {
    fetchMock.mockResolvedValue(res(503));
    const result = await doRefresh();
    expect(result).toEqual({ ok: false, expired: false });
    expect(getAccessToken()).toBe('old-access'); // NOT cleared
  });

  it('network error → transient: NO logout, session kept', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    const result = await doRefresh();
    expect(result).toEqual({ ok: false, expired: false });
    expect(getAccessToken()).toBe('old-access'); // NOT cleared
  });

  it('getCsrfToken reads the rw_csrf cookie', () => {
    expect(getCsrfToken()).toBe('csrf-token-xyz');
  });
});
