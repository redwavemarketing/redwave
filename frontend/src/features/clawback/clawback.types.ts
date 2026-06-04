/**
 * Clawback types — RESPONSE shapes hand-written (the backend declares no response schema, so generated
 * types are `never`). Mirrors `backend/src/modules/clawback/`. The clawback list/get returns FLAT records
 * (no nested sale/rep/product) — the UI links to the sale via `sale_id` and maps `applied_in_pay_run_id` to
 * a period via the pay-run list. The recovery `amount` is the SERVER's engine calc (rate + incentive off the
 * frozen snapshot) — the UI never computes it (#1/#6). REQUEST body typed from the generated schema.
 */
import type { components } from '../../api/generated/schema';

export type ClawbackStatus = 'pending' | 'applied';

export interface Clawback {
  id: string;
  sale_item_id: string;
  sale_id: string;
  rep_id: string;
  amount: string; // exact-decimal string — the server-computed (or overridden) recovery
  reason: string;
  reported_date: string; // informational only — drives no logic (#6)
  entered_by: string;
  applied_in_pay_run_id: string | null; // set when a pay run applies the deduction
  status: ClawbackStatus;
  created_at: string;
}

export interface ClawbackFilters {
  status?: ClawbackStatus;
  rep_id?: string;
  sale_id?: string;
}

// Request body — typed from the generated schema. `amount` is OPTIONAL: omit it to let the server compute
// the exact amount paid from the frozen snapshot (#1/#6); send a value only to override.
export type CreateClawbackBody = components['schemas']['CreateClawbackDto'];
