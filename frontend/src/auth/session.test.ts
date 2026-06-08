import { beforeEach, describe, expect, it, vi } from 'vitest';

// Minimal localStorage + fetch shims for the node test env (session.ts uses both at call time).
const store = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
  clear: () => store.clear(),
});
const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

import { doRefresh, getAccessToken, getRefreshToken, REFRESH_STORAGE_KEY } from './session';
import { setAccessToken } from '../api/auth-store';

const res = (status: number, body?: unknown): Response =>
  ({ ok: status >= 200 && status < 300, status, json: async () => body }) as unknown as Response;

beforeEach(() => {
  store.clear();
  fetchMock.mockReset();
  setAccessToken(null);
  store.set(REFRESH_STORAGE_KEY, 'refresh-token-abc');
});

describe('doRefresh — silent refresh; logs out ONLY on a definitive expiry', () => {
  it('200 → returns the new access token, keeps the session', async () => {
    fetchMock.mockResolvedValue(res(200, { access_token: 'new-access' }));
    const result = await doRefresh();
    expect(result).toEqual({ ok: true, token: 'new-access' });
    expect(getAccessToken()).toBe('new-access');
    expect(getRefreshToken()).toBe('refresh-token-abc'); // session preserved
  });

  it('401 (refresh token expired) → expired, clears the session (logout)', async () => {
    fetchMock.mockResolvedValue(res(401));
    const result = await doRefresh();
    expect(result).toEqual({ ok: false, expired: true });
    expect(getRefreshToken()).toBeNull(); // session cleared → hard logout
  });

  it('503 (Render cold start) → transient: NO logout, session kept', async () => {
    fetchMock.mockResolvedValue(res(503));
    const result = await doRefresh();
    expect(result).toEqual({ ok: false, expired: false });
    expect(getRefreshToken()).toBe('refresh-token-abc'); // NOT cleared
  });

  it('network error → transient: NO logout, session kept', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    const result = await doRefresh();
    expect(result).toEqual({ ok: false, expired: false });
    expect(getRefreshToken()).toBe('refresh-token-abc'); // NOT cleared
  });

  it('no refresh token → expired, never calls the network', async () => {
    store.delete(REFRESH_STORAGE_KEY);
    const result = await doRefresh();
    expect(result).toEqual({ ok: false, expired: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
