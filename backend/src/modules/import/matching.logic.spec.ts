import {
  classifyBillingRateRow,
  classifyClientRow,
  classifyHistoricalSaleRow,
  classifyHoldbackRow,
  classifyProductRow,
  classifyRepRow,
  classifySalesRow,
} from './matching.logic';

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

describe('classifyBillingRateRow (back-dated rates by code — #10)', () => {
  const good = { client_code: 'VF', product_name: 'Internet', rate_kind: 'product', amount: '60.00', effective_from: '2025-01-01' };
  const ctx = { clientExists: true, productExists: true };
  it('valid shape + existence → matched', () => {
    expect(classifyBillingRateRow(good, ctx).match_status).toBe('matched');
  });
  it("rate_kind 'product' without product_name → error", () => {
    expect(classifyBillingRateRow({ ...good, product_name: '' }, ctx).match_status).toBe('error');
  });
  it('non-decimal amount → error', () => {
    expect(classifyBillingRateRow({ ...good, amount: '6o' }, ctx).match_status).toBe('error');
  });
  it('client not found → error', () => {
    expect(classifyBillingRateRow(good, { ...ctx, clientExists: false }).match_status).toBe('error');
  });
});

describe('classifyClientRow / classifyProductRow / classifyRepRow', () => {
  it('client: needs code/name/market∈{CA,US}', () => {
    expect(classifyClientRow({ client_code: 'VF', name: 'Valley Fiber', market: 'CA' }, { existingClientId: null }).match_status).toBe('matched');
    expect(classifyClientRow({ client_code: 'VF', name: 'x', market: 'XX' }, { existingClientId: null }).match_status).toBe('error');
    // existing code → matched WITH the existing id (upsert/update)
    expect(classifyClientRow({ client_code: 'VF', name: 'x', market: 'CA' }, { existingClientId: 'c1' }).matched_entity_id).toBe('c1');
  });
  it('product: needs client + a catalogue product_type', () => {
    const row = { client_code: 'VF', name: 'Internet 1Gb', product_type: 'internet' };
    expect(classifyProductRow(row, { clientExists: true, productTypeExists: true }).match_status).toBe('matched');
    expect(classifyProductRow(row, { clientExists: false, productTypeExists: true }).match_status).toBe('error');
    expect(classifyProductRow(row, { clientExists: true, productTypeExists: false }).match_status).toBe('error');
  });
  it('rep: rep_code never reused (#11)', () => {
    const row = { rep_code: 'RW-D-0009', full_name: 'New Rep', hire_date: '2026-01-01' };
    expect(classifyRepRow(row, { codeExists: false }).match_status).toBe('matched');
    expect(classifyRepRow(row, { codeExists: true }).match_status).toBe('error'); // reuse rejected
  });
});

describe('classifyHistoricalSaleRow (reference-only)', () => {
  const good = { client_code: 'VF', rep_code: 'RW-D-0001', product_type: 'internet', sale_date: '2025-03-12', billed_amount: '60.00' };
  const ctx = { clientExists: true, repExists: true, productExists: true };
  it('valid + existing client/rep/product → matched', () => {
    expect(classifyHistoricalSaleRow(good, ctx).match_status).toBe('matched');
  });
  it('no product for the client+type → error (import products first)', () => {
    expect(classifyHistoricalSaleRow(good, { ...ctx, productExists: false }).match_status).toBe('error');
  });
  it('bad billed_amount → error', () => {
    expect(classifyHistoricalSaleRow({ ...good, billed_amount: 'x' }, ctx).match_status).toBe('error');
  });
});

describe('classifyHoldbackRow (opening balances — IMP-007)', () => {
  const base = { rep_code: 'RW-D-0001', origin_pay_period_id: 'p1', amount_held: '993.00' };
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
