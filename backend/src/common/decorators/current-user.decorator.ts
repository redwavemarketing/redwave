/**
 * @CurrentUser() — injects the authenticated AuthUser (set by JwtAuthGuard) into a handler.
 * `@CurrentUser('id')` returns a single field.
 */
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { AuthUser } from '../rbac/auth-user.type';

export const CurrentUser = createParamDecorator(
  (
    data: keyof AuthUser | undefined,
    ctx: ExecutionContext,
  ): AuthUser | AuthUser[keyof AuthUser] => {
    const request = ctx.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const user = request.user as AuthUser;
    return data ? user?.[data] : user;
  },
);
