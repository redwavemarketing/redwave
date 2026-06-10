/**
 * Reconciliation tie-out — PURE compare helpers (no I/O). Two INDEPENDENT checks (the two rate streams are
 * never joined — #3): the billing tie-out (statement total = Σ lines = Σ live-repriced sales) and the
 * pay-run tie-out (each line's net = its components; run total = Σ net). All comparisons are at the central
 * 2-dp money policy (string equality). — SRS §12 (reconciliation)
 */
import { Decimal } from 'decimal.js';
import { formatMoney, sumMoney } from '../../common/money/money';
import { computeNet } from '../payrun/line-amounts.logic';

export interface StatementTieOut {
  frozen_total: string;
  lines_sum: string;
  live_total: string | null;
  total_equals_lines: boolean;
  statement_matches_live: boolean;
  ok: boolean;
  discrepancies: string[];
}

/** Tie a statement: frozen total == Σ lines, and frozen total == the live re-price (else stale). */
export function tieOutStatement(args: {
  frozenTotal: Decimal.Value;
  lineTotals: Decimal.Value[];
  liveTotal: Decimal.Value | null; // null when the live re-price could not run (e.g. an unpriced product now)
}): StatementTieOut {
  const frozen = formatMoney(args.frozenTotal);
  const lines_sum = formatMoney(sumMoney(args.lineTotals));
  const live = args.liveTotal === null ? null : formatMoney(args.liveTotal);
  const total_equals_lines = frozen === lines_sum;
  const statement_matches_live = live !== null && frozen === live;
  const discrepancies: string[] = [];
  if (!total_equals_lines) discrepancies.push(`Statement total ${frozen} does not equal the sum of its lines ${lines_sum}.`);
  if (live === null) discrepancies.push('Could not re-price the period now (a sold product has no effective billing rate) — review billing rates.');
  else if (!statement_matches_live) discrepancies.push(`Statement total ${frozen} does not equal the live re-priced sales ${live} — the statement is stale; regenerate.`);
  return { frozen_total: frozen, lines_sum, live_total: live, total_equals_lines, statement_matches_live, ok: discrepancies.length === 0, discrepancies };
}

export interface PayRunLineTieOut {
  rep_id: string;
  rep_code: string | null;
  stored_net: string;
  recomputed_net: string;
  ok: boolean;
}

/** Recompute a pay-run line's net from its components and compare to the stored net_payout. */
export function tieOutPayRunLine(line: {
  rep_id: string;
  rep_code: string | null;
  commission_70: Decimal.Value;
  holdback_release_30: Decimal.Value;
  expense_total: Decimal.Value;
  incentive_total: Decimal.Value;
  bonus_amount: Decimal.Value;
  clawback_total: Decimal.Value;
  net_payout: Decimal.Value;
}): PayRunLineTieOut {
  const recomputed = computeNet({
    advance: new Decimal(line.commission_70),
    released: new Decimal(line.holdback_release_30),
    expense: new Decimal(line.expense_total),
    incentive: new Decimal(line.incentive_total),
    bonus: new Decimal(line.bonus_amount),
    clawback: new Decimal(line.clawback_total),
  });
  const stored_net = formatMoney(line.net_payout);
  const recomputed_net = formatMoney(recomputed);
  return { rep_id: line.rep_id, rep_code: line.rep_code, stored_net, recomputed_net, ok: stored_net === recomputed_net };
}
