import { validateTierBrackets } from './tier-schedule.logic';
import { SCHEDULE_C_V2 } from './schedule-c-v2';

const brackets = SCHEDULE_C_V2.tiers.map((t) => ({
  tier_number: t.tier_number,
  min_count: t.min_count,
  max_count: t.max_count,
}));

describe('validateTierBrackets (COMM-001)', () => {
  it('accepts the Schedule C v2 schedule', () => {
    expect(() => validateTierBrackets(brackets)).not.toThrow();
  });

  it('rejects a gap between brackets', () => {
    expect(() =>
      validateTierBrackets([
        { tier_number: 2, min_count: 0, max_count: 5 },
        { tier_number: 1, min_count: 7, max_count: null }, // gap at 6
      ]),
    ).toThrow();
  });

  it('rejects overlapping brackets', () => {
    expect(() =>
      validateTierBrackets([
        { tier_number: 2, min_count: 0, max_count: 10 },
        { tier_number: 1, min_count: 5, max_count: null }, // overlaps 5..10
      ]),
    ).toThrow();
  });

  it('rejects more than one open-ended bracket', () => {
    expect(() =>
      validateTierBrackets([
        { tier_number: 2, min_count: 0, max_count: null },
        { tier_number: 1, min_count: 7, max_count: null },
      ]),
    ).toThrow();
  });

  it('rejects a schedule that does not start at 0', () => {
    expect(() =>
      validateTierBrackets([{ tier_number: 1, min_count: 1, max_count: null }]),
    ).toThrow();
  });

  it('rejects a schedule with no open-ended top bracket', () => {
    expect(() => validateTierBrackets([{ tier_number: 1, min_count: 0, max_count: 6 }])).toThrow();
  });
});
