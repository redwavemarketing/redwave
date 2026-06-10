/**
 * Products queries — the cross-client list (GET /v1/products), server-paginated. Mirrors useSalesList:
 * the hook owns page + sort state and sends them as query params; the table consumes { data, meta }.
 * Product edit/deactivate go through the clients-domain mutations (keyed ['products'] → these refetch).
 */
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../api/client';
import { unwrap } from '../../../lib/query/unwrap';
import type { Product, ProductPage, ProductSortKey, ProductsFilters, ProductsListParams } from '../products.types';

const LOOKUP_LIMIT = 100;

export const productsListKeys = {
  page: (params: ProductsListParams) => ['products', 'cross-list', params] as const,
};

export function useProductsPage(params: ProductsListParams) {
  return useQuery({
    queryKey: productsListKeys.page(params),
    queryFn: () => unwrap<ProductPage>(api.GET('/v1/products', { params: { query: params } })),
  });
}

/** Server-driven list state (page + sort) for the Products table — mirrors useSalesList. */
export function useProductsTable(filters: ProductsFilters) {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ key: ProductSortKey; dir: 'asc' | 'desc' }>({ key: 'created_at', dir: 'asc' });
  const filterKey = JSON.stringify(filters);
  const sortKey = `${sort.key}:${sort.dir}`;
  useEffect(() => setPage(1), [filterKey, sortKey]);

  const query = useProductsPage({ ...filters, page, limit: 20, sort: sortKey });
  const meta = query.data?.meta;
  const toggleSort = (key: ProductSortKey) =>
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

/** Fetch ALL products matching the filters (paged) for an export that respects the active filters. */
export async function fetchAllProducts(filters: ProductsFilters): Promise<Product[]> {
  const out: Product[] = [];
  for (let page = 1; page <= 50; page += 1) {
    const res = await unwrap<ProductPage>(api.GET('/v1/products', { params: { query: { ...filters, page, limit: LOOKUP_LIMIT } } }));
    out.push(...res.data);
    if (page >= (res.meta.pageCount || 1)) break;
  }
  return out;
}
