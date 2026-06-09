/**
 * TargetsService — minimal sales-target CRUD (RPT-008). A target is a COUNT goal (internet activations) per
 * rep per pay period — NOT money — stored on the existing `sales_targets` entity (period date range). Reads
 * are scoped (rep=own, manager=roster, admin=all); writes require hrm:edit AND that the rep is in scope
 * (a manager can only set their roster). Powers the rep "target progress" + manager "target-vs-actual".
 */
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { ScopeService } from '../../common/scope/scope.service';
import { AuthUser } from '../../common/rbac/auth-user.type';
import { ListSalesTargetsQuery, SetSalesTargetDto } from './dto/sales-target.dto';

@Injectable()
export class TargetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly scope: ScopeService,
  ) {}

  /** List targets, scoped to the caller (rep=own, manager=roster, admin/SA=all). Optional period filter. */
  async list(user: AuthUser, query: ListSalesTargetsQuery) {
    const repScope = await this.scope.getRepScope(user);
    const where: Prisma.SalesTargetWhereInput = {};
    if (repScope.level !== 'all') {
      where.rep_id = { in: repScope.repIds }; // never another roster's targets
    }
    if (query.pay_period_id) {
      const period = await this.prisma.payPeriod.findUnique({ where: { id: query.pay_period_id }, select: { start_date: true, end_date: true } });
      if (period) {
        where.period_start = period.start_date;
        where.period_end = period.end_date;
      }
    }
    return this.prisma.salesTarget.findMany({
      where,
      select: { id: true, rep_id: true, target_count: true, period_start: true, period_end: true },
    });
  }

  /** Upsert a rep's target for a period. Requires hrm:edit (controller) + the rep in the caller's scope. */
  async set(user: AuthUser, dto: SetSalesTargetDto) {
    const repScope = await this.scope.getRepScope(user);
    if (repScope.level === 'self') {
      throw new ForbiddenException('Only a manager/admin can set targets');
    }
    if (repScope.level === 'roster' && !repScope.repIds.includes(dto.rep_id)) {
      throw new ForbiddenException('You can only set targets for reps you manage');
    }
    const period = await this.prisma.payPeriod.findUnique({ where: { id: dto.pay_period_id }, select: { start_date: true, end_date: true } });
    if (!period) {
      throw new NotFoundException('Pay period not found');
    }
    const existing = await this.prisma.salesTarget.findFirst({
      where: { rep_id: dto.rep_id, period_start: period.start_date, period_end: period.end_date },
      select: { id: true },
    });
    const result = existing
      ? await this.prisma.salesTarget.update({ where: { id: existing.id }, data: { target_count: dto.target_count, set_by: user.id } })
      : await this.prisma.salesTarget.create({
          data: {
            rep_id: dto.rep_id,
            target_type: 'monthly', // per-period bucket — the enum has no per-period value; behaviour keys off the date range
            target_count: dto.target_count,
            period_start: period.start_date,
            period_end: period.end_date,
            set_by: user.id,
          },
        });
    await this.audit.log({
      actorId: user.id,
      entityType: 'sales_targets',
      entityId: result.id,
      action: existing ? 'update' : 'create',
      after: { rep_id: dto.rep_id, pay_period_id: dto.pay_period_id, target_count: dto.target_count },
    });
    return result;
  }
}
