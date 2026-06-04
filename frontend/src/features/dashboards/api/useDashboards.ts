/**
 * Dashboard query hooks — TanStack Query over the typed `openapi-fetch` client via `unwrap<T>()`
 * (the Sales playbook, CLAUDE §13). Each dashboard is server-scoped: the backend returns ONLY what the
 * caller's role may see and 403s otherwise (the UI handles that as a graceful state). Responses are
 * `never`-typed in the contract, so we cast to the hand-written types in dashboards.types.ts.
 */
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../api/client';
import { unwrap } from '../../../lib/query/unwrap';
import { dashboardKeys, leaderboardKeys, periodKeys } from './keys';
import type {
  AdminDashboard,
  BusinessDashboard,
  BusinessFilters,
  Leaderboard,
  ManagerDashboard,
  PayPeriod,
  RepDashboard,
} from '../dashboards.types';

export function useRepDashboard(enabled = true) {
  return useQuery({
    queryKey: dashboardKeys.rep(),
    queryFn: () => unwrap<RepDashboard>(api.GET('/v1/dashboards/rep')),
    enabled,
  });
}

export function useManagerDashboard(enabled = true) {
  return useQuery({
    queryKey: dashboardKeys.manager(),
    queryFn: () => unwrap<ManagerDashboard>(api.GET('/v1/dashboards/manager')),
    enabled,
  });
}

export function useBusinessDashboard(filters: BusinessFilters, enabled = true) {
  return useQuery({
    queryKey: dashboardKeys.business(filters),
    queryFn: () =>
      unwrap<BusinessDashboard>(api.GET('/v1/dashboards/business', { params: { query: filters } })),
    enabled,
  });
}

export function useAdminDashboard(enabled = true) {
  return useQuery({
    queryKey: dashboardKeys.admin(),
    queryFn: () => unwrap<AdminDashboard>(api.GET('/v1/dashboards/admin')),
    enabled,
  });
}

export function useLeaderboard(enabled = true) {
  return useQuery({
    queryKey: leaderboardKeys.list(),
    queryFn: () => unwrap<Leaderboard>(api.GET('/v1/leaderboard')),
    enabled,
  });
}

/** Pay periods for the Business period selector. Gated on payrun:view (the SA who sees Business has it). */
export function usePayPeriods(enabled = true) {
  return useQuery({
    queryKey: periodKeys.list(),
    queryFn: () => unwrap<PayPeriod[]>(api.GET('/v1/pay-periods')),
    enabled,
    staleTime: 5 * 60_000, // the schedule changes rarely
  });
}
