/**
 * DashboardsService — the four role-scoped read aggregations. EVERY read is scoped server-side in the
 * Prisma `where` (never post-filtered): rep = own `repId`, manager = roster, business = Super Admin
 * only, admin = operational queues. It recomputes NO money — every dollar is READ from already-computed
 * tables (`pay_run_lines`, `holdback_ledger`, `clawbacks`, `client_statements`); counts come from
 * `sales`/`sale_items`. Aggregation runs in the DB (groupBy/count/aggregate). — SRS §14, CLAUDE §3/§5
 */
import { ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma, SaleStatus } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { ScopeService } from '../../common/scope/scope.service';
import { AuthUser } from '../../common/rbac/auth-user.type';
import { BUILTIN_ROLES } from '../../common/rbac/rbac.constants';
import { selectEffectiveRate } from '../../common/effective-dating';
import { winnipegDateOnly } from '../../common/timezone';
import { currentPeriod } from './period.logic';
import { countToTier, TierBracket } from './tier-progress.logic';
import { DashboardQuery } from './dto/dashboard-query.dto';

const CONFIRMED: SaleStatus[] = ['validated', 'in_pay_run', 'paid'];
const money = (v: { toString(): string } | null | undefined): string =>
  new Decimal((v ?? 0).toString()).toFixed(2);
const isAdmin = (u: AuthUser): boolean => u.isSuperAdmin || u.roleNames.includes(BUILTIN_ROLES.ADMIN);

