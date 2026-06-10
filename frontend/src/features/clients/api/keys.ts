/** Query-key factories for the clients feature (mirrors the playbook). */
import type { BillingRateFilters, ClientsListParams, StatusFilter } from '../clients.types';

export const clientsKeys = {
  all: ['clients'] as const,
  list: (status: StatusFilter) => ['clients', 'list', status] as const,
  page: (params: ClientsListParams) => ['clients', 'page', params] as const,
  detail: (id: string) => ['clients', 'detail', id] as const,
};

export const productKeys = {
  all: ['products'] as const,
  list: (clientId: string) => ['products', 'list', clientId] as const,
};

export const billingRateKeys = {
  all: ['billing-rates'] as const,
  list: (clientId: string, filters: BillingRateFilters) => ['billing-rates', 'list', clientId, filters] as const,
};
