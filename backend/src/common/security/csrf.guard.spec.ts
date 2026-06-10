import { ForbiddenException } from '@nestjs/common';
import { CsrfGuard } from './csrf.guard';

function ctx(req: { method: string; cookies?: Record<string, string>; headers?: Record<string, string> }, exempt = false) {
  const reflector = { getAllAndOverride: jest.fn().mockReturnValue(exempt) } as never;
  const context = {
    switchToHttp: () => ({ getRequest: () => ({ headers: {}, ...req }) }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as never;
  return { guard: new CsrfGuard(reflector), context };
}

describe('CsrfGuard — double-submit on mutating cookie-session requests (arch §security)', () => {
  it('passes safe methods (GET/HEAD/OPTIONS) regardless of tokens', () => {
    const { guard, context } = ctx({ method: 'GET' });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('passes a request with no rw_csrf cookie (Bearer/API or pre-login — nothing to forge)', () => {
    const { guard, context } = ctx({ method: 'POST', cookies: {}, headers: {} });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('REJECTS a mutating cookie-session request whose header is missing', () => {
    const { guard, context } = ctx({ method: 'POST', cookies: { rw_csrf: 'abc' }, headers: {} });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('REJECTS when the header does not match the cookie', () => {
    const { guard, context } = ctx({ method: 'POST', cookies: { rw_csrf: 'abc' }, headers: { 'x-csrf-token': 'WRONG' } });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('passes when the X-CSRF-Token header equals the rw_csrf cookie', () => {
    const { guard, context } = ctx({ method: 'POST', cookies: { rw_csrf: 'abc' }, headers: { 'x-csrf-token': 'abc' } });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('passes a @CsrfExempt route even with a mismatched cookie (login/forgot/reset/mfa-verify)', () => {
    const { guard, context } = ctx({ method: 'POST', cookies: { rw_csrf: 'abc' }, headers: {} }, true);
    expect(guard.canActivate(context)).toBe(true);
  });
});
