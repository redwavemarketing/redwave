/**
 * Report FOLDER query hooks (report-as-folder, EXP-001). The folder list is the primary expense surface; a
 * folder carries its DERIVED status, reimbursable total, and aggregated Alert/Warning count (all server-
 * computed). The detail returns the folder + its items (each with per-item validation). TanStack Query over
 * the typed client via `unwrap<T>()`.
 */
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../api/client';
import { unwrap } from '../../../lib/query/unwrap';
import { useServerTable } from '../../../lib/query/useServerTable';
import { expenseReportsKeys } from './keys';
import type { ExpenseReport, ExpenseReportPage } from '../expenses.types';

export interface ReportFilters {
  rep_id?: string;
  search?: string;
  /** 'true' → only folders with ≥1 item awaiting review (the approval queue). */
  awaiting_review?: string;
}

/** Server-driven folder list (page + sort) for the folder DataTable. */
export function useExpenseReportsTable(filters: ReportFilters = {}, enabled = true) {
  return useServerTable<ExpenseReport, 'name' | 'week_start' | 'created_at'>({
    queryKey: (p) => expenseReportsKeys.page({ ...filters, ...p }),
    fetchPage: (p) => unwrap<ExpenseReportPage>(api.GET('/v1/expense-reports', { params: { query: { ...filters, ...p } } })),
    defaultSort: { key: 'created_at', dir: 'desc' },
    filterKey: JSON.stringify(filters),
    limit: 20,
    enabled,
  });
}

/** One folder + its items (with per-item validation). */
export function useExpenseReport(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: expenseReportsKeys.detail(id ?? ''),
    queryFn: () => unwrap<ExpenseReport>(api.GET('/v1/expense-reports/{id}', { params: { path: { id: id! } } })),
    enabled: enabled && !!id,
  });
}
