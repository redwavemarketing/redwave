/**
 * Pure pay-period resolution — sale_date GOVERNS. — SRS SALE-010, CLAUDE §3 #7
 *
 * The `sales` table has no pay_period_id FK, so a sale's pay period is DERIVED from its sale_date
 * (never from validation/activation date): the period whose [start_date, end_date] contains
 * sale_date. A sale validated in a later period still belongs to its sale_date period.
 */
export interface PeriodRow {
  id: string;
  start_date: Date;
  end_date: Date;
}

export function resolvePayPeriod<T extends PeriodRow>(saleDate: Date, periods: T[]): T | null {
  const t = saleDate.getTime();
  return periods.find((p) => p.start_date.getTime() <= t && t <= p.end_date.getTime()) ?? null;
}
