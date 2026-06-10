import { tieOutPayRunLine, tieOutStatement } from './reconciliation.logic';

describe('tieOutStatement — billing tie-out (SRS §12)', () => {
  it('ties out when total = Σ lines = live re-price', () => {
    const r = tieOutStatement({ frozenTotal: '140.00', lineTotals: ['50.00', '90.00'], liveTotal: '140.00' });
    expect(r.ok).toBe(true);
    expect(r.discrepancies).toEqual([]);
    expect(r.lines_sum).toBe('140.00');
  });

  it('flags a stale statement (live re-price drifted from the frozen total)', () => {
    const r = tieOutStatement({ frozenTotal: '140.00', lineTotals: ['50.00', '90.00'], liveTotal: '160.00' });
    expect(r.ok).toBe(false);
    expect(r.statement_matches_live).toBe(false);
    expect(r.discrepancies.join(' ')).toMatch(/stale/i);
  });

  it('flags total ≠ sum of lines', () => {
    const r = tieOutStatement({ frozenTotal: '999.00', lineTotals: ['50.00', '90.00'], liveTotal: '140.00' });
    expect(r.ok).toBe(false);
    expect(r.total_equals_lines).toBe(false);
  });

  it('flags an un-repriceable period (null live total)', () => {
    const r = tieOutStatement({ frozenTotal: '140.00', lineTotals: ['140.00'], liveTotal: null });
    expect(r.ok).toBe(false);
    expect(r.live_total).toBeNull();
    expect(r.discrepancies.join(' ')).toMatch(/billing rate/i);
  });
});

describe('tieOutPayRunLine — pay-run tie-out (SRS §9)', () => {
  const line = (over: Partial<Record<string, string>> = {}) => ({
    rep_id: 'rep-1',
    rep_code: 'RW-D-001',
    commission_70: '2317.00',
    holdback_release_30: '0.00',
    expense_total: '0.00',
    incentive_total: '0.00',
    bonus_amount: '0.00',
    clawback_total: '0.00',
    net_payout: '2317.00',
    ...over,
  });

  it('ties out when net = advance + released + expense + incentive + bonus − clawback', () => {
    const r = tieOutPayRunLine(line({ holdback_release_30: '993.00', clawback_total: '100.00', net_payout: '3210.00' }));
    expect(r.recomputed_net).toBe('3210.00'); // 2317 + 993 − 100
    expect(r.ok).toBe(true);
  });

  it('flags a line whose stored net does not match its components', () => {
    const r = tieOutPayRunLine(line({ net_payout: '9999.00' }));
    expect(r.ok).toBe(false);
    expect(r.recomputed_net).toBe('2317.00');
    expect(r.stored_net).toBe('9999.00');
  });
});
