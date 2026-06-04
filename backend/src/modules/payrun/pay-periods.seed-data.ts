/**
 * Pure generator for the 2026 bi-weekly pay-period schedule. — SRS PAY-001
 *
 * Periods run Sunday→Saturday (14 days); payday is ~13 days after close. Anchor is the first Sunday
 * of 2026 (2026-01-04). The exact Redwave anchor/payday offset is an ASSUMPTION pending confirmation
 * (flagged in CLAUDE §12). Pure & deterministic — used by the seed.
 */
export interface SeedPayPeriod {
  period_number: number;
  start_date: string; // 'YYYY-MM-DD' (Sunday)
  end_date: string; // 'YYYY-MM-DD' (Saturday)
  payday: string; // 'YYYY-MM-DD'
}

const ANCHOR = '2026-01-04'; // first Sunday of 2026
const PERIOD_DAYS = 14;
const PAYDAY_OFFSET_DAYS = 13; // payday = end_date + 13 days

function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function generate2026PayPeriods(count = 26): SeedPayPeriod[] {
  const periods: SeedPayPeriod[] = [];
  for (let i = 0; i < count; i += 1) {
    const start = addDays(ANCHOR, i * PERIOD_DAYS);
    const end = addDays(start, PERIOD_DAYS - 1);
    periods.push({
      period_number: i + 1,
      start_date: start,
      end_date: end,
      payday: addDays(end, PAYDAY_OFFSET_DAYS),
    });
  }
  return periods;
}
