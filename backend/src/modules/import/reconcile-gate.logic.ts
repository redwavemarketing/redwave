/**
 * Reconcile-before-commit GATE — PURE & deterministic. A batch may commit ONLY when no row is left
 * unresolved (unmatched / duplicate / error); `ignored` rows are intentionally excluded (skipped at
 * commit). For a balance migration the operator-provided `reconcile_total` must equal the staged sum
 * (IMP-007 — the source-total cross-check). This is the safety gate before any write to live tables.
 * — SRS §15 (IMP-003/005/007), CLAUDE §3 #8
 */
import { MatchStatus } from '@prisma/client';
import { Decimal } from 'decimal.js';

const UNRESOLVED: MatchStatus[] = ['unmatched', 'duplicate', 'error'];

export interface GateResult {
  ok: boolean;
  reason?: string;
}

/**
 * @param rows      every staged row's match_status.
 * @param financial for balance migrations only: the operator's reconcile_total + the staged sum.
 */
export function evaluateGate(
  rows: { match_status: MatchStatus }[],
  financial?: { reconcileTotal: Decimal | null; stagedSum: Decimal },
): GateResult {
  const unresolved = rows.filter((r) => UNRESOLVED.includes(r.match_status)).length;
  if (unresolved > 0) {
    return { ok: false, reason: `${unresolved} row(s) still need reconciliation` };
  }
  if (financial) {
    if (financial.reconcileTotal === null) {
      return { ok: false, reason: 'reconcile_total is required for a balance migration' };
    }
    if (!financial.reconcileTotal.equals(financial.stagedSum)) {
      return {
        ok: false,
        reason: `reconcile_total ${financial.reconcileTotal.toFixed(2)} does not match the staged sum ${financial.stagedSum.toFixed(2)}`,
      };
    }
  }
  return { ok: true };
}
