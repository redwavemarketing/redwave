/**
 * ClawbackPayrunProvider — the REAL implementation of Pay Run's CLAWBACK_TOTAL_PROVIDER seam.
 *
 * `getClawbackTotal` sums the rep's PENDING clawbacks (period-agnostic — they apply in the next
 * available run, CLAW-006); Pay Run folds it into net as a flat deduction (#6, no 70/30 sequencing).
 * `markApplied` runs INSIDE finalize's transaction to flip those pending clawbacks to applied + link
 * the run, so a clawback is deducted exactly once. — SRS CLAW-006/008
 */
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { PrismaService } from '../../prisma/prisma.service';
import { ClawbackTotalProvider } from '../payrun/seams/clawback-total.provider';

@Injectable()
export class ClawbackPayrunProvider implements ClawbackTotalProvider {
  constructor(private readonly prisma: PrismaService) {}

  async getClawbackTotal(repId: string): Promise<Decimal> {
    const pending = await this.prisma.clawback.findMany({
      where: { rep_id: repId, status: 'pending' },
      select: { amount: true },
    });
    return pending.reduce((sum, c) => sum.plus(new Decimal(c.amount.toString())), new Decimal(0));
  }

  async markApplied(
    repId: string,
    _payPeriodId: string,
    payRunId: string,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    await tx.clawback.updateMany({
      where: { rep_id: repId, status: 'pending' },
      data: { status: 'applied', applied_in_pay_run_id: payRunId },
    });
  }
}
