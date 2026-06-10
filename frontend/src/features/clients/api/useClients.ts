/**
 * Clients query hooks — clients (list/detail), per-client products, and per-client billing rates (each row
 * carries a server-derived `status`). TanStack Query over the typed client via `unwrap<T>()` (the playbook).
 * Responses are `never`-typed → cast to the hand-written types. ONLY /v1/clients* — no commission path (#3).
 */
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../api/client';
import { unwrap } from '../../../lib/query/unwrap';
import { billingRateKeys, clientsKeys, productKeys } from './keys';
import type {
  BillingRate,
  BillingRateFilters,
  Client,
  ClientPage,
  ClientsFilters,
  ClientsListParams,
  Product,
  StatusFilter,
} from '../clients.types';

const LOOKUP_LIMIT = 100;

/** Clients as a plain array — for dropdowns/pickers (unwraps the page; capped, active by default). */
export function useClients(status: StatusFilter = 'active', enabled = true) {
  return useQuery({
    queryKey: clientsKeys.list(status),
    queryFn: async () => {
      const page = await unwrap<ClientPage>(api.GET('/v1/clients', { params: { query: { status, limit: LOOKUP_LIMIT } } }));
      return page.data;
    },
    enabled,
  });
}

/** Server-paginated clients page — for the management DataTable. */
export function useClientsPage(params: ClientsListParams, enabled = true) {
  return useQuery({
    queryKey: clientsKeys.page(params),
    queryFn: () => unwrap<ClientPage>(api.GET('/v1/clients', { params: { query: params } })),
    enabled,
  });
}

export type ClientSortKey = 'client_code' | 'name' | 'market' | 'is_active' | 'created_at';

/** Server-driven list state (page + sort) for the Clients management table — mirrors useSalesList. */
export function useClientsTable(filters: ClientsFilters) {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ key: ClientSortKey; dir: 'asc' | 'desc' }>({ key: 'created_at', dir: 'asc' });
  const filterKey = JSON.stringify(filters);
  const sortKey = `${sort.key}:${sort.dir}`;
  useEffect(() => setPage(1), [filterKey, sortKey]);

  const query = useClientsPage({ ...filters, page, limit: 20, sort: sortKey });
  const meta = query.data?.meta;
  const toggleSort = (key: ClientSortKey) =>
    setSort((s) => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }));

  return {
    rows: query.data?.data ?? [],
    total: meta?.total ?? 0,
    page,
    pageCount: Math.max(1, meta?.pageCount ?? 1),
    limit: 20,
    setPage,
    sort,
    toggleSort,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/** Fetch ALL clients matching the filters (paged) for an export that respects the active filters. */
export async function fetchAllClients(filters: ClientsFilters): Promise<Client[]> {
  const out: Client[] = [];
  for (let page = 1; page <= 50; page += 1) {
    const res = await unwrap<ClientPage>(api.GET('/v1/clients', { params: { query: { ...filters, page, limit: LOOKUP_LIMIT } } }));
    out.push(...res.data);
    if (page >= (res.meta.pageCount || 1)) break;
  }
  return out;
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
