import { Decimal } from 'decimal.js';
import { CommissionEngineService } from './commission-engine.service';
import { d } from './money';
import {
  ActivationInput,
  EngineConfig,
  FlatRates,
  HoldbackSplit,
  IncentiveConfig,
  ProductType,
  TierBracket,
} from './engine.types';

const { internet, greenfield_internet, tv, home_phone } = ProductType;

// ── Standard config fixture (Schedule C v2 — CLAUDE §6 / SRS §7.2) ──────────────────────────
const TIERS: TierBracket[] = [
  { tierNumber: 4, minCount: 0, maxCount: 6, ratePerActivation: d('110') },
  { tierNumber: 3, minCount: 7, maxCount: 16, ratePerActivation: d('125') },
  { tierNumber: 2, minCount: 17, maxCount: 35, ratePerActivation: d('145') },
  { tierNumber: 1, minCount: 36, maxCount: null, ratePerActivation: d('160') },
];
const FLAT: FlatRates = { greenfield_internet: d('100'), tv: d('30'), home_phone: d('30') };
const SPLIT: HoldbackSplit = { advancePct: d('0.70'), holdbackPct: d('0.30') };

const baseConfig = (overrides: Partial<EngineConfig> = {}): EngineConfig => ({
  tiers: TIERS,
  flatRates: FLAT,
  holdback: SPLIT,
  ...overrides,
});

// ── Activation builders ─────────────────────────────────────────────────────────────────────
let seq = 0;
const mk = (
  productType: ProductType,
  clientId = 'VF',
  saleDate = '2026-01-10',
): ActivationInput => ({ id: `item-${(seq += 1)}`, productType, clientId, saleDate });
const mkMany = (productType: ProductType, n: number, clientId?: string, saleDate?: string) =>
  Array.from({ length: n }, () => mk(productType, clientId, saleDate));

/** Assert a Decimal equals an expected cents string (e.g. '3310.00'). */
const money = (value: Decimal) => value.toFixed(2);

