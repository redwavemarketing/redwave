/**
 * Sales queries — the data-fetching pattern (TanStack Query over the openapi-fetch client + `unwrap`).
 * Results are SERVER-SCOPED (rep=own/manager=roster/admin=all) — the UI renders what the server returns.
 * Clients/products feed the entry dropdowns (default to active rows).
 */
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../api/client';
import { unwrap } from '../../../lib/query/unwrap';
import { clientsKeys, salesKeys } from './keys';
import type { Client, Product, Rep, Sale, SalesFilters } from '../sales.types';

export function useSalesQuery(filters: SalesFilters) {
  return useQuery({
    queryKey: salesKeys.list(filters),
    queryFn: () => unwrap<Sale[]>(api.GET('/v1/sales', { params: { query: filters } })),
  });
}

export function useSaleQuery(id: string | undefined) {
  return useQuery({
    queryKey: salesKeys.detail(id ?? ''),
    queryFn: () => unwrap<Sale>(api.GET('/v1/sales/{id}', { params: { path: { id: id! } } })),
    enabled: !!id,
  });
}

export function useClients(enabled = true) {
  return useQuery({
    queryKey: clientsKeys.list(),
    queryFn: () => unwrap<Client[]>(api.GET('/v1/clients')), // default: active only
    enabled,
    staleTime: 5 * 60_000, // clients change rarely
  });
}

export function useClientProducts(clientId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: clientsKeys.products(clientId ?? ''),
    queryFn: () =>
      unwrap<Product[]>(api.GET('/v1/clients/{id}/products', { params: { path: { id: clientId! } } })),
    enabled: enabled && !!clientId,
    staleTime: 5 * 60_000,
  });
}

/** Reps for the on-behalf selector + rep filter — gated on hrm:view (reps don't have it; admins/SA do). */
export function useReps(enabled = true) {
  return useQuery({
    queryKey: ['reps', 'list'],
    queryFn: () => unwrap<Rep[]>(api.GET('/v1/reps')),
    enabled,
    staleTime: 5 * 60_000,
  });
}
