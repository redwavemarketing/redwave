import { todayInWinnipeg, winnipegDateOnly } from './timezone';
import { resolvePayPeriod } from '../modules/sales/pay-period.logic';

const d = (s: string): Date => new Date(`${s}T00:00:00.000Z`);

describe('timezone — America/Winnipeg is canonical (CLAUDE §11)', () => {
  it('a late-night Winnipeg instant resolves to the Winnipeg calendar day, not the UTC day', () => {
    // 2026-06-15T04:30Z = 2026-06-14 23:30 in Winnipeg (CDT = UTC-5 in summer).
    expect(todayInWinnipeg(new Date('2026-06-15T04:30:00Z'))).toBe('2026-06-14');
  });

  it('handles DST automatically (winter is CST = UTC-6)', () => {
    // 2026-01-15T05:30Z = 2026-01-14 23:30 in Winnipeg (CST = UTC-6).
    expect(todayInWinnipeg(new Date('2026-01-15T05:30:00Z'))).toBe('2026-01-14');
    // Mid-day UTC is the same calendar day either way.
    expect(todayInWinnipeg(new Date('2026-06-15T17:00:00Z'))).toBe('2026-06-15');
  });

  it('winnipegDateOnly is the UTC-midnight of the Winnipeg day', () => {
    expect(winnipegDateOnly(new Date('2026-06-15T04:30:00Z')).toISOString()).toBe(
      '2026-06-14T00:00:00.000Z',
    );
  });

  it('a boundary sale lands in the correct period under Winnipeg (not the naive-UTC period)', () => {
    // P11 = 2026-05-24..2026-06-06 ; P12 = 2026-06-07..2026-06-20.
    const periods = [
      { id: 'P11', start_date: d('2026-05-24'), end_date: d('2026-06-06') },
      { id: 'P12', start_date: d('2026-06-07'), end_date: d('2026-06-20') },
    ];
    // A sale entered at 2026-06-07T03:00Z = 2026-06-06 22:00 Winnipeg → defaults to the Winnipeg day
    // 2026-06-06, which is still in P11.
    const winnipegToday = todayInWinnipeg(new Date('2026-06-07T03:00:00Z'));
    expect(winnipegToday).toBe('2026-06-06');
    expect(resolvePayPeriod(d(winnipegToday), periods)?.id).toBe('P11');
    // Naive UTC would have used 2026-06-07 → wrongly P12.
    expect(resolvePayPeriod(d('2026-06-07'), periods)?.id).toBe('P12');
  });
});
