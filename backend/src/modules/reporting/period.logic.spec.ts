import { currentPeriod, PeriodRow } from './period.logic';

const D = (s: string) => new Date(`${s}T00:00:00.000Z`);
const periods: PeriodRow[] = [
  { id: 'p1', start_date: D('2026-01-04'), end_date: D('2026-01-17') },
  { id: 'p2', start_date: D('2026-01-18'), end_date: D('2026-01-31') },
  { id: 'p3', start_date: D('2026-02-01'), end_date: D('2026-02-14') },
];

describe('currentPeriod (pure)', () => {
  it('returns the period containing today', () => {
    expect(currentPeriod(periods, D('2026-01-20'))?.id).toBe('p2');
  });
  it('falls back to the most recent started period when today is in a gap / after the last', () => {
    expect(currentPeriod(periods, D('2026-03-01'))?.id).toBe('p3');
  });
  it('returns null when no period has started yet', () => {
    expect(currentPeriod(periods, D('2025-12-01'))).toBeNull();
  });
});
