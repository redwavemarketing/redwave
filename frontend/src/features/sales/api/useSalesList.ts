/**
 * useSalesList — the LIST seam. The backend FILTERS server-side (status/rep/client/date) and returns a
 * plain array; sorting + pagination are done CLIENT-side here. This is the single place to swap to
 * server-side pagination later (the API would gain page/size + a total) — pages/components don't change.
 * — CLAUDE §13 (flagged: server pagination is a future backend addition)
 */
import { useEffect, useMemo, useState } from 'react';
import { useSalesQuery } from './useSales';
import type { Sale, SalesFilters } from '../sales.types';

export type SortKey = 'sale_code' | 'customer_name' | 'sale_date' | 'status';
export interface SortState {
  key: SortKey;
  dir: 'asc' | 'desc';
}

const PAGE_SIZE = 15;

export function useSalesList(filters: SalesFilters) {
  const query = useSalesQuery(filters);
  const [sort, setSort] = useState<SortState>({ key: 'sale_date', dir: 'desc' });
  const [page, setPage] = useState(0);

  // Reset to the first page whenever the filters change (new server result set).
  const filterKey = JSON.stringify(filters);
  useEffect(() => setPage(0), [filterKey]);

  const sorted = useMemo<Sale[]>(() => {
    const rows = [...(query.data ?? [])];
    rows.sort((a, b) => {
      const av = String(a[sort.key] ?? '');
      const bv = String(b[sort.key] ?? '');
      const cmp = av.localeCompare(bv);
      return sort.dir === 'asc' ? cmp : -cmp;
    });
    return rows;
  }, [query.data, sort]);

  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const rows = useMemo(
    () => sorted.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE),
    [sorted, safePage],
  );

  const toggleSort = (key: SortKey) =>
    setSort((s) => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }));

  return {
    rows,
    allRows: sorted,
    total,
    page: safePage,
    pageCount,
    pageSize: PAGE_SIZE,
    setPage,
    sort,
    toggleSort,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
