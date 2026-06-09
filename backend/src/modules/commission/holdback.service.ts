/**
 * HoldbackService — the advance/holdback split (effective-dated) and the holdback-release setting.
 *
 * Split (COMM-003): advance_pct + holdback_pct must equal 1; effective-dated supersession.
 * Release setting (COMM-004) is **PROPOSED (SRS §17.1)** — stored only, bulk & sticky (a new row
 * supersedes the prior; latest wins). Its interpretation (which cycle the 30% releases into) is
 * DEFERRED to the Pay Run module + Redwave confirmation. This module performs NO release math.
 */
import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { Decimal } from 'decimal.js';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { deriveStatus, planSupersession, previousDay, toUtcDateOnly } from '../../common/effective-dating';
import { parseEffectiveWindow } from './effective-dates.util';
import { assertPending, resolveEditWindow } from './effective-edit.util';
import { SetHoldbackConfigDto, SetHoldbackReleaseSettingDto, UpdateHoldbackConfigDto } from './dto/holdback.dto';

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

  /** Edit a PENDING split. The resulting advance_pct + holdback_pct must still equal 1. — #10 */
  async updateConfig(id: string, dto: UpdateHoldbackConfigDto, actorId: string) {
    const row = await this.prisma.holdbackConfig.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException('Holdback split not found');
    }
    assertPending(row);
    const advance = dto.advance_pct ?? row.advance_pct.toString();
    const holdback = dto.holdback_pct ?? row.holdback_pct.toString();
    if (!new Decimal(advance).plus(holdback).equals(1)) {
      throw new UnprocessableEntityException('advance_pct + holdback_pct must equal 1');
    }
    const { from, to, today } = resolveEditWindow(row, dto);

    const others = await this.prisma.holdbackConfig.findMany({
      where: { id: { not: id } },
      select: { id: true, effective_from: true, effective_to: true },
    });
    const plan = planSupersession(others, from, today);

    const updated = await this.prisma.$transaction(async (tx) => {
      if (plan.deletePendingIds.length > 0) {
        await tx.holdbackConfig.deleteMany({ where: { id: { in: plan.deletePendingIds } } });
      }
      if (plan.boundCurrent) {
        await tx.holdbackConfig.update({
          where: { id: plan.boundCurrent.id },
          data: { effective_to: plan.boundCurrent.effectiveTo },
        });
      }
      return tx.holdbackConfig.update({
        where: { id },
        data: { advance_pct: advance, holdback_pct: holdback, effective_from: from, effective_to: to },
      });
    });

    await this.audit.log({ actorId, entityType: 'holdback_config', entityId: id, action: 'update', before: row, after: updated });
    return { ...updated, status: deriveStatus(updated, toUtcDateOnly(new Date())) };
  }

  /** Delete a PENDING split; re-open any predecessor it had bounded (no gap). — #10 */
  async removeConfig(id: string, actorId: string) {
    const row = await this.prisma.holdbackConfig.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException('Holdback split not found');
    }
    assertPending(row);
    const predecessorEnd = previousDay(row.effective_from);
    await this.prisma.$transaction(async (tx) => {
      await tx.holdbackConfig.delete({ where: { id } });
      await tx.holdbackConfig.updateMany({ where: { effective_to: predecessorEnd }, data: { effective_to: null } });
    });
    await this.audit.log({ actorId, entityType: 'holdback_config', entityId: id, action: 'delete', before: row });
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
