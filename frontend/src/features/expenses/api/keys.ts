/** Query-key factories for the expenses feature (mirrors the Sales/admin playbook). */
import type { ExpenseFilters } from '../expenses.types';

export const expensesKeys = {
  all: ['expenses'] as const,
  list: (filters: ExpenseFilters) => ['expenses', 'list', filters] as const,
  detail: (id: string) => ['expenses', 'detail', id] as const,
};

export const fieldConfigKeys = {
  all: ['expense-field-configs'] as const,
  list: () => ['expense-field-configs', 'list'] as const,
};

export const exportKeys = {
  all: ['expense-exports'] as const,
  list: () => ['expense-exports', 'list'] as const,
};
