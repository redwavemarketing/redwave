/** Query-key factories for the Documents feature (mirrors the Billing / Clawback playbook). */
import type { DocumentFilters } from '../documents.types';

export const documentKeys = {
  all: ['documents'] as const,
  list: (filters: DocumentFilters) => ['documents', 'list', filters] as const,
  document: (id: string) => ['documents', 'document', id] as const,
};
