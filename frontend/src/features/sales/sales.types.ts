/**
 * Sales types — RESPONSE shapes are hand-written (the backend OpenAPI declares no response schemas, so
 * the generated types are `never`). Kept in sync with `backend/src/modules/sales/`. REQUEST bodies ARE
 * typed from the generated schema (re-exported below) — openapi-fetch enforces them at the call site.
 * Remove the hand-written responses once the backend ships `@ApiResponse` DTOs (flagged follow-up).
 */
import type { components } from '../../api/generated/schema';

export type SaleStatus =
  | 'entered'
  | 'validated'
  | 'in_pay_run'
  | 'paid'
  | 'clawed_back'
  | 'deleted';

export type ProductType = 'internet' | 'tv' | 'home_phone' | 'greenfield_internet';

export interface SaleItem {
  id: string;
  product_id: string;
  product_type: ProductType;
  counts_toward_tally: boolean;
  item_status: string; // 'active' | 'cancelled' | 'clawed_back'
  // ── Frozen snapshot (set ONCE at pay-run finalize; non-null only on PAID items — #2). Read-only here.
  tier_at_payment: number | null;
  rate_applied: string | null; // decimal string — the tier/flat rate frozen at payment
  commission_paid: string | null; // decimal string — non-null = PAID (the clawable signal)
  incentive_id: string | null;
  incentive_amount: string | null; // decimal string — spiff frozen at payment
}

export interface PayPeriod {
  id: string;
  period_number: number;
  start_date: string;
  end_date: string;
}

export interface Sale {
  id: string;
  sale_code: string;
  sale_date: string;
  activation_date: string | null;
  rep_id: string;
  client_id: string;
  customer_name: string;
  street: string;
  city: string;
  province_state: string;
  postal_code: string;
  mpu_id: string | null;
  is_greenfield: boolean;
  status: SaleStatus;
  validated_by: string | null;
  validated_at: string | null;
  pay_run_id: string | null;
  created_at: string;
  sale_items: SaleItem[];
  pay_period: PayPeriod | null;
}

export interface BulkValidateResult {
  validated: number;
  failed: number;
  results: { id: string; ok: boolean; error?: string }[];
}

export interface Client {
  id: string;
  client_code: string;
  name: string;
  market: string;
  supplies_mpu_id: boolean;
  is_active: boolean;
}

export interface Product {
  id: string;
  client_id: string;
  name: string;
  product_type: ProductType;
  is_active: boolean;
}

/** Minimal rep shape for the on-behalf selector + rep filter (the full rep record lives in HRM). */
export interface Rep {
  id: string;
  rep_code: string;
  full_name: string;
  status: string;
}

export interface SalesFilters {
  status?: SaleStatus;
  rep_id?: string;
  client_id?: string;
  date_from?: string;
  date_to?: string;
}

// Request bodies — typed from the generated schema (the backend DID emit request DTOs).
export type CreateSaleBody = components['schemas']['CreateSaleDto'];
export type ValidateSaleBody = components['schemas']['ValidateSaleDto'];
export type SetGreenfieldBody = components['schemas']['SetGreenfieldDto'];
export type BulkValidateBody = components['schemas']['BulkValidateDto'];
