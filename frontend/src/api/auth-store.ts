/**
 * Access-token store — a tiny module-level holder the API client reads on each request. Kept separate
 * so the login flow (next session) can set/clear the token without the client knowing about auth state.
 * No token is set this session; the client simply sends no Authorization header.
 */
let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}
