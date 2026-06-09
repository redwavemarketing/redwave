/**
 * Query-key factories for the dashboards feature (mirrors features/sales/api/keys.ts). Keys are the
 * cache identity; queries read by them, and any future mutation invalidates `dashboardKeys.all`.
 */
import type { BusinessFilters } from '../dashboards.types';

export const dashboardKeys = {
  all: ['dashboards'] as const,
  rep: () => ['dashboards', 'rep'] as const,
  manager: () => ['dashboards', 'manager'] as const,
  business: (filters: BusinessFilters) => ['dashboards', 'business', filters] as const,
  trends: (periods: number) => ['dashboards', 'business', 'trends', periods] as const,
  admin: () => ['dashboards', 'admin'] as const,
};

export const targetKeys = {
  all: ['sales-targets'] as const,
  list: (payPeriodId?: string) => ['sales-targets', payPeriodId ?? 'all'] as const,
};

export const leaderboardKeys = {
  all: ['leaderboard'] as const,
  list: () => ['leaderboard', 'list'] as const,
};

export const periodKeys = {
  all: ['pay-periods'] as const,
  list: () => ['pay-periods', 'list'] as const,
};
