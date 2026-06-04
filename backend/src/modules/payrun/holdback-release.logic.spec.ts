import { resolveScheduledReleasePeriod } from './holdback-release.logic';

const d = (s: string) => new Date(`${s}T00:00:00.000Z`);
const periods = [
  { id: 'P1', start_date: d('2026-01-04'), payday: d('2026-01-30') },
  { id: 'P2', start_date: d('2026-01-18'), payday: d('2026-02-13') },
  { id: 'P3', start_date: d('2026-02-01'), payday: d('2026-02-27') },
  { id: 'P4', start_date: d('2026-02-15'), payday: d('2026-03-13') },
];

describe('resolveScheduledReleasePeriod (PROPOSED — SRS §17.1)', () => {
  it('schedules release in the first later period whose payday ≥ origin payday + 30 days', () => {
    // P1 payday 2026-01-30 → +30 = 2026-03-01 → first payday ≥ that is P4 (2026-03-13).
    expect(resolveScheduledReleasePeriod(periods[0], periods, 'next_cycle_after_30_days')?.id).toBe(
      'P4',
    );
  });

  it('returns null when no later period qualifies', () => {
    expect(
      resolveScheduledReleasePeriod(periods[3], periods, 'next_cycle_after_30_days'),
    ).toBeNull();
  });
});
