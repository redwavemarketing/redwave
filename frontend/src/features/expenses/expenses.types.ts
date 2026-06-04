/**
 * Expenses types — RESPONSE shapes hand-written (the backend declares no response schema, so generated
 * types are `never`). Mirrors `backend/src/modules/expenses/`. REQUEST bodies are typed from the generated
 * schema (re-exported). Money/km amounts are decimal STRINGS; the km amount is computed SERVER-SIDE. Keep
 * in sync with the backend.
 */
import type { components } from '../../api/generated/schema';

export type ExpenseStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'sent_back';
export type TripType = 'single' | 'round';
export type ReviewDecision = 'approve' | 'reject' | 'send_back';
export type ExportFormat = 'pdf' | 'excel';

export interface KmStop {
  id: string;
  stop_order: number;
  address: string;
  lat: string;
  lng: string;
}

/** A km log — only trip_type / total_km / stops come from the client; the rest are SERVER-computed. */
export interface KmLog {
  id: string;
  trip_type: TripType;
  total_km: string;
  deduction_km: string;
  billable_km: string;
  rate_per_km: string;
  computed_amount: string;
  stops: KmStop[];
}

export interface ExpenseItem {
  id: string;
  expense_report_id: string;
  category: string; // one of the field-config keys (km/meals/hotel/flight/rental/gas/other)
  client_id: string | null;
  expense_date: string;
  amount: string;
  description: string;
  receipt_url: string | null;
  km_log: KmLog | null;
}

export interface ExpenseReport {
  id: string;
  submitted_by: string;
  rep_id: string | null;
  week_start: string;
  week_end: string;
  status: ExpenseStatus;
  approved_by: string | null;
  approved_at: string | null;
  pay_period_id: string | null;
  created_at: string;
  expense_items: ExpenseItem[];
}

/** A category config row — drives the dynamic category list + the receipt rule. */
export interface FieldConfig {
  id: string;
  category_key: string;
  label: string;
  requires_receipt: boolean;
  is_active: boolean;
  created_by: string;
}

export interface ExpenseExport {
  id: string;
  generated_by: string;
  client_id: string | null;
  pay_period_id: string | null;
  scope_filters: unknown;
  format: ExportFormat;
  file_url: string;
  generated_at: string;
}

export interface ExpenseFilters {
  status?: ExpenseStatus;
  rep_id?: string;
  client_id?: string;
  pay_period_id?: string;
  from?: string;
  to?: string;
}

// Request bodies — typed from the generated schema (the backend DID emit request DTOs).
export type CreateReportBody = components['schemas']['CreateReportDto'];
export type UpdateReportBody = components['schemas']['UpdateReportDto'];
export type ReviewBody = components['schemas']['ReviewDto'];
export type CreateExportBody = components['schemas']['CreateExportDto'];
export type ExpenseItemInput = components['schemas']['ExpenseItemInput'];
export type KmLogInput = components['schemas']['KmLogInput'];
