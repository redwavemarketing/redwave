import { Decimal } from 'decimal.js';
import { CommissionConfigProvider } from '../commission/commission-config.provider';
import { CommissionEngineService } from '../engine/commission-engine.service';
import { SCHEDULE_C_V2 } from '../commission/schedule-c-v2';
import { ActivationInput } from '../engine/engine.types';
import { toActivationInput } from './activation-mapping.logic';
import { buildLineAmounts, computeNet } from './line-amounts.logic';

// ── Real CommissionConfigProvider over mocked Prisma returning the seeded Schedule C v2 ─────────
const GENESIS = new Date('2024-01-01T00:00:00.000Z');
const decLike = (s: string) => ({ toString: () => s });

function seededConfigPrisma() {
  return {
    commissionTierConfig: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'tc1',
          effective_from: GENESIS,
          effective_to: null,
          tiers: SCHEDULE_C_V2.tiers.map((t, i) => ({
            id: `t${i}`,
            tier_number: t.tier_number,
            min_count: t.min_count,
            max_count: t.max_count,
            rate_per_activation: decLike(t.rate_per_activation),
          })),
        },
      ]),
    },
    commissionFlatRate: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'f1',
          product_type: 'greenfield_internet',
          amount: decLike(SCHEDULE_C_V2.flatRates.greenfield_internet),
          effective_from: GENESIS,
          effective_to: null,
        },
        {
          id: 'f2',
          product_type: 'tv',
          amount: decLike(SCHEDULE_C_V2.flatRates.tv),
          effective_from: GENESIS,
          effective_to: null,
        },
        {
          id: 'f3',
          product_type: 'home_phone',
          amount: decLike(SCHEDULE_C_V2.flatRates.home_phone),
          effective_from: GENESIS,
          effective_to: null,
        },
      ]),
    },
    holdbackConfig: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'h1',
          advance_pct: decLike(SCHEDULE_C_V2.holdback.advance_pct),
          holdback_pct: decLike(SCHEDULE_C_V2.holdback.holdback_pct),
          effective_from: GENESIS,
          effective_to: null,
        },
      ]),
    },
    incentive: { findMany: jest.fn().mockResolvedValue([]) },
  };
}

describe('Pay-run line amounts END-TO-END (config → provider → engine → line)', () => {
  const engine = new CommissionEngineService();
  let seq = 0;
  // Build a "validated sale_item" and map it to an engine activation via the REAL Pay Run mapping.
  const item = (
    productType: string,
    countsTowardTally: boolean,
    clientId = 'VF',
  ): ActivationInput =>
    toActivationInput({
      id: `i${(seq += 1)}`,
      product_type: productType,
      counts_toward_tally: countsTowardTally,
      client_id: clientId,
      sale_date: '2026-01-10',
    });
  const many = (pt: string, counts: boolean, n: number, clientId?: string) =>
    Array.from({ length: n }, () => item(pt, counts, clientId));

  it('reproduces the $3,310 case → commission_70 2317.00, amount_held 993.00, incentive 0.00, net 2317.00', async () => {
    const config = await new CommissionConfigProvider(
      seededConfigPrisma() as never,
    ).getEngineConfig('2026-01-10');
    const activations = [
      ...many('internet', true, 20), // tiered
      ...many('tv', false, 4),
      ...many('home_phone', false, 3),
      ...many('internet', false, 2), // greenfield: internet product, counts_toward_tally=false → greenfield_internet
    ];
    const result = engine.computePeriod({ activations, config });
    const amounts = buildLineAmounts(result, {
      released: new Decimal(0),
      expense: new Decimal(0),
      bonus: new Decimal(0),
      clawback: new Decimal(0),
    });

    expect(result.tierNumber).toBe(2); // tally 20 → Tier 2 ($145); the 2 greenfield are excluded
    expect(result.grossCommission.toFixed(2)).toBe('3310.00');
    expect(amounts.commission_70.toFixed(2)).toBe('2317.00'); // 70%
    expect(amounts.amount_held.toFixed(2)).toBe('993.00'); // 30% → holdback ledger
    expect(amounts.incentive_total.toFixed(2)).toBe('0.00');
    expect(amounts.net_payout.toFixed(2)).toBe('2317.00'); // advance + 0 released/expense/incentive/bonus − 0 clawback
  });

  it('reproduces cross-client (3 VF + 9 RF internet → Tier 3 → gross 1500, commission_70 1050.00)', async () => {
    const config = await new CommissionConfigProvider(
      seededConfigPrisma() as never,
    ).getEngineConfig('2026-01-10');
    const activations = [...many('internet', true, 3, 'VF'), ...many('internet', true, 9, 'RF')];
    const result = engine.computePeriod({ activations, config });
    const amounts = buildLineAmounts(result, {
      released: new Decimal(0),
      expense: new Decimal(0),
      bonus: new Decimal(0),
      clawback: new Decimal(0),
    });

    expect(result.internetTally).toBe(12);
    expect(result.tierNumber).toBe(3);
    expect(result.grossCommission.toFixed(2)).toBe('1500.00');
    expect(amounts.commission_70.toFixed(2)).toBe('1050.00'); // 1500 × 0.70
    expect(amounts.amount_held.toFixed(2)).toBe('450.00'); // 1500 × 0.30
  });
});

describe('computeNet', () => {
  it('net = advance + released + expense + incentive + bonus − clawback', () => {
    const net = computeNet({
      advance: new Decimal('2317.00'),
      released: new Decimal('100.00'),
      expense: new Decimal('50.00'),
      incentive: new Decimal('20.00'),
      bonus: new Decimal('25.00'),
      clawback: new Decimal('30.00'),
    });
    expect(net.toFixed(2)).toBe('2482.00');
  });
});
