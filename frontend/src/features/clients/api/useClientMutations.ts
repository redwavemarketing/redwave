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
import type { BillingRate, Client, CreateBillingRateBody, CreateClientBody, CreateProductBody, Product, UpdateClientBody, UpdateProductBody } from '../clients.types';

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

export function useCreateBillingRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, body }: { clientId: string; body: CreateBillingRateBody }) =>
      unwrap<BillingRate>(api.POST('/v1/clients/{id}/billing-rates', { params: { path: { id: clientId } }, body })),
    onSuccess: () => qc.invalidateQueries({ queryKey: billingRateKeys.all }),
  });
}
