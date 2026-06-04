/**
 * AuthService — login, refresh, logout, and the /me identity payload.
 *
 * Login returns a generic error on any failure (bad email, wrong password, inactive account)
 * so it never reveals which part failed. Passwords are verified with bcryptjs; the hash is
 * never returned. — SRS AUTH-001/005/008, CLAUDE §3 (passwords)
 */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { AuthUser } from '../../common/rbac/auth-user.type';
import { USER_PUBLIC_SELECT } from '../../common/util/user-public';
import { TokenService } from './token.service';

export interface TokenPair {
  access_token: string;
  refresh_token: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    private readonly audit: AuditService,
  ) {}

  async login(email: string, password: string): Promise<TokenPair> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    // Generic failure — do not disclose whether the email exists or is inactive.
    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('Invalid credentials');
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    await this.audit.log({
      actorId: user.id,
      entityType: 'auth',
      entityId: user.id,
      action: 'login',
    });
    return this.issueTokens(user.id);
  }

  async refresh(refreshToken: string): Promise<{ access_token: string }> {
    let sub: string;
    try {
      ({ sub } = await this.tokens.verifyRefresh(refreshToken));
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: sub },
      select: { id: true, status: true },
    });
    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('Invalid refresh token');
    }
    return { access_token: await this.tokens.signAccess(user.id) };
  }

  async logout(user: AuthUser): Promise<void> {
    // Stateless tokens — logout is the client discarding them; recorded for the audit trail.
    await this.audit.log({
      actorId: user.id,
      entityType: 'auth',
      entityId: user.id,
      action: 'logout',
    });
  }

  /** Current user's profile + effective permissions (union of roles). — AUTH-005 */
  async me(user: AuthUser): Promise<{
    user: unknown;
    roles: string[];
    is_super_admin: boolean;
    rep_id: string | null;
    effective_permissions: string[];
  }> {
    const profile = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: USER_PUBLIC_SELECT,
    });
    return {
      user: profile,
      roles: user.roleNames,
      is_super_admin: user.isSuperAdmin,
      rep_id: user.repId,
      effective_permissions: [...user.permissions].sort(),
    };
  }

  private async issueTokens(userId: string): Promise<TokenPair> {
    const [access_token, refresh_token] = await Promise.all([
      this.tokens.signAccess(userId),
      this.tokens.signRefresh(userId),
    ]);
    return { access_token, refresh_token };
  }
}
