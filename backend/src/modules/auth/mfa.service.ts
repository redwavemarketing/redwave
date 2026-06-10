/**
 * MfaService — TOTP two-factor authentication + one-time recovery codes, with a per-role policy gate.
 *
 * Enrollment is two-step: `setup` stores an UNCONFIRMED secret + returns the otpauth URL/QR; `enable`
 * verifies a first code, flips `enabled`, and returns 10 recovery codes ONCE (hashed at rest). Login calls
 * `loginGate`: an enrolled user must always pass `verifyChallenge`; a user whose role requires MFA but who
 * isn't enrolled is flagged for enrollment (a session is still issued so testers aren't locked out — the
 * enforcement toggle defaults off). Recovery codes are single-use. — AUTH MFA, arch §security
 */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';

export type LoginGate = 'none' | 'required' | 'enrollment_required';

const RECOVERY_CODE_COUNT = 10;
const BCRYPT_ROUNDS = 10;

// Allow ±1 time-step (±30s) for clock drift between the device and server.
authenticator.options = { window: 1 };

@Injectable()
export class MfaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly config: ConfigService,
  ) {}

  private issuer(): string {
    return this.config.get<string>('MFA_ISSUER', 'Redwave ERP');
  }

  /** Decide what login must do for this user. — AUTH MFA */
  async loginGate(userId: string): Promise<LoginGate> {
    const mfa = await this.prisma.userMfa.findUnique({ where: { user_id: userId }, select: { enabled: true } });
    if (mfa?.enabled) return 'required';
    if (!(await this.isEnforced())) return 'none';
    const requiredRole = await this.prisma.userRole.findFirst({
      where: { user_id: userId, role: { mfa_required: true } },
      select: { role_id: true },
    });
    return requiredRole ? 'enrollment_required' : 'none';
  }

  async isEnforced(): Promise<boolean> {
    const s = await this.prisma.securitySetting.findFirst({ select: { mfa_enforced: true } });
    return s?.mfa_enforced ?? false;
  }

  async status(userId: string): Promise<{ enabled: boolean }> {
    const mfa = await this.prisma.userMfa.findUnique({ where: { user_id: userId }, select: { enabled: true } });
    return { enabled: mfa?.enabled ?? false };
  }

  /** Begin enrollment: store an unconfirmed secret, return the provisioning URL + QR data-URL. */
  async setup(userId: string, email: string): Promise<{ otpauth_url: string; qr_data_url: string; secret: string }> {
    const secret = authenticator.generateSecret();
    await this.prisma.userMfa.upsert({
      where: { user_id: userId },
      update: { secret, enabled: false, confirmed_at: null },
      create: { user_id: userId, secret, enabled: false },
    });
    const otpauth_url = authenticator.keyuri(email, this.issuer(), secret);
    const qr_data_url = await QRCode.toDataURL(otpauth_url);
    return { otpauth_url, qr_data_url, secret };
  }

  /** Confirm enrollment with a first code → enable + return fresh recovery codes (shown ONCE). */
  async enable(userId: string, code: string): Promise<{ recovery_codes: string[] }> {
    const mfa = await this.prisma.userMfa.findUnique({ where: { user_id: userId } });
    if (!mfa) throw new UnauthorizedException('Start MFA setup first');
    if (mfa.enabled) throw new UnauthorizedException('MFA is already enabled');
    if (!authenticator.verify({ token: normalizeTotp(code), secret: mfa.secret })) {
      throw new UnauthorizedException('Invalid authentication code');
    }
    const codes = Array.from({ length: RECOVERY_CODE_COUNT }, () => generateRecoveryCode());
    await this.prisma.$transaction([
      this.prisma.userMfa.update({ where: { user_id: userId }, data: { enabled: true, confirmed_at: new Date() } }),
      this.prisma.mfaRecoveryCode.deleteMany({ where: { user_id: userId } }),
      this.prisma.mfaRecoveryCode.createMany({
        data: await hashAll(codes, userId),
      }),
    ]);
    await this.audit.log({ actorId: userId, entityType: 'user_mfa', entityId: userId, action: 'mfa_enabled' });
    return { recovery_codes: codes };
  }

  /** Turn MFA off — requires a valid current code (TOTP or recovery). */
  async disable(userId: string, code: string): Promise<void> {
    const mfa = await this.prisma.userMfa.findUnique({ where: { user_id: userId } });
    if (!mfa || !mfa.enabled) return; // already off
    await this.assertCode(userId, mfa.secret, code);
    await this.clear(userId);
    await this.audit.log({ actorId: userId, entityType: 'user_mfa', entityId: userId, action: 'mfa_disabled' });
  }

  /** Admin/SA disables a user's MFA (no code) — e.g. lost device. — AUTH MFA */
  async adminDisable(userId: string, actorId: string): Promise<void> {
    await this.clear(userId);
    await this.audit.log({ actorId, entityType: 'user_mfa', entityId: userId, action: 'mfa_admin_disabled' });
  }

  /** Verify a login challenge code (TOTP first, then a single-use recovery code). Throws 401 if invalid. */
  async verifyChallenge(userId: string, code: string): Promise<void> {
    const mfa = await this.prisma.userMfa.findUnique({ where: { user_id: userId } });
    if (!mfa || !mfa.enabled) throw new UnauthorizedException('MFA is not enabled');
    await this.assertCode(userId, mfa.secret, code);
  }

  private async assertCode(userId: string, secret: string, code: string): Promise<void> {
    const totp = normalizeTotp(code);
    if (/^\d{6}$/.test(totp) && authenticator.verify({ token: totp, secret })) return;
    // Fall back to a recovery code (consumed on use).
    const recovery = normalizeRecovery(code);
    const candidates = await this.prisma.mfaRecoveryCode.findMany({ where: { user_id: userId, used_at: null } });
    for (const rc of candidates) {
      if (await bcrypt.compare(recovery, rc.code_hash)) {
        await this.prisma.mfaRecoveryCode.update({ where: { id: rc.id }, data: { used_at: new Date() } });
        return;
      }
    }
    throw new UnauthorizedException('Invalid authentication code');
  }

  private async clear(userId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.mfaRecoveryCode.deleteMany({ where: { user_id: userId } }),
      this.prisma.userMfa.deleteMany({ where: { user_id: userId } }),
    ]);
  }
}

const normalizeTotp = (code: string): string => code.replace(/\s+/g, '');
const normalizeRecovery = (code: string): string => code.replace(/[\s-]+/g, '').toUpperCase();

/** A recovery code like `A1B2-C3D4-E5F6` (12 unambiguous base32 chars). */
function generateRecoveryCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I
  const bytes = randomBytes(12);
  let out = '';
  for (let i = 0; i < 12; i += 1) {
    out += alphabet[bytes[i] % alphabet.length];
    if (i === 3 || i === 7) out += '-';
  }
  return out;
}

async function hashAll(codes: string[], userId: string): Promise<{ user_id: string; code_hash: string }[]> {
  return Promise.all(
    codes.map(async (c) => ({ user_id: userId, code_hash: await bcrypt.hash(normalizeRecovery(c), BCRYPT_ROUNDS) })),
  );
}
