/**
 * Sales mutations — the mutation pattern: each calls the typed endpoint via `unwrap`, and on success
 * INVALIDATES `salesKeys.all` so lists/detail refetch. Toasts (success/error) are supplied by the
 * caller via per-call `onSuccess`/`onError` (so messages fit the action). Validate is an approval gate
 * (not money) → plain invalidate, no optimistic update.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../api/client';
import { unwrap } from '../../../lib/query/unwrap';
import { salesKeys } from './keys';
import type {
  BulkValidateBody,
  BulkValidateResult,
  CreateSaleBody,
  Sale,
  SetGreenfieldBody,
  ValidateSaleBody,
} from '../sales.types';

export function useCreateSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateSaleBody) => unwrap<Sale>(api.POST('/v1/sales', { body })),
    onSuccess: () => qc.invalidateQueries({ queryKey: salesKeys.all }),
  });
}

export function useValidateSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body?: ValidateSaleBody }) =>
      unwrap<Sale>(api.POST('/v1/sales/{id}/validate', { params: { path: { id } }, body: body ?? {} })),
    onSuccess: () => qc.invalidateQueries({ queryKey: salesKeys.all }),
  });
}

export function useBulkValidate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: BulkValidateBody) =>
      unwrap<BulkValidateResult>(api.POST('/v1/sales/bulk-validate', { body })),
    onSuccess: () => qc.invalidateQueries({ queryKey: salesKeys.all }),
  });
}

export function useSetGreenfield() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: SetGreenfieldBody }) =>
      unwrap<Sale>(api.POST('/v1/sales/{id}/greenfield', { params: { path: { id } }, body })),
    onSuccess: () => qc.invalidateQueries({ queryKey: salesKeys.all }),
  });
}

export function useDeleteSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => unwrap<unknown>(api.DELETE('/v1/sales/{id}', { params: { path: { id } } })),
    onSuccess: () => qc.invalidateQueries({ queryKey: salesKeys.all }),
  });
}
