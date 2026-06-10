/**
 * @CsrfExempt() — opt a route out of the global double-submit CSRF check.
 *
 * Used on the pre-auth routes that run BEFORE any CSRF cookie exists (login, forgot/reset password, the MFA
 * challenge verify) and on endpoints that authenticate without the cookie. The CsrfGuard also skips any
 * request that carries no `rw_csrf` cookie at all (pure Bearer/API clients), so this is mostly belt-and-suspenders.
 * — arch §security (CSRF)
 */
import { SetMetadata } from '@nestjs/common';

export const CSRF_EXEMPT_KEY = 'csrfExempt';
export const CsrfExempt = (): MethodDecorator & ClassDecorator => SetMetadata(CSRF_EXEMPT_KEY, true);
