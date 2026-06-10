/**
 * CsrfGuard — double-submit CSRF protection (runs after auth/permissions, globally).
 *
 * On a state-changing request (POST/PUT/PATCH/DELETE) it requires the `X-CSRF-Token` header to equal the
 * readable `rw_csrf` cookie. It SKIPS:
 *   • safe methods (GET/HEAD/OPTIONS),
 *   • `@CsrfExempt()` routes (login / forgot / reset / mfa-verify — they run before any CSRF cookie exists),
 *   • any request with no `rw_csrf` cookie at all (a pure Bearer/API client carries no ambient cookie, so
 *     it isn't CSRF-exposed; only cookie-bearing browser sessions are checked).
 * Bearer endpoints don't strictly need this (SameSite=Lax + the in-memory access token already block CSRF),
 * but enforcing it on every cookie-session mutation is cheap defense-in-depth. — arch §security (CSRF)
 */
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { CSRF_COOKIE, CSRF_HEADER } from './cookie.util';
import { CSRF_EXEMPT_KEY } from './csrf-exempt.decorator';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (SAFE_METHODS.has(request.method)) {
      return true;
    }
    const exempt = this.reflector.getAllAndOverride<boolean>(CSRF_EXEMPT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (exempt) {
      return true;
    }
    const cookieToken = (request.cookies as Record<string, string> | undefined)?.[CSRF_COOKIE];
    if (!cookieToken) {
      // No CSRF cookie → not a cookie-authenticated browser session (Bearer/API or pre-login). Nothing to forge.
      return true;
    }
    const headerToken = request.headers[CSRF_HEADER];
    const header = Array.isArray(headerToken) ? headerToken[0] : headerToken;
    if (header && header === cookieToken) {
      return true;
    }
    throw new ForbiddenException('CSRF token missing or invalid');
  }
}
