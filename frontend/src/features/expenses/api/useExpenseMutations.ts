/**
 * Expense mutations — create (submit) / edit a weekly report, review (approve/reject/send-back via the one
 * /approve endpoint with a `decision`), and generate an export. On success they invalidate the expenses
 * cache. The km amount is computed SERVER-SIDE — the client never sends `amount` for km items. Toasts via
 * the caller. Responses `never`-typed → cast to hand types.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../api/client';
import { unwrap } from '../../../lib/query/unwrap';
import { expensesKeys, exportKeys } from './keys';
import type { CreateExportBody, CreateReportBody, ExpenseExport, ExpenseReport, ReviewBody, UpdateReportBody } from '../expenses.types';

export function useCreateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateReportBody) => unwrap<ExpenseReport>(api.POST('/v1/expense-reports', { body })),
    onSuccess: () => qc.invalidateQueries({ queryKey: expensesKeys.all }),
  });
}

export function useUpdateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateReportBody }) =>
      unwrap<ExpenseReport>(api.PATCH('/v1/expense-reports/{id}', { params: { path: { id } }, body })),
    onSuccess: () => qc.invalidateQueries({ queryKey: expensesKeys.all }),
  });
}

export function useReviewReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: ReviewBody }) =>
      unwrap<ExpenseReport>(api.POST('/v1/expense-reports/{id}/approve', { params: { path: { id } }, body })),
    onSuccess: () => qc.invalidateQueries({ queryKey: expensesKeys.all }),
  });
}

export function useCreateExport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateExportBody) => unwrap<ExpenseExport>(api.POST('/v1/expense-exports', { body })),
    onSuccess: () => qc.invalidateQueries({ queryKey: exportKeys.all }),
  });
}
