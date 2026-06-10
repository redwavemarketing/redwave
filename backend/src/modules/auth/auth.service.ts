/**
 * AuthService — login, refresh, logout, and the /me identity payload.
 *
 * Login returns a generic error on any failure (bad email, wrong password, inactive account)
 * so it never reveals which part failed. Passwords are verified with bcryptjs; the hash is
 * never returned. — SRS AUTH-001/005/008, CLAUDE §3 (passwords)
 */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { AuthUser } from '../../common/rbac/auth-user.type';
import { USER_PUBLIC_SELECT } from '../../common/util/user-public';
import { TokenService } from './token.service';

export interface TokenPair {
  access_token: string;
  refresh_token: string;
}

export interface LoginResult extends TokenPair {
  /** When true, the user must change their password before doing anything (invite / admin reset). */
  must_change_password: boolean;
}

const intCfg = (config: ConfigService, key: string, fallback: number): number => {
  const raw = config.get<string>(key);
  const n = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    private readonly audit: AuditService,
    private readonly config: ConfigService,
  ) {}

  async login(email: string, password: string): Promise<LoginResult> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    // Generic failure — do not disclose whether the email exists or is inactive.
    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('Invalid credentials');
    }
    // Brute-force lockout: refuse while the account is locked (the only non-generic message — it helps a
    // genuine user being targeted, and the attacker already knows the email). — SRS AUTH-002 (lockout)
    if (user.locked_until && user.locked_until.getTime() > Date.now()) {
      throw new UnauthorizedException('Account temporarily locked after too many failed attempts. Try again later or reset your password.');
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      await this.registerFailedAttempt(user.id, user.failed_login_attempts);
      throw new UnauthorizedException('Invalid credentials');
    }
    // Success → clear any failure counter / lock.
    if (user.failed_login_attempts > 0 || user.locked_until) {
      await this.prisma.user.update({ where: { id: user.id }, data: { failed_login_attempts: 0, locked_until: null } });
    }
    await this.audit.log({ actorId: user.id, entityType: 'auth', entityId: user.id, action: 'login' });
    const tokens = await this.issueTokens(user.id);
    return { ...tokens, must_change_password: user.must_change_password };
  }

  /** Increment the failed-login counter; lock the account once it reaches the configured maximum. */
  private async registerFailedAttempt(userId: string, current: number): Promise<void> {
    const max = intCfg(this.config, 'LOCKOUT_MAX_ATTEMPTS', 5);
    const minutes = intCfg(this.config, 'LOCKOUT_MINUTES', 15);
    const attempts = current + 1;
    const data: Prisma.UserUpdateInput =
      attempts >= max
        ? { failed_login_attempts: 0, locked_until: new Date(Date.now() + minutes * 60_000) } // reset count for a fresh window after the lock
        : { failed_login_attempts: attempts };
    await this.prisma.user.update({ where: { id: userId }, data });
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
