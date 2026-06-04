/**
 * Clients query hooks — clients (list/detail), per-client products, and per-client billing rates (each row
 * carries a server-derived `status`). TanStack Query over the typed client via `unwrap<T>()` (the playbook).
 * Responses are `never`-typed → cast to the hand-written types. ONLY /v1/clients* — no commission path (#3).
 */
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../api/client';
import { unwrap } from '../../../lib/query/unwrap';
import { billingRateKeys, clientsKeys, productKeys } from './keys';
import type { BillingRate, BillingRateFilters, Client, Product, StatusFilter } from '../clients.types';

export function useClients(status: StatusFilter = 'active', enabled = true) {
  return useQuery({
    queryKey: clientsKeys.list(status),
    queryFn: () => unwrap<Client[]>(api.GET('/v1/clients', { params: { query: { status } } })),
    enabled,
  });
}

export function useClient(id: string | undefined) {
  return useQuery({
    queryKey: clientsKeys.detail(id ?? ''),
    queryFn: () => unwrap<Client>(api.GET('/v1/clients/{id}', { params: { path: { id: id! } } })),
    enabled: !!id,
  });
}

export function useClientProducts(clientId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: productKeys.list(clientId ?? ''),
    queryFn: () =>
      unwrap<Product[]>(api.GET('/v1/clients/{id}/products', { params: { path: { id: clientId! }, query: { status: 'all' } } })),
    enabled: enabled && !!clientId,
  });
}

export function useClientBillingRates(clientId: string | undefined, filters: BillingRateFilters, enabled = true) {
  return useQuery({
    queryKey: billingRateKeys.list(clientId ?? '', filters),
    queryFn: () =>
      unwrap<BillingRate[]>(api.GET('/v1/clients/{id}/billing-rates', { params: { path: { id: clientId! }, query: filters } })),
    enabled: enabled && !!clientId,
  });
}
