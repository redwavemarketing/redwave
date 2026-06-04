/**
 * ExpensePayrunProvider — the REAL implementation of Pay Run's EXPENSE_TOTAL_PROVIDER seam.
 *
 * Sums the rep's APPROVED expense items for a pay period; Pay Run folds it into net. This is a
 * READ-ONLY seam — no finalize hook: each report's `pay_period_id` was fixed at submit (from its
 * week_start, #7), so the sum is period-scoped, and Pay Run's own finalize idempotency guarantees
 * an approved report is paid exactly once. — SRS §11 / arch §9 (composed, not coupled)
 */
import { Injectable } from '@nestjs/common';
import { Decimal } from 'decimal.js';
import { PrismaService } from '../../prisma/prisma.service';
import { ExpenseTotalProvider } from '../payrun/seams/expense-total.provider';

@Injectable()
export class ExpensePayrunProvider implements ExpenseTotalProvider {
  constructor(private readonly prisma: PrismaService) {}

  async getApprovedExpenseTotal(repId: string, payPeriodId: string): Promise<Decimal> {
    const items = await this.prisma.expenseItem.findMany({
      where: {
        expense_report: { rep_id: repId, pay_period_id: payPeriodId, status: 'approved' },
      },
      select: { amount: true },
    });
    return items.reduce((sum, i) => sum.plus(new Decimal(i.amount.toString())), new Decimal(0));
  }
}
