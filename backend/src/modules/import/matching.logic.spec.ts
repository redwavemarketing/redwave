import { classifyHoldbackRow, classifyRateRow, classifySalesRow } from './matching.logic';

describe('classifySalesRow (bulk validation — SALE-007/IMP-010)', () => {
  it('exactly one entered match → matched + matched_entity_id', () => {
    const c = classifySalesRow({ mpu_id: 'X9' }, { matchedSaleIds: ['sale-1'] });
    expect(c.match_status).toBe('matched');
    expect(c.matched_entity_id).toBe('sale-1');
  });
  it('multiple entered matches → duplicate', () => {
    expect(classifySalesRow({ mpu_id: 'X9' }, { matchedSaleIds: ['a', 'b'] }).match_status).toBe('duplicate');
  });
  it('no match with an MPU → unmatched', () => {
    expect(classifySalesRow({ mpu_id: 'X9' }, { matchedSaleIds: [] }).match_status).toBe('unmatched');
  });
  it('no MPU at all → unmatched (manual match required)', () => {
    const c = classifySalesRow({}, { matchedSaleIds: [] });
    expect(c.match_status).toBe('unmatched');
    expect(c.issue).toMatch(/manual match/);
  });
});

describe('classifyRateRow (back-dated rates — #10)', () => {
  const good = { client_id: 'c1', product_id: 'p1', rate_kind: 'product', amount: '60.00', effective_from: '2025-01-01' };
  it('valid shape → matched (ready to insert)', () => {
    expect(classifyRateRow(good).match_status).toBe('matched');
  });
  it("rate_kind 'product' without product_id → error", () => {
    expect(classifyRateRow({ ...good, product_id: '' }).match_status).toBe('error');
  });
  it('non-decimal amount → error', () => {
    expect(classifyRateRow({ ...good, amount: '6o' }).match_status).toBe('error');
  });
  it('bad effective_from → error', () => {
    expect(classifyRateRow({ ...good, effective_from: '01/01/2025' }).match_status).toBe('error');
  });
});

describe('classifyHoldbackRow (opening balances — IMP-007)', () => {
  const base = { rep_id: 'r1', origin_pay_period_id: 'p1', amount_held: '993.00' };
  const ctx = { repExists: true, originPeriodStatus: 'closed' as const, ledgerExists: false };

  it('rep + closed origin + no existing ledger → matched', () => {
    expect(classifyHoldbackRow(base, ctx).match_status).toBe('matched');
  });
  it('OPEN origin period → error (would collide with a future finalize)', () => {
    expect(classifyHoldbackRow(base, { ...ctx, originPeriodStatus: 'open' }).match_status).toBe('error');
  });
  it('missing origin period → error', () => {
    expect(classifyHoldbackRow(base, { ...ctx, originPeriodStatus: null }).match_status).toBe('error');
  });
  it('rep not found → error', () => {
    expect(classifyHoldbackRow(base, { ...ctx, repExists: false }).match_status).toBe('error');
  });
  it('existing ledger row for rep+origin → duplicate (re-import guard)', () => {
    expect(classifyHoldbackRow(base, { ...ctx, ledgerExists: true }).match_status).toBe('duplicate');
  });
  it('non-decimal amount → error', () => {
    expect(classifyHoldbackRow({ ...base, amount_held: 'x' }, ctx).match_status).toBe('error');
  });
});
