/**
 * PasswordResetService — invite/forgot/reset token lifecycle (AUTH-002). A token is a random secret whose
 * HASH is stored (the plaintext only ever lives in the emailed link); single-use + expiring. `forgot` is
 * non-enumerating (always succeeds; only acts for an active user). `reset` enforces the strength policy,
 * sets the new hash, clears must-change + lockout, and consumes the token — all atomically.
 */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PasswordTokenPurpose } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { DomainError } from '../../common/errors/domain-error';
import { MailerService } from '../../common/email/mailer.service';
import { assertPasswordPolicy } from './password-policy';

const BCRYPT_ROUNDS = 12;
const sha256 = (s: string): string => createHash('sha256').update(s).digest('hex');
const intCfg = (config: ConfigService, key: string, fallback: number): number => {
  const raw = config.get<string>(key);
  const n = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

@Injectable()
export class PasswordResetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailer: MailerService,
    private readonly audit: AuditService,
    private readonly config: ConfigService,
  ) {}

  /** Mint a single-use token, persist its hash, and return the plaintext (for the emailed link). */
  async issueToken(userId: string, purpose: PasswordTokenPurpose): Promise<string> {
    const token = randomBytes(32).toString('hex');
    const ttlMin =
      purpose === 'invite'
        ? intCfg(this.config, 'INVITE_TOKEN_TTL_MINUTES', 60 * 24 * 7) // 7 days
        : intCfg(this.config, 'PASSWORD_RESET_TTL_MINUTES', 60); // 1 hour
    await this.prisma.passwordResetToken.create({
      data: { user_id: userId, token_hash: sha256(token), purpose, expires_at: new Date(Date.now() + ttlMin * 60_000) },
    });
    return token;
  }

  /** Self-service: always succeeds (no account enumeration); emails a reset link only for an active user. */
  async forgot(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, status: true, full_name: true, email: true },
    });
    if (user && user.status === 'active') {
      const token = await this.issueToken(user.id, 'reset');
      await this.mailer.sendPasswordReset(user.email, user.full_name, token);
    }
  }

  /** Consume a token + set the new password (policy-checked); clears must-change + lockout. */
  async reset(token: string, newPassword: string): Promise<void> {
    assertPasswordPolicy(newPassword);
    const row = await this.prisma.passwordResetToken.findUnique({ where: { token_hash: sha256(token) } });
    if (!row || row.used_at || row.expires_at.getTime() < Date.now()) {
      throw new DomainError('INVALID_TOKEN', 'This link is invalid or has expired. Request a new one.');
    }
    const password_hash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: row.user_id },
        data: { password_hash, must_change_password: false, failed_login_attempts: 0, locked_until: null },
      }),
      this.prisma.passwordResetToken.update({ where: { id: row.id }, data: { used_at: new Date() } }),
    ]);
    await this.audit.log({ actorId: row.user_id, entityType: 'users', entityId: row.user_id, action: 'password_reset' });
  }
}
