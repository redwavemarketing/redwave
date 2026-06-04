import { Decimal } from 'decimal.js';
import { evaluateGate } from './reconcile-gate.logic';

const rows = (...statuses: string[]) => statuses.map((s) => ({ match_status: s as never }));

describe('evaluateGate (reconcile-before-commit — IMP-003/005/007, #8)', () => {
  it('passes when every row is matched or ignored', () => {
    expect(evaluateGate(rows('matched', 'matched', 'ignored')).ok).toBe(true);
  });

  it('blocks on any unmatched / duplicate / error row', () => {
    expect(evaluateGate(rows('matched', 'unmatched')).ok).toBe(false);
    expect(evaluateGate(rows('duplicate')).ok).toBe(false);
    expect(evaluateGate(rows('error')).ok).toBe(false);
  });

  it('balance migration: reconcile_total must equal the staged sum', () => {
    const ok = evaluateGate(rows('matched'), {
      reconcileTotal: new Decimal('48200.00'),
      stagedSum: new Decimal('48200.00'),
    });
    expect(ok.ok).toBe(true);

    const mismatch = evaluateGate(rows('matched'), {
      reconcileTotal: new Decimal('48200.00'),
      stagedSum: new Decimal('48100.00'),
    });
    expect(mismatch.ok).toBe(false);
    expect(mismatch.reason).toMatch(/does not match/);
  });

  it('balance migration: a missing reconcile_total is rejected', () => {
    expect(
      evaluateGate(rows('matched'), { reconcileTotal: null, stagedSum: new Decimal('1.00') }).ok,
    ).toBe(false);
  });
});
