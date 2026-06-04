/**
 * Row classification — PURE & deterministic (no I/O). Given a row's mapped data plus the context the
 * service pre-fetched from the DB, decide the row's `match_status` + an operator-facing `issue`. All
 * DB lookups (matching sales, rep/period existence, existing ledger) happen in the service and are
 * passed in as primitives, keeping this fully unit-testable. — SRS §15 (IMP-003/004/005/007)
 */
import { MatchStatus } from '@prisma/client';
import { RawRow } from './mapping.logic';

export interface Classification {
  match_status: MatchStatus;
  issue: string | null;
  matched_entity_id?: string;
}

const MONEY = /^\d+(\.\d{1,2})?$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const str = (row: RawRow, key: string): string | null => {
  const v = row[key];
  return v === undefined || v === null || v === '' ? null : String(v);
};

const matched = (id?: string): Classification => ({
  match_status: 'matched',
  issue: null,
  ...(id ? { matched_entity_id: id } : {}),
});
const error = (issue: string): Classification => ({ match_status: 'error', issue });

// ── client_report + sales (bulk validation; SALE-007 / IMP-010) ──────────────────────────────────
/** `matchedSaleIds` = the `entered` sales the service found for this row's MPU + client. */
export function classifySalesRow(
  mapped: RawRow,
  ctx: { matchedSaleIds: string[] },
): Classification {
  const mpuId = str(mapped, 'mpu_id');
  if (ctx.matchedSaleIds.length === 1) {
    return matched(ctx.matchedSaleIds[0]);
  }
  if (ctx.matchedSaleIds.length > 1) {
    return { match_status: 'duplicate', issue: `multiple entered sales match MPU ${mpuId}` };
  }
  return {
    match_status: 'unmatched',
    issue: mpuId ? `no entered sale matches MPU ${mpuId}` : 'no MPU ID — manual match required',
  };
}

// ── master_migration + clients (back-dated billing rates; #10) ───────────────────────────────────
/** Shape validation only; client/product existence is added by the service. */
export function classifyRateRow(mapped: RawRow): Classification {
  const client_id = str(mapped, 'client_id');
  const rate_kind = str(mapped, 'rate_kind');
  const amount = str(mapped, 'amount');
  const effective_from = str(mapped, 'effective_from');
  const product_id = str(mapped, 'product_id');
  const effective_to = str(mapped, 'effective_to');

  if (!client_id) return error('client_id is required');
  if (!rate_kind) return error('rate_kind is required');
  if (rate_kind === 'product' && !product_id) return error("rate_kind 'product' requires a product_id");
  if (!amount || !MONEY.test(amount)) return error('amount must be a decimal string (≤2 dp)');
  if (!effective_from || !DATE.test(effective_from)) return error('effective_from must be YYYY-MM-DD');
  if (effective_to && !DATE.test(effective_to)) return error('effective_to must be YYYY-MM-DD');
  return matched();
}

// ── balance_migration + holdback (opening balances; IMP-007) ─────────────────────────────────────
/** ctx is pre-fetched by the service: rep existence, origin period status, and any existing ledger row. */
export function classifyHoldbackRow(
  mapped: RawRow,
  ctx: { repExists: boolean; originPeriodStatus: 'open' | 'closed' | 'paid' | null; ledgerExists: boolean },
): Classification {
  const rep_id = str(mapped, 'rep_id');
  const origin = str(mapped, 'origin_pay_period_id');
  const amount = str(mapped, 'amount_held');

  if (!rep_id) return error('rep_id is required');
  if (!origin) return error('origin_pay_period_id is required');
  if (!amount || !MONEY.test(amount)) return error('amount_held must be a decimal string (≤2 dp)');
  if (!ctx.repExists) return error('rep not found');
  if (ctx.originPeriodStatus === null) return error('origin pay period not found');
  // An OPEN origin would collide with a future finalize's freeze-once slot and underpay the rep. — seam
  if (ctx.originPeriodStatus === 'open') {
    return error('origin pay period is open — opening balances require a closed/paid period');
  }
  // Idempotent against re-import: one opening balance per rep + origin (mirrors Pay Run freeze-once).
  if (ctx.ledgerExists) {
    return { match_status: 'duplicate', issue: 'a holdback already exists for this rep + origin period' };
  }
  return matched();
}
