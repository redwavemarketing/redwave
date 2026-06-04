/** Query-key factories for the commission-config feature (mirrors the playbook). */
import type { IncentiveStatus } from '../commission.types';
import type { RateStatus } from '../../../components/ui';

export const commissionKeys = {
  all: ['commission'] as const,
  tiers: () => ['commission', 'tiers'] as const,
  flatRates: (status: RateStatus | 'all') => ['commission', 'flat-rates', status] as const,
  holdback: () => ['commission', 'holdback'] as const,
  release: () => ['commission', 'holdback-release'] as const,
  incentives: (status: IncentiveStatus | 'all') => ['commission', 'incentives', status] as const,
};
