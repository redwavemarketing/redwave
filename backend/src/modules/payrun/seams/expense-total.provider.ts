/**
 * Expense seam — the clean input boundary for "approved expense total for a rep + pay period".
 *
 * The Expenses module does not exist yet, so the default `ZeroExpenseTotalProvider` resolves to 0.
 * When Expenses is built it re-binds `EXPENSE_TOTAL_PROVIDER` to a real implementation — Pay Run
 * code does not change. Same seam pattern as the engine config provider. — arch §9 (composed, not coupled)
 */
import { Injectable } from '@nestjs/common';
import { Decimal } from 'decimal.js';

export const EXPENSE_TOTAL_PROVIDER = Symbol('EXPENSE_TOTAL_PROVIDER');

export interface ExpenseTotalProvider {
  /** Approved expense total to pay this rep in this pay period (exact decimal). */
  getApprovedExpenseTotal(repId: string, payPeriodId: string): Promise<Decimal>;
}

@Injectable()
export class ZeroExpenseTotalProvider implements ExpenseTotalProvider {
  async getApprovedExpenseTotal(): Promise<Decimal> {
    return new Decimal(0);
  }
}
