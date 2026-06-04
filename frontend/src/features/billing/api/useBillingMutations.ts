/**
 * Billing mutations — generate + export. The UI PRICES NOTHING (#1/#3): generate is a backend call that
 * prices from client_billing_rates and PERSISTS (replace-in-place per client+period). Generating a statement
 * can 422 on an unpriced product (the body carries `unpriced[]` — surfaced via ApiError.details). All
 * invalidate the billing cache. Toasts at the call site. Responses `never`-typed → cast.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../api/client';
import { unwrap } from '../../../lib/query/unwrap';
import { billingKeys } from './keys';
import type { BillingExportBody, BillingExportResult, ClientInvoice, ClientStatement, GenerateBillingBody } from '../billing.types';

export function useGenerateStatement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, body }: { clientId: string; body: GenerateBillingBody }) =>
      unwrap<ClientStatement>(api.POST('/v1/clients/{id}/statements', { params: { path: { id: clientId } }, body })),
    onSuccess: () => qc.invalidateQueries({ queryKey: billingKeys.all }),
  });
}

export function useGenerateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, body }: { clientId: string; body: GenerateBillingBody }) =>
      unwrap<ClientInvoice>(api.POST('/v1/clients/{id}/invoices', { params: { path: { id: clientId } }, body })),
    onSuccess: () => qc.invalidateQueries({ queryKey: billingKeys.all }),
  });
}

export function useExportStatement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: BillingExportBody }) =>
      unwrap<BillingExportResult>(api.POST('/v1/statements/{id}/export', { params: { path: { id } }, body })),
    onSuccess: () => qc.invalidateQueries({ queryKey: billingKeys.all }),
  });
}

export function useExportInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: BillingExportBody }) =>
      unwrap<BillingExportResult>(api.POST('/v1/invoices/{id}/export', { params: { path: { id } }, body })),
    onSuccess: () => qc.invalidateQueries({ queryKey: billingKeys.all }),
  });
}
