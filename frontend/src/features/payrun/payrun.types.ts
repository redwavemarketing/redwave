/**
 * Pay Run types — RESPONSE shapes hand-written (the backend declares no response schema, so generated
 * types are `never`). Mirrors `backend/src/modules/payrun/`. All money is an exact-decimal STRING — the UI
 * NEVER does money arithmetic on it (#1/#5); it only displays via money()/sumMoney(). REQUEST bodies are
 * typed from the generated schema (re-exported). Keep in sync with the backend.
 */
import type { components } from '../../api/generated/schema';

export type PayPeriodStatus = 'open' | 'closed' | 'paid';
export type PayRunStatus = 'draft' | 'finalized' | 'exported';
export type HoldbackReleaseStatus = 'held' | 'scheduled' | 'released';
export type ExportFormat = 'csv' | 'json';

export interface PayPeriod {
  id: string;
  period_number: number;
  start_date: string;
  end_date: string;
  payday: string;
  status: PayPeriodStatus;
}

export interface RepLite {
  id: string;
  rep_code: string;
  full_name: string;
}

/**
 * One per-rep computed line. The server provides ONLY these components + the net — there is no tier, no
 * gross, and no current-period 30%-held on the line (those would require UI math; the 30% held is on the
 * holdback ledger after finalize). net = advance + released + expense + incentive + bonus − clawback,
 * and CAN be negative (rendered clearly, never floored).
 */
export interface PayRunLine {
  id: string;
  pay_run_id: string;
  rep_id: string;
  rep: RepLite;
  commission_70: string; // 70% advance (engine gross × advance_pct)
  holdback_release_30: string; // prior holds released into this period
  expense_total: string;
  incentive_total: string;
  bonus_amount: string;
  bonus_note: string | null;
  clawback_total: string;
  net_payout: string;
}

/** A pay-run header as returned by the list endpoint (no lines). */
export interface PayRunSummary {
  id: string;
  pay_period_id: string;
  pay_period: PayPeriod;
  run_date: string;
  status: PayRunStatus;
  executed_by: string;
  created_at: string;
}

/** A pay run with its computed lines (draft / get / finalize responses). */
export interface PayRun extends PayRunSummary {
  lines: PayRunLine[];
}

export interface HoldbackLedgerEntry {
  id: string;
  rep_id: string;
  origin_pay_period_id: string;
  amount_held: string;
  scheduled_release_period_id: string | null;
  release_status: HoldbackReleaseStatus;
  released_in_pay_run_id: string | null;
  amount_released: string | null;
  clawback_applied: string | null;
}

export interface HoldbackFilters {
  rep_id?: string;
  status?: HoldbackReleaseStatus;
}

/** The export action's response (no dedicated table — the audit row is the record). */
export interface ExportResult {
  pay_run_id: string;
  format: ExportFormat;
  line_count: number;
  content: string;
}

// Request bodies — typed from the generated schema (the backend DID emit request DTOs).
export type CreatePayRunBody = components['schemas']['CreatePayRunDto'];
export type SetBonusBody = components['schemas']['SetBonusDto'];
export type ExportPayRunBody = components['schemas']['ExportPayRunDto'];
