import { resolvePayPeriod } from './pay-period.logic';

const d = (s: string) => new Date(`${s}T00:00:00.000Z`);

// Two adjacent bi-weekly periods.
const periodA = { id: 'A', start_date: d('2026-01-04'), end_date: d('2026-01-17') };
const periodB = { id: 'B', start_date: d('2026-01-18'), end_date: d('2026-01-31') };
const periods = [periodA, periodB];

describe('resolvePayPeriod (SALE-010 — sale_date governs)', () => {
  it('resolves the period containing the sale_date', () => {
    expect(resolvePayPeriod(d('2026-01-10'), periods)?.id).toBe('A');
    expect(resolvePayPeriod(d('2026-01-20'), periods)?.id).toBe('B');
  });

  it('a sale dated in period A belongs to A even if validated during period B', () => {
    // sale_date is in A; "validated_at" (period B) is irrelevant — only sale_date is used.
    const saleDate = d('2026-01-17'); // last day of A (Saturday)
    expect(resolvePayPeriod(saleDate, periods)?.id).toBe('A');
  });

  it('boundary dates are inclusive', () => {
    expect(resolvePayPeriod(d('2026-01-04'), periods)?.id).toBe('A'); // start
    expect(resolvePayPeriod(d('2026-01-31'), periods)?.id).toBe('B'); // end
  });

  it('returns null when no period contains the date', () => {
    expect(resolvePayPeriod(d('2025-12-31'), periods)).toBeNull();
    expect(resolvePayPeriod(d('2026-01-10'), [])).toBeNull();
  });
});
