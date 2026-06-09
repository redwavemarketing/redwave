/**
 * Clients mutations — client create/edit (+ soft-deactivate via is_active), product create/edit (type is
 * immutable — not in the update body), and add a billing rate (effective-dated; the server supersedes the
 * scope's pending + bounds the current, rejects back-dating with 422). On success they invalidate the
 * relevant cache. Toasts via the caller. Responses `never`-typed → cast to hand types.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../api/client';
import { unwrap } from '../../../lib/query/unwrap';
import { billingRateKeys, clientsKeys, productKeys } from './keys';
import type {
  BillingRate,
  Client,
  CreateBillingRateBody,
  CreateClientBody,
  CreateProductBody,
  Product,
  UpdateBillingRateBody,
  UpdateClientBody,
  UpdateProductBody,
} from '../clients.types';

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateClientBody) => unwrap<Client>(api.POST('/v1/clients', { body })),
    onSuccess: () => qc.invalidateQueries({ queryKey: clientsKeys.all }),
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateClientBody }) =>
      unwrap<Client>(api.PATCH('/v1/clients/{id}', { params: { path: { id } }, body })),
    onSuccess: () => qc.invalidateQueries({ queryKey: clientsKeys.all }),
  });
}

/** Bulk soft-deactivate — fan out the per-client is_active PATCH (no bulk endpoint); report done/failed. */
export function useBulkDeactivateClients() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.allSettled(
        ids.map((id) => unwrap<Client>(api.PATCH('/v1/clients/{id}', { params: { path: { id } }, body: { is_active: false } }))),
      );
      const done = results.filter((r) => r.status === 'fulfilled').length;
      return { done, failed: results.length - done };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: clientsKeys.all }),
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, body }: { clientId: string; body: CreateProductBody }) =>
      unwrap<Product>(api.POST('/v1/clients/{id}/products', { params: { path: { id: clientId } }, body })),
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.all }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateProductBody }) =>
      unwrap<Product>(api.PATCH('/v1/products/{id}', { params: { path: { id } }, body })),
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.all }),
  });
}

/** Bulk soft-deactivate products — fan out the per-product is_active PATCH; report done/failed. */
export function useBulkDeactivateProducts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.allSettled(
        ids.map((id) => unwrap<Product>(api.PATCH('/v1/products/{id}', { params: { path: { id } }, body: { is_active: false } }))),
      );
      const done = results.filter((r) => r.status === 'fulfilled').length;
      return { done, failed: results.length - done };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.all }),
  });
}

export function useCreateBillingRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, body }: { clientId: string; body: CreateBillingRateBody }) =>
      unwrap<BillingRate>(api.POST('/v1/clients/{id}/billing-rates', { params: { path: { id: clientId } }, body })),
    onSuccess: () => qc.invalidateQueries({ queryKey: billingRateKeys.all }),
  });
}

/** Edit a PENDING billing rate (server 422s a current/past rate). */
export function useUpdateBillingRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, rateId, body }: { clientId: string; rateId: string; body: UpdateBillingRateBody }) =>
      unwrap<BillingRate>(
        api.PATCH('/v1/clients/{id}/billing-rates/{rateId}', { params: { path: { id: clientId, rateId } }, body }),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: billingRateKeys.all }),
  });
}

/** Delete a PENDING billing rate (server 422s a current/past rate). 204 → no body. */
export function useDeleteBillingRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, rateId }: { clientId: string; rateId: string }) =>
      unwrap<void>(api.DELETE('/v1/clients/{id}/billing-rates/{rateId}', { params: { path: { id: clientId, rateId } } })),
    onSuccess: () => qc.invalidateQueries({ queryKey: billingRateKeys.all }),
  });
}
