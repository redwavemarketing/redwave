/**
 * Pure holdback-release scheduling — PROPOSED (SRS §17.1), pending Redwave confirmation.
 *
 * Default rule `next_cycle_after_30_days`: a period's 30% holdback is scheduled to release in the
 * FIRST later period whose payday is ≥ the origin period's payday + 30 days. Isolated here so the
 * rule can change in one place once Redwave confirms it. — SRS §17.1, CLAUDE §12
 */
export interface ReleasePeriod {
  id: string;
  start_date: Date;
  payday: Date;
}

export function resolveScheduledReleasePeriod<T extends ReleasePeriod>(
  origin: ReleasePeriod,
  periods: T[],
  releaseRule: string,
): T | null {
  // Only one rule is implemented; unrecognized rules fall back to the same behavior (flagged proposed).
  const offsetDays = releaseRule === 'next_cycle_after_30_days' ? 30 : 30;
  const minPayday = new Date(origin.payday);
  minPayday.setUTCDate(minPayday.getUTCDate() + offsetDays);

  return (
    periods
      .filter(
        (p) =>
          p.start_date.getTime() > origin.start_date.getTime() && // strictly a later period
          p.payday.getTime() >= minPayday.getTime(),
      )
      .sort((a, b) => a.payday.getTime() - b.payday.getTime())[0] ?? null
  );
}
