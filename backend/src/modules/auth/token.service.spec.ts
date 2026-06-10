import { TokenService } from './token.service';

function make(ttlAccess?: string, secretOld?: string) {
  const signAsync = jest.fn().mockResolvedValue('signed.jwt');
  const verifyAsync = jest.fn();
  const jwt = { signAsync, verifyAsync };
  const values: Record<string, string> = {
    JWT_ACCESS_SECRET: 'a-secret',
    ...(ttlAccess !== undefined ? { JWT_ACCESS_TTL: ttlAccess } : {}),
    ...(secretOld !== undefined ? { JWT_ACCESS_SECRET_OLD: secretOld } : {}),
  };
  const config = {
    get: jest.fn((key: string, def?: string) => values[key] ?? def),
    getOrThrow: jest.fn((key: string) => {
      const v = values[key];
      if (v === undefined) throw new Error(`missing ${key}`);
      return v;
    }),
  };
  return { service: new TokenService(jwt as never, config as never), signAsync, verifyAsync };
}

describe('TokenService — access TTL is a DURATION STRING, never coerced to seconds (AUTH-001)', () => {
  it('signs the access token with expiresIn "15m" (the 15-MINUTE string) + the sid claim', async () => {
    const { service, signAsync } = make('15m');
    await service.signAccess('u1', 'sid1');
    const [payload, opts] = signAsync.mock.calls[0] as [Record<string, unknown>, { expiresIn: unknown; secret: string }];
    expect(payload).toEqual({ sub: 'u1', type: 'access', sid: 'sid1' });
    expect(opts.expiresIn).toBe('15m');
    expect(typeof opts.expiresIn).toBe('string'); // a number would collapse "15m" → 15 SECONDS
    expect(opts.secret).toBe('a-secret');
  });

  it('defaults to "15m" when the env var is unset', async () => {
    const { service, signAsync } = make(undefined);
    await service.signAccess('u1', 'sid1');
    expect((signAsync.mock.calls[0][1] as { expiresIn: unknown }).expiresIn).toBe('15m');
  });
});

describe('TokenService.verifyAccess — multi-secret (zero-downtime JWT-secret rotation)', () => {
  it('falls back to JWT_ACCESS_SECRET_OLD when the primary secret fails', async () => {
    const { service, verifyAsync } = make('15m', 'old-secret');
    verifyAsync
      .mockRejectedValueOnce(new Error('bad signature')) // primary secret rejects an old token
      .mockResolvedValueOnce({ sub: 'u1', type: 'access', sid: 'sid1' }); // old secret verifies it
    await expect(service.verifyAccess('tok')).resolves.toMatchObject({ sub: 'u1' });
    expect(verifyAsync).toHaveBeenCalledTimes(2);
    expect((verifyAsync.mock.calls[0][1] as { secret: string }).secret).toBe('a-secret');
    expect((verifyAsync.mock.calls[1][1] as { secret: string }).secret).toBe('old-secret');
  });

  it('rejects when no configured secret verifies the token', async () => {
    const { service, verifyAsync } = make('15m');
    verifyAsync.mockRejectedValue(new Error('bad signature'));
    await expect(service.verifyAccess('tok')).rejects.toThrow();
  });
});
