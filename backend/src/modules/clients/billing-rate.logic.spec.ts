import {
  dateOnly,
  deriveStatus,
  planSupersession,
  previousDay,
  selectEffectiveRate,
} from './billing-rate.logic';

const D = dateOnly;
const TODAY = D('2026-06-15');

describe('billing-rate.logic', () => {
  describe('deriveStatus', () => {
    it('past when effective_to is before today', () => {
      expect(
        deriveStatus(
          { id: 'a', effective_from: D('2026-01-01'), effective_to: D('2026-05-31') },
          TODAY,
        ),
      ).toBe('past');
    });
    it('current when effective now and open-ended', () => {
      expect(
        deriveStatus({ id: 'b', effective_from: D('2026-06-01'), effective_to: null }, TODAY),
      ).toBe('current');
    });
    it('current on the inclusive end date', () => {
      expect(
        deriveStatus(
          { id: 'b2', effective_from: D('2026-06-15'), effective_to: D('2026-06-15') },
          TODAY,
        ),
      ).toBe('current');
    });
    it('pending when effective_from is in the future', () => {
      expect(
        deriveStatus({ id: 'c', effective_from: D('2026-07-01'), effective_to: null }, TODAY),
      ).toBe('pending');
    });
  });

  describe('selectEffectiveRate — correct row across a multi-change history', () => {
    const rates = [
      { id: 'r1', effective_from: D('2026-01-01'), effective_to: D('2026-03-31') }, // rate A
      { id: 'r2', effective_from: D('2026-04-01'), effective_to: null }, // rate B (current/open)
      { id: 'r3', effective_from: D('2026-08-01'), effective_to: null }, // rate C (pending)
    ];

    it('returns the row in force on each date', () => {
      expect(selectEffectiveRate(rates, D('2026-02-15'))?.id).toBe('r1');
      expect(selectEffectiveRate(rates, D('2026-03-31'))?.id).toBe('r1'); // inclusive end
      expect(selectEffectiveRate(rates, D('2026-04-01'))?.id).toBe('r2'); // inclusive start
      expect(selectEffectiveRate(rates, D('2026-07-31'))?.id).toBe('r2');
      expect(selectEffectiveRate(rates, D('2026-08-01'))?.id).toBe('r3'); // latest start ≤ date wins
      expect(selectEffectiveRate(rates, D('2025-12-31'))).toBeNull(); // before any rate
    });
  });

  describe('planSupersession', () => {
    it('deletes the pending rate, bounds the current open rate, leaves past untouched', () => {
      const existing = [
        { id: 'past', effective_from: D('2026-01-01'), effective_to: D('2026-03-31') },
        { id: 'current', effective_from: D('2026-04-01'), effective_to: null },
        { id: 'pending', effective_from: D('2026-07-01'), effective_to: null },
      ];
      const plan = planSupersession(existing, D('2026-09-01'), TODAY);
      expect(plan.deletePendingIds).toEqual(['pending']);
      expect(plan.boundCurrent).toEqual({
        id: 'current',
        effectiveTo: previousDay(D('2026-09-01')),
      }); // 2026-08-31
      expect(plan.deletePendingIds).not.toContain('past');
    });

    it('bounds the current rate to yesterday when the new rate starts today', () => {
      const existing = [{ id: 'current', effective_from: D('2026-06-01'), effective_to: null }];
      const plan = planSupersession(existing, TODAY, TODAY);
      expect(plan.boundCurrent).toEqual({ id: 'current', effectiveTo: previousDay(TODAY) }); // 2026-06-14
      expect(plan.deletePendingIds).toEqual([]);
    });

    it('does not bound a current rate that already ends before the new start (no overlap)', () => {
      const existing = [
        { id: 'current', effective_from: D('2026-06-01'), effective_to: D('2026-06-30') },
      ];
      const plan = planSupersession(existing, D('2026-09-01'), TODAY);
      expect(plan.boundCurrent).toBeNull();
    });

    it('empty plan when there are no existing rows', () => {
      expect(planSupersession([], D('2026-09-01'), TODAY)).toEqual({
        deletePendingIds: [],
        boundCurrent: null,
      });
    });
  });
});
