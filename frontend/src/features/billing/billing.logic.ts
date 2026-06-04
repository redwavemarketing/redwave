/**
 * Pure helper to pull the structured `unpriced[]` detail out of a generate 422 (carried on ApiError.details
 * now that unwrap threads the response body through). Returns null for any other error so the caller falls
 * back to a normal error toast. No I/O.
 */
import { ApiError } from '../../lib/api/apiError';
import type { UnpricedDetail } from './billing.types';

export function extractUnpriced(error: unknown): UnpricedDetail[] | null {
  if (!(error instanceof ApiError) || error.status !== 422) return null;
  const details = error.details;
  if (!details || typeof details !== 'object' || !('unpriced' in details)) return null;
  const list = (details as { unpriced?: unknown }).unpriced;
  if (!Array.isArray(list) || list.length === 0) return null;
  return list as UnpricedDetail[];
}
