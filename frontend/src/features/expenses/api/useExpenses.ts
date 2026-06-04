/**
 * Expenses query hooks — reports (list/detail, server-scoped), the field-config catalogue (the dynamic
 * category list + receipt rule), and the exports list. TanStack Query over the typed client via
 * `unwrap<T>()` (the playbook). Responses are `never`-typed → cast to the hand-written types.
 */
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../api/client';
import { unwrap } from '../../../lib/query/unwrap';
import { expensesKeys, exportKeys, fieldConfigKeys } from './keys';
import type { ExpenseExport, ExpenseFilters, ExpenseReport, FieldConfig } from '../expenses.types';

export function useExpenseReports(filters: ExpenseFilters, enabled = true) {
  return useQuery({
    queryKey: expensesKeys.list(filters),
    queryFn: () => unwrap<ExpenseReport[]>(api.GET('/v1/expense-reports', { params: { query: filters } })),
    enabled,
  });
}

export function useExpenseReport(id: string | undefined) {
  return useQuery({
    queryKey: expensesKeys.detail(id ?? ''),
    queryFn: () => unwrap<ExpenseReport>(api.GET('/v1/expense-reports/{id}', { params: { path: { id: id! } } })),
    enabled: !!id,
  });
}

/** The category catalogue — drives the dynamic category selector + the per-category receipt rule. */
export function useFieldConfigs(enabled = true) {
  return useQuery({
    queryKey: fieldConfigKeys.list(),
    queryFn: () => unwrap<FieldConfig[]>(api.GET('/v1/expense-field-configs')),
    enabled,
    staleTime: 5 * 60_000,
  });
}

export function useExpenseExports(enabled = true) {
  return useQuery({
    queryKey: exportKeys.list(),
    queryFn: () => unwrap<ExpenseExport[]>(api.GET('/v1/expense-exports')),
    enabled,
  });
}