@Injectable()
export class DashboardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly scope: ScopeService,
  ) {}

  // ── REP — own data only ───────────────────────────────────────────────────────────
  async rep(user: AuthUser) {
    if (!user.repId) {
      await this.deny(user, 'rep dashboard requires a linked rep profile');
    }
    const repId = user.repId!;
    const period = await this.currentPeriodRow();
    const saleWhere: Prisma.SaleWhereInput = {
      rep_id: repId,
      status: { in: CONFIRMED },
      ...(period ? { sale_date: { gte: period.start_date, lte: period.end_date } } : {}),
    };

    const byProduct = await this.prisma.saleItem.groupBy({
      by: ['product_type'],
      where: { sale: saleWhere },
      _count: { _all: true },
    });
    const internetTally = await this.prisma.saleItem.count({
      where: { sale: saleWhere, product_type: 'internet', counts_toward_tally: true },
    });

    const commission = await this.prisma.payRunLine.aggregate({
      where: { rep_id: repId, ...(period ? { pay_run: { pay_period_id: period.id } } : {}) },
      _sum: { commission_70: true, holdback_release_30: true, net_payout: true, incentive_total: true },
    });
    const heldAgg = await this.prisma.holdbackLedger.aggregate({
      where: { rep_id: repId, release_status: { in: ['held', 'scheduled'] } },
      _sum: { amount_held: true },
    });
    const recentClawbacks = await this.prisma.clawback.findMany({
      where: { rep_id: repId },
      orderBy: { created_at: 'desc' },
      take: 5,
      select: { id: true, amount: true, reason: true, status: true, created_at: true },
    });

    return {
      period: period ? { id: period.id, period_number: period.period_number } : null,
      counts_by_product: byProduct.map((g) => ({ product_type: g.product_type, count: g._count._all })),
      internet_activations: internetTally,
      tier: countToTier(await this.effectiveTierBrackets(), internetTally),
      // Money — READ from frozen/computed pay-run lines + ledger (never recomputed). #1/#5
      commission: {
        commission_70: money(commission._sum.commission_70),
        holdback_release_30: money(commission._sum.holdback_release_30),
        incentive_total: money(commission._sum.incentive_total),
        net_payout: money(commission._sum.net_payout),
      },
      holdback_pending_release: money(heldAgg._sum.amount_held),
      recent_clawbacks: recentClawbacks.map((c) => ({ ...c, amount: money(c.amount) })),
    };
  }

  // ── MANAGER — roster only ───────────────────────────────────────────────────────────
  async manager(user: AuthUser) {
    const scope = await this.scope.getRepScope(user);
    if (scope.level === 'self') {
      await this.deny(user, 'manager dashboard requires a roster (you manage no reps)');
    }
    const repIds = scope.level === 'all' ? null : scope.repIds; // null = all (admin/SA)
    const period = await this.currentPeriodRow();
    const repFilter = repIds ? { in: repIds } : undefined;
    const saleWhere: Prisma.SaleWhereInput = {
      ...(repFilter ? { rep_id: repFilter } : {}),
      status: { in: CONFIRMED },
      ...(period ? { sale_date: { gte: period.start_date, lte: period.end_date } } : {}),
    };

    const teamInternet = await this.prisma.saleItem.count({
      where: { sale: saleWhere, product_type: 'internet', counts_toward_tally: true },
    });
    const pendingValidations = await this.prisma.sale.count({
      where: { ...(repFilter ? { rep_id: repFilter } : {}), status: 'entered' },
    });
    const pendingExpenseApprovals = await this.prisma.expenseReport.count({
      where: { ...(repFilter ? { rep_id: repFilter } : {}), status: 'submitted' },
    });
    const perRep = await this.prisma.saleItem.groupBy({
      by: ['sale_id'],
      where: { sale: saleWhere, product_type: 'internet', counts_toward_tally: true },
      _count: { _all: true },
    });

    return {
      period: period ? { id: period.id, period_number: period.period_number } : null,
      roster_size: repIds ? repIds.length : null,
      team_internet_activations: teamInternet,
      pending_validations: pendingValidations,
      pending_expense_approvals: pendingExpenseApprovals,
      sales_in_period: perRep.length,
    };
  }

  // ── BUSINESS — Super Admin only ─────────────────────────────────────────────────────
  async business(user: AuthUser, query: DashboardQuery) {
    if (!user.isSuperAdmin) {
      await this.deny(user, 'the business dashboard is Super Admin only');
    }
    const periodFilter = query.pay_period_id ? { pay_period_id: query.pay_period_id } : {};

    const revenue = await this.prisma.clientStatement.aggregate({
      where: periodFilter,
      _sum: { total_amount: true },
    });
    const payout = await this.prisma.payRunLine.aggregate({
      where: query.pay_period_id ? { pay_run: { pay_period_id: query.pay_period_id } } : {},
      _sum: { net_payout: true },
    });
    const holdbackLiability = await this.prisma.holdbackLedger.aggregate({
      where: { release_status: { in: ['held', 'scheduled'] } },
      _sum: { amount_held: true },
    });
    const clawbackTotal = await this.prisma.clawback.aggregate({ _sum: { amount: true } });
    const activeReps = await this.prisma.rep.count({ where: { status: 'active' } });

    const rev = new Decimal((revenue._sum.total_amount ?? 0).toString());
    const pay = new Decimal((payout._sum.net_payout ?? 0).toString());

    const topPerformers = await this.prisma.saleItem.groupBy({
      by: ['sale_id'],
      where: { product_type: 'internet', counts_toward_tally: true },
      _count: { _all: true },
      orderBy: { _count: { sale_id: 'desc' } },
      take: 5,
    });

    return {
      // net margin is a DISPLAY subtraction of two already-computed totals — not a money recompute.
      revenue: rev.toFixed(2),
      rep_payout: pay.toFixed(2),
      net_margin: rev.minus(pay).toFixed(2),
      holdback_liability: money(holdbackLiability._sum.amount_held),
      clawback_total: money(clawbackTotal._sum.amount),
      active_rep_count: activeReps,
      top_sales_in_period: topPerformers.length,
    };
  }

  // ── ADMIN — operational queues (counts) ─────────────────────────────────────────────
  async admin(user: AuthUser) {
    if (!isAdmin(user)) {
      await this.deny(user, 'the admin operational home is Admin/Super Admin only');
    }
    const [pendingValidations, pendingExpenseApprovals, pendingProfileChanges, pendingSignatures, draftPayRuns] =
      await Promise.all([
        this.prisma.sale.count({ where: { status: 'entered' } }),
        this.prisma.expenseReport.count({ where: { status: 'submitted' } }),
        this.prisma.profileChangeRequest.count({ where: { status: 'pending' } }),
        this.prisma.signatureRequest.count({ where: { status: 'pending' } }),
        this.prisma.payRun.count({ where: { status: 'draft' } }),
      ]);
    return {
      pending_validations: pendingValidations,
      pending_expense_approvals: pendingExpenseApprovals,
      pending_profile_changes: pendingProfileChanges,
      pending_signature_requests: pendingSignatures,
      draft_pay_runs: draftPayRuns,
    };
  }

  // ── internals ─────────────────────────────────────────────────────────────────────
  private async currentPeriodRow() {
    const periods = await this.prisma.payPeriod.findMany({
      select: { id: true, period_number: true, start_date: true, end_date: true },
    });
    return currentPeriod(periods, winnipegDateOnly()); // "today" in Winnipeg — CLAUDE §11
  }

  private async effectiveTierBrackets(): Promise<TierBracket[]> {
    const headers = await this.prisma.commissionTierConfig.findMany({ include: { tiers: true } });
    const header = selectEffectiveRate(headers, winnipegDateOnly());
    return (header?.tiers ?? []).map((t) => ({
      tier_number: t.tier_number,
      min_count: t.min_count,
      max_count: t.max_count,
    }));
  }

  private async deny(user: AuthUser, reason: string): Promise<never> {
    await this.audit.log({
      actorId: user.id,
      entityType: 'reports',
      entityId: user.id,
      action: 'access_denied',
      after: { reason },
    });
    throw new ForbiddenException(reason);
  }
}
