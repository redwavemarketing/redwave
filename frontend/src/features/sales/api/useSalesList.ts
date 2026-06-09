/**
 * useSalesList — the LIST seam, now SERVER-DRIVEN. The backend paginates/sorts/filters/searches and
 * returns { data, meta } (arch §5.1); this hook owns the page + sort state, sends them as query params,
 * and exposes the same surface the table consumes. Page is 1-based; changing a filter OR the sort resets
 * to page 1. — CLAUDE §13
 */
import { useEffect, useState } from 'react';
import { useSalesPage } from './useSales';
import type { SalesFilters } from '../sales.types';

export type SortKey = 'sale_code' | 'customer_name' | 'sale_date' | 'status';
export interface SortState {
  key: SortKey;
  dir: 'asc' | 'desc';
}

const PAGE_SIZE = 20;

export function useSalesList(filters: SalesFilters) {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortState>({ key: 'sale_date', dir: 'desc' });

  // Reset to the first page whenever the filters or sort change (a new server result set).
  const filterKey = JSON.stringify(filters);
  const sortKey = `${sort.key}:${sort.dir}`;
  useEffect(() => setPage(1), [filterKey, sortKey]);

  const query = useSalesPage({ ...filters, page, limit: PAGE_SIZE, sort: sortKey });
  const meta = query.data?.meta;

  const toggleSort = (key: SortKey) =>
    setSort((s) => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }));

  return {
    rows: query.data?.data ?? [],
    total: meta?.total ?? 0,
    page,
    pageCount: Math.max(1, meta?.pageCount ?? 1),
    pageSize: PAGE_SIZE,
    limit: PAGE_SIZE,
    setPage,
    sort,
    toggleSort,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
