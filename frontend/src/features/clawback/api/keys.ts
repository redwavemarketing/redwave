/** Query-key factories for the Clawback feature (mirrors the Pay Run / Expenses playbook). */
import type { ClawbackFilters } from '../clawback.types';

export const clawbackKeys = {
  all: ['clawback'] as const,
  list: (filters: ClawbackFilters) => ['clawback', 'list', filters] as const,
  detail: (id: string) => ['clawback', 'detail', id] as const,
};
