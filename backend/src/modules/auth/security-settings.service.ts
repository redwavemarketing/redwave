/**
 * SecuritySettingsService — the singleton MFA-enforcement policy + per-role `mfa_required` flags.
 *
 * `mfa_enforced` gates whether `roles.mfa_required` actually forces enrollment at login. It defaults off so
 * MFA can be rolled out per-user without locking testers out; the SA flips it on once everyone's ready. The
 * Super Admin role is seeded `mfa_required = true`. — AUTH MFA, arch §security
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { UpdateSecuritySettingsDto } from './dto/security-settings.dto';

@Injectable()
export class SecuritySettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** The one settings row (created lazily, off by default). */
  private async ensureRow() {
    const existing = await this.prisma.securitySetting.findFirst();
    return existing ?? this.prisma.securitySetting.create({ data: { mfa_enforced: false } });
  }

  async get() {
    const row = await this.ensureRow();
    const roles = await this.prisma.role.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, mfa_required: true },
    });
    return { mfa_enforced: row.mfa_enforced, roles };
  }

  async update(dto: UpdateSecuritySettingsDto, actorId: string) {
    const row = await this.ensureRow();
    const before = { mfa_enforced: row.mfa_enforced };

    if (dto.mfa_enforced !== undefined) {
      await this.prisma.securitySetting.update({
        where: { id: row.id },
        data: { mfa_enforced: dto.mfa_enforced, updated_by: actorId },
      });
    }
    if (dto.role_mfa?.length) {
      await this.prisma.$transaction(
        dto.role_mfa.map((r) =>
          this.prisma.role.update({ where: { id: r.role_id }, data: { mfa_required: r.mfa_required } }),
        ),
      );
    }

    const result = await this.get();
    await this.audit.log({
      actorId,
      entityType: 'security_settings',
      entityId: row.id,
      action: 'update',
      before,
      after: { mfa_enforced: result.mfa_enforced, role_mfa: dto.role_mfa ?? [] },
    });
    return result;
  }
}
