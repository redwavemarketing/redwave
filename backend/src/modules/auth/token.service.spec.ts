import { TokenService } from './token.service';

function make(ttlAccess?: string, ttlRefresh?: string) {
  const signAsync = jest.fn().mockResolvedValue('signed.jwt');
  const jwt = { signAsync, verifyAsync: jest.fn() };
  const values: Record<string, string> = {
    JWT_ACCESS_SECRET: 'a-secret',
    JWT_REFRESH_SECRET: 'r-secret',
    ...(ttlAccess !== undefined ? { JWT_ACCESS_TTL: ttlAccess } : {}),
    ...(ttlRefresh !== undefined ? { JWT_REFRESH_TTL: ttlRefresh } : {}),
  };
  const config = {
    get: jest.fn((key: string, def?: string) => values[key] ?? def),
    getOrThrow: jest.fn((key: string) => {
      const v = values[key];
      if (v === undefined) throw new Error(`missing ${key}`);
      return v;
    }),
  };
  return { service: new TokenService(jwt as never, config as never), signAsync };
}

describe('TokenService — TTL is a DURATION STRING, never coerced to seconds (AUTH-001)', () => {
  it('signs the access token with expiresIn "15m" (the 15-MINUTE string, not the number 15)', async () => {
    const { service, signAsync } = make('15m', '7d');
    await service.signAccess('u1');
    const opts = signAsync.mock.calls[0][1] as { expiresIn: unknown; secret: string };
    expect(opts.expiresIn).toBe('15m');
    expect(typeof opts.expiresIn).toBe('string'); // a number would collapse "15m" → 15 SECONDS
    expect(opts.secret).toBe('a-secret');
  });

  it('signs the refresh token with expiresIn "7d"', async () => {
    const { service, signAsync } = make('15m', '7d');
    await service.signRefresh('u1');
    const opts = signAsync.mock.calls[0][1] as { expiresIn: unknown; secret: string };
    expect(opts.expiresIn).toBe('7d');
    expect(opts.secret).toBe('r-secret');
  });

  it('defaults to "15m" / "7d" when the env vars are unset', async () => {
    const { service, signAsync } = make(undefined, undefined);
    await service.signAccess('u1');
    await service.signRefresh('u1');
    expect((signAsync.mock.calls[0][1] as { expiresIn: unknown }).expiresIn).toBe('15m');
    expect((signAsync.mock.calls[1][1] as { expiresIn: unknown }).expiresIn).toBe('7d');
  });
});
