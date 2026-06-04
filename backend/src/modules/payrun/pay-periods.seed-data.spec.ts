import { generate2026PayPeriods } from './pay-periods.seed-data';

describe('generate2026PayPeriods (PAY-001)', () => {
  it('produces 26 bi-weekly periods anchored on Sunday 2026-01-04', () => {
    const periods = generate2026PayPeriods();
    expect(periods).toHaveLength(26);
    expect(periods[0]).toEqual({
      period_number: 1,
      start_date: '2026-01-04', // Sunday
      end_date: '2026-01-17', // Saturday (start + 13)
      payday: '2026-01-30', // end + 13
    });
    expect(periods[1].start_date).toBe('2026-01-18'); // next period starts 14 days later
    expect(periods[25].period_number).toBe(26);
  });
});
