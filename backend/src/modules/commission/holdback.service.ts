/**
 * HoldbackService — the advance/holdback split (effective-dated) and the holdback-release setting.
 *
 * Split (COMM-003): advance_pct + holdback_pct must equal 1; effective-dated supersession.
 * Release setting (COMM-004) is **PROPOSED (SRS §17.1)** — stored only, bulk & sticky (a new row
 * supersedes the prior; latest wins). Its interpretation (which cycle the 30% releases into) is
 * DEFERRED to the Pay Run module + Redwave confirmation. This module performs NO release math.
 */
import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { Decimal } from 'decimal.js';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { deriveStatus, planSupersession, toUtcDateOnly } from '../../common/effective-dating';
import { parseEffectiveWindow } from './effective-dates.util';
import { SetHoldbackConfigDto, SetHoldbackReleaseSettingDto } from './dto/holdback.dto';

@Injectable()
export class HoldbackService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ── Advance/holdback split (effective-dated) ──────────────────────────────────────────────────

  async listConfig() {
    const today = toUtcDateOnly(new Date());
    const rows = await this.prisma.holdbackConfig.findMany({ orderBy: { effective_from: 'asc' } });
    return rows.map((r) => ({ ...r, status: deriveStatus(r, today) }));
  }

  async setConfig(dto: SetHoldbackConfigDto, actorId: string) {
    // The two fractions must sum to exactly 1 (no lost/created cents downstream). — COMM-003
    if (!new Decimal(dto.advance_pct).plus(dto.holdback_pct).equals(1)) {
      throw new UnprocessableEntityException('advance_pct + holdback_pct must equal 1');
    }
    const { from, to, today } = parseEffectiveWindow(dto.effective_from, dto.effective_to);

    const existing = await this.prisma.holdbackConfig.findMany({
      select: { id: true, effective_from: true, effective_to: true },
    });
    const plan = planSupersession(existing, from, today);

    const created = await this.prisma.$transaction(async (tx) => {
      if (plan.deletePendingIds.length > 0) {
        await tx.holdbackConfig.deleteMany({ where: { id: { in: plan.deletePendingIds } } });
      }
      if (plan.boundCurrent) {
        await tx.holdbackConfig.update({
          where: { id: plan.boundCurrent.id },
          data: { effective_to: plan.boundCurrent.effectiveTo },
        });
      }
      return tx.holdbackConfig.create({
        data: {
          advance_pct: dto.advance_pct, // decimal STRING → Prisma Decimal(5,4)
          holdback_pct: dto.holdback_pct,
          effective_from: from,
          effective_to: to,
        },
      });
    });

    await this.audit.log({
      actorId,
      entityType: 'holdback_config',
      entityId: created.id,
      action: 'create',
      after: {
        advance_pct: dto.advance_pct,
        holdback_pct: dto.holdback_pct,
        effective_from: dto.effective_from,
        effective_to: dto.effective_to ?? null,
        superseded_pending_ids: plan.deletePendingIds,
        bounded_current_id: plan.boundCurrent?.id ?? null,
      },
    });
    return { ...created, status: deriveStatus(created, today) };
  }

  // ── Holdback-release setting (PROPOSED §17.1 — bulk, sticky; stored only) ──────────────────────

  /** The current sticky setting (latest by effective_from). */
  getReleaseSetting() {
    return this.prisma.holdbackReleaseSetting.findFirst({ orderBy: { effective_from: 'desc' } });
  }

  /** Persist a new sticky setting. NO interpretation here — deferred to Pay Run (SRS §17.1). */
  async setReleaseSetting(dto: SetHoldbackReleaseSettingDto, actorId: string) {
    const created = await this.prisma.holdbackReleaseSetting.create({
      data: { release_rule: dto.release_rule, set_by: actorId, effective_from: new Date() },
    });
    await this.audit.log({
      actorId,
      entityType: 'holdback_release_settings',
      entityId: created.id,
      action: 'create',
      after: { release_rule: dto.release_rule },
    });
    return created;
  }
}
