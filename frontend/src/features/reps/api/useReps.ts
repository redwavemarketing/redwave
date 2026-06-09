/**
 * Reps queries — the HRM rep roster (GET /v1/reps), server-paginated. Mirrors useProductsTable: the hook
 * owns page + sort state and sends them as query params; the table consumes { data, meta }. Read-only list
 * (this batch builds the roster view; rep CRUD is its own future screen). `hrm:view` server-enforced.
 */
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../api/client';
import { unwrap } from '../../../lib/query/unwrap';
import type { Rep, RepPage, RepSortKey, RepsFilters, RepsListParams } from '../reps.types';

const LIMIT = 20;
const LOOKUP_LIMIT = 100;

export const repsListKeys = {
  page: (params: RepsListParams) => ['reps', 'list', params] as const,
};

export function useRepsPage(params: RepsListParams, enabled = true) {
  return useQuery({
    queryKey: repsListKeys.page(params),
    queryFn: () => unwrap<RepPage>(api.GET('/v1/reps', { params: { query: params } })),
    enabled,
  });
}

/** Server-driven list state (page + sort) for the Reps table. */
export function useRepsTable(filters: RepsFilters, enabled = true) {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ key: RepSortKey; dir: 'asc' | 'desc' }>({ key: 'rep_code', dir: 'asc' });
  const filterKey = JSON.stringify(filters);
  const sortKey = `${sort.key}:${sort.dir}`;
  useEffect(() => setPage(1), [filterKey, sortKey]);

  const query = useRepsPage({ ...filters, page, limit: LIMIT, sort: sortKey }, enabled);
  const meta = query.data?.meta;
  const toggleSort = (key: RepSortKey) =>
    setSort((s) => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }));

  return {
    rows: query.data?.data ?? [],
    total: meta?.total ?? 0,
    page,
    pageCount: Math.max(1, meta?.pageCount ?? 1),
    limit: LIMIT,
    setPage,
    sort,
    toggleSort,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/** Fetch ALL reps matching the filters (paged) for an export that respects the active filters. */
export async function fetchAllReps(filters: RepsFilters): Promise<Rep[]> {
  const out: Rep[] = [];
  for (let page = 1; page <= 50; page += 1) {
    const res = await unwrap<RepPage>(api.GET('/v1/reps', { params: { query: { ...filters, page, limit: LOOKUP_LIMIT } } }));
    out.push(...res.data);
    if (page >= (res.meta.pageCount || 1)) break;
  }
  return out;
}
