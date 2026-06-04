/**
 * Billing types — RESPONSE shapes hand-written (the backend declares no response schema, so generated types
 * are `never`). Mirrors `backend/src/modules/billing/`. This is the CLIENT-FACING BILLING stream: a statement
 * is priced SOLELY from client_billing_rates by the SERVER (#3) — there is NO commission field here, ever.
 * Money is an exact-decimal STRING; the UI prices nothing (#1). REQUEST bodies typed from the generated schema.
 */
import type { components } from '../../api/generated/schema';

/** ONE LINE PER CUSTOMER — the backend aggregates a sale's products into a single line. */
export interface ClientStatementLine {
  id: string;
  statement_id: string;
  sale_id: string;
  customer_name: string;
  products_summary: string; // e.g. "Internet, TV, Home Phone"
  line_total: string; // exact-decimal — sum of the customer's products (server-priced)
}

export interface ClientStatement {
  id: string;
  client_id: string;
  pay_period_id: string;
  total_amount: string; // server-computed statement total (no client-side sum)
  file_url: string;
  generated_by: string;
  generated_at: string;
  lines?: ClientStatementLine[]; // present on GET /statements/{id}; absent on the list
}

/** The one-line commission invoice — total_commission == the statement total (billing stream only, #3). */
export interface ClientInvoice {
  id: string;
  client_id: string;
  pay_period_id: string;
  total_commission: string;
  file_url: string;
  generated_at: string;
}

/** A 422 unpriced-product detail (from the error body) — surfaced helpfully so the user can add a rate. */
export interface UnpricedDetail {
  product_id: string;
  product_name: string;
  sale_date: string;
}

export interface BillingFilters {
  client_id?: string;
  pay_period_id?: string;
}

/** The export action's response (stub file_url; the audit row is the record). */
export interface BillingExportResult {
  statement_id?: string;
  invoice_id?: string;
  format: 'pdf' | 'excel';
  file_url: string;
  content?: string;
}

// Request bodies — typed from the generated schema.
export type GenerateBillingBody = components['schemas']['GenerateBillingDto'];
export type BillingExportBody = components['schemas']['BillingExportDto'];
