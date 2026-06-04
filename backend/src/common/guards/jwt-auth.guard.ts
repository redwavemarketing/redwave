/**
 * JwtAuthGuard — authentication (runs first, globally).
 *
 * Unless a route is @Public, it verifies the Bearer ACCESS token, loads the user with their
 * roles → permissions (+ rep link), REJECTS inactive accounts (immediate revocation —
 * SRS AUTH-008), builds the effective-permission set, and attaches an AuthUser to the request.
 * Permissions are recomputed every request, so role/status changes take effect immediately.
 * — SRS AUTH-001/005/006/008, arch §7
 */
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthUser } from '../rbac/auth-user.type';
import { buildEffectivePermissions } from '../rbac/permissions.util';
import { BUILTIN_ROLES } from '../rbac/rbac.constants';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const token = this.extractBearerToken(request);
    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    let sub: string;
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string }>(token, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
      sub = payload.sub;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const user = await this.loadAuthUser(sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    // Deactivated users are denied immediately while their records are retained. — AUTH-008
    if (user.status !== 'active') {
      throw new UnauthorizedException('Account is inactive');
    }

    request.user = user;
    return true;
  }

  private extractBearerToken(request: Request): string | null {
    const header = request.headers.authorization;
    if (!header) {
      return null;
    }
    const [scheme, value] = header.split(' ');
    return scheme === 'Bearer' && value ? value : null;
  }

  private async loadAuthUser(userId: string): Promise<AuthUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        full_name: true,
        status: true,
        user_roles: {
          select: {
            role: {
              select: {
                name: true,
                role_permissions: {
                  select: {
                    permission: {
                      select: { action: true, module: { select: { key: true } } },
                    },
                  },
                },
              },
            },
          },
        },
        rep_login: { select: { id: true } },
      },
    });
    if (!user) {
      return null;
    }

    const roles = user.user_roles.map((ur) => ur.role);
    const roleNames = roles.map((r) => r.name);
    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      status: user.status,
      roleNames,
      isSuperAdmin: roleNames.includes(BUILTIN_ROLES.SUPER_ADMIN),
      permissions: buildEffectivePermissions(roles),
      repId: user.rep_login?.id ?? null,
    };
  }
}
