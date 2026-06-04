/**
 * Current-period resolution — PURE & deterministic. Picks the pay period whose [start,end] contains
 * `today`; if today falls in a gap, falls back to the most recent period that has started. One shared
 * definition so rep / manager / leaderboard figures reconcile. — SRS §14, CLAUDE §3 #7
 */
export interface PeriodRow {
  id: string;
  start_date: Date;
  end_date: Date;
}

export function currentPeriod<T extends PeriodRow>(periods: T[], today: Date): T | null {
  const t = today.getTime();
  const containing = periods.find(
    (p) => p.start_date.getTime() <= t && p.end_date.getTime() >= t,
  );
  if (containing) {
    return containing;
  }
  const started = periods
    .filter((p) => p.start_date.getTime() <= t)
    .sort((a, b) => b.start_date.getTime() - a.start_date.getTime());
  return started[0] ?? null;
}