describe('CommissionEngineService', () => {
  const engine = new CommissionEngineService();

  // ─────────────────────────── MANDATORY FIXTURES (the acceptance bar) ───────────────────────

  it('FIXTURE 1 — $3,310 case: 20 internet + 4 TV + 3 HP + 2 greenfield', () => {
    const activations = [
      ...mkMany(internet, 20),
      ...mkMany(tv, 4),
      ...mkMany(home_phone, 3),
      ...mkMany(greenfield_internet, 2),
    ];
    const r = engine.computePeriod({ activations, config: baseConfig() });

    expect(r.internetTally).toBe(20);
    expect(r.tierNumber).toBe(2);
    expect(money(r.ratePerActivation as Decimal)).toBe('145.00');
    expect(money(r.grossCommission)).toBe('3310.00'); // 2900 + 120 + 90 + 200
    expect(money(r.advanceAmount)).toBe('2317.00'); // 70%
    expect(money(r.holdbackAmount)).toBe('993.00'); // 30%
    expect(money(r.advanceAmount.plus(r.holdbackAmount))).toBe('3310.00'); // no lost cent
    expect(money(r.incentiveTotal)).toBe('0.00');

    const internetItems = r.items.filter((i) => i.productType === internet);
    expect(internetItems).toHaveLength(20);
    expect(
      internetItems.every(
        (i) => money(i.rateApplied) === '145.00' && i.tierAtPayment === 2 && i.countsTowardTally,
      ),
    ).toBe(true);

    const greenfieldItems = r.items.filter((i) => i.productType === greenfield_internet);
    expect(
      greenfieldItems.every(
        (i) =>
          !i.countsTowardTally && i.tierAtPayment === null && money(i.rateApplied) === '100.00',
      ),
    ).toBe(true);
  });

  it('FIXTURE 2 — cross-client aggregation: 3 VF + 9 RF internet → tally 12 → Tier 3, all at $125', () => {
    const activations = [...mkMany(internet, 3, 'VF'), ...mkMany(internet, 9, 'RF')];
    const r = engine.computePeriod({ activations, config: baseConfig() });

    expect(r.internetTally).toBe(12); // aggregated across BOTH clients (per-client would be wrong)
    expect(r.tierNumber).toBe(3);
    expect(r.items).toHaveLength(12);
    expect(r.items.every((i) => money(i.rateApplied) === '125.00')).toBe(true);
    expect(money(r.grossCommission)).toBe('1500.00');
  });

  it('FIXTURE 3 — tier boundary: 16 internet → Tier 3 ($125); 17 internet → Tier 2 ($145)', () => {
    const r16 = engine.computePeriod({ activations: mkMany(internet, 16), config: baseConfig() });
    expect(r16.tierNumber).toBe(3);
    expect(money(r16.ratePerActivation as Decimal)).toBe('125.00');
    expect(money(r16.grossCommission)).toBe('2000.00'); // 16 × 125

    const r17 = engine.computePeriod({ activations: mkMany(internet, 17), config: baseConfig() });
    expect(r17.tierNumber).toBe(2);
    expect(money(r17.ratePerActivation as Decimal)).toBe('145.00');
    expect(money(r17.grossCommission)).toBe('2465.00'); // 17 × 145
  });

  it('FIXTURE 4 — per-product clawback: TV → $30; TV + $20 incentive → $50; internet untouched, no re-tier', () => {
    expect(money(engine.computeClawbackAmount({ rateApplied: d('30') }))).toBe('30.00');
    expect(
      money(engine.computeClawbackAmount({ rateApplied: d('30'), incentiveAmount: d('20') })),
    ).toBe('50.00');

    // A household: 1 internet (Tier 4) + 1 TV. Clawing back the TV is independent of the internet.
    const r = engine.computePeriod({ activations: [mk(internet), mk(tv)], config: baseConfig() });
    const tvItem = r.items.find((i) => i.productType === tv);
    const internetItem = r.items.find((i) => i.productType === internet);
    expect(
      money(
        engine.computeClawbackAmount({
          rateApplied: tvItem!.rateApplied,
          incentiveAmount: tvItem!.incentiveAmount,
        }),
      ),
    ).toBe('30.00');
    // Internet activation untouched; the period is not re-tiered (engine is stateless).
    expect(internetItem!.tierAtPayment).toBe(4);
    expect(money(internetItem!.commissionPaid)).toBe('110.00');
    expect(r.internetTally).toBe(1);
  });

  // ─────────────────────────── EDGE / BOUNDARY CASES ─────────────────────────────────────────

  it('EDGE — zero activations: tally 0, tier null, all totals 0', () => {
    const r = engine.computePeriod({ activations: [], config: baseConfig() });
    expect(r.internetTally).toBe(0);
    expect(r.tierNumber).toBeNull();
    expect(r.ratePerActivation).toBeNull();
    expect(r.items).toEqual([]);
    expect(money(r.grossCommission)).toBe('0.00');
    expect(money(r.advanceAmount)).toBe('0.00');
    expect(money(r.holdbackAmount)).toBe('0.00');
    expect(money(r.incentiveTotal)).toBe('0.00');
  });

  it('EDGE — only greenfield: excluded from tally, flat-rated, tier null', () => {
    const r = engine.computePeriod({
      activations: mkMany(greenfield_internet, 3),
      config: baseConfig(),
    });
    expect(r.internetTally).toBe(0);
    expect(r.tierNumber).toBeNull();
    expect(money(r.grossCommission)).toBe('300.00'); // 3 × 100
    expect(money(r.advanceAmount)).toBe('210.00');
    expect(money(r.holdbackAmount)).toBe('90.00');
    expect(
      r.items.every(
        (i) =>
          !i.countsTowardTally && money(i.rateApplied) === '100.00' && i.tierAtPayment === null,
      ),
    ).toBe(true);
  });

  it('EDGE — tier edges 6/7/35/36', () => {
    const cases: Array<[number, number, string]> = [
      [6, 4, '110.00'],
      [7, 3, '125.00'],
      [35, 2, '145.00'],
      [36, 1, '160.00'],
    ];
    for (const [count, tier, rate] of cases) {
      const r = engine.computePeriod({
        activations: mkMany(internet, count),
        config: baseConfig(),
      });
      expect(r.tierNumber).toBe(tier);
      expect(money(r.ratePerActivation as Decimal)).toBe(rate);
    }
  });

  it('EDGE — per_activation incentive: applied to scope, kept OUT of the 70/30 base', () => {
    const incentive: IncentiveConfig = {
      id: 'inc-1',
      scopeClientId: null,
      scopeProductType: tv,
      targetType: 'per_activation',
      targetCount: null,
      windowStart: '2026-01-01',
      windowEnd: '2026-01-31',
      amount: d('20'),
    };
    const activations = [mk(internet, 'VF', '2026-01-10'), mk(tv, 'VF', '2026-01-10')];
    const r = engine.computePeriod({
      activations,
      config: baseConfig({ incentives: [incentive] }),
    });

    const tvItem = r.items.find((i) => i.productType === tv);
    expect(money(tvItem!.incentiveAmount)).toBe('20.00');
    expect(tvItem!.incentiveId).toBe('inc-1');
    expect(money(tvItem!.commissionBase)).toBe('30.00'); // base excludes incentive
    expect(money(tvItem!.commissionPaid)).toBe('50.00'); // snapshot = base + incentive

    const internetItem = r.items.find((i) => i.productType === internet);
    expect(money(internetItem!.incentiveAmount)).toBe('0.00'); // out of scope (tv only)

    expect(money(r.grossCommission)).toBe('140.00'); // 110 + 30, base only
    expect(money(r.incentiveTotal)).toBe('20.00'); // separate, full-paid
    expect(money(r.advanceAmount)).toBe('98.00'); // 70% of 140
    expect(money(r.holdbackAmount)).toBe('42.00'); // 30% of 140
    expect(money(r.totalEarned)).toBe('160.00'); // 140 + 20
  });

  it('EDGE — incentive does NOT apply outside its window or scope', () => {
    const outOfWindow: IncentiveConfig = {
      id: 'inc-w',
      scopeClientId: null,
      scopeProductType: tv,
      targetType: 'per_activation',
      targetCount: null,
      windowStart: '2026-02-01',
      windowEnd: '2026-02-28',
      amount: d('20'),
    };
    const r1 = engine.computePeriod({
      activations: [mk(tv, 'VF', '2026-01-10')],
      config: baseConfig({ incentives: [outOfWindow] }),
    });
    expect(money(r1.items[0].incentiveAmount)).toBe('0.00');
    expect(money(r1.grossCommission)).toBe('30.00');

    const wrongProduct: IncentiveConfig = {
      ...outOfWindow,
      id: 'inc-p',
      scopeProductType: home_phone,
      windowStart: '2026-01-01',
      windowEnd: '2026-01-31',
    };
    const r2 = engine.computePeriod({
      activations: [mk(tv, 'VF', '2026-01-10')],
      config: baseConfig({ incentives: [wrongProduct] }),
    });
    expect(money(r2.items[0].incentiveAmount)).toBe('0.00');
  });

  it('EDGE — rounding: HALF_UP at the split, holdback = gross − advance (no lost cent)', () => {
    const config = baseConfig({ flatRates: { ...FLAT, tv: d('100.05') } });
    const r = engine.computePeriod({ activations: [mk(tv)], config });
    expect(money(r.grossCommission)).toBe('100.05');
    expect(money(r.advanceAmount)).toBe('70.04'); // 100.05 × 0.70 = 70.035 → HALF_UP 70.04
    expect(money(r.holdbackAmount)).toBe('30.01'); // 100.05 − 70.04
    expect(money(r.advanceAmount.plus(r.holdbackAmount))).toBe('100.05');
  });

  it('EDGE — snapshot integrity: per-item tier/rate frozen; greenfield & flats have null tier', () => {
    const r = engine.computePeriod({
      activations: [...mkMany(internet, 2), mk(tv), mk(greenfield_internet)],
      config: baseConfig(),
    });
    const internetItems = r.items.filter((i) => i.productType === internet);
    expect(
      internetItems.every(
        (i) =>
          i.tierAtPayment === 4 &&
          money(i.rateApplied) === '110.00' &&
          money(i.commissionPaid) === '110.00',
      ),
    ).toBe(true);
    expect(r.items.find((i) => i.productType === greenfield_internet)!.tierAtPayment).toBeNull();
    expect(r.items.find((i) => i.productType === tv)!.tierAtPayment).toBeNull();
    expect(r.items).toHaveLength(4);
  });
});
