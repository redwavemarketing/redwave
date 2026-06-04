/**
 * Pure clawback predicate (no I/O). A CLAWABLE item is paid + frozen (`commission_paid` set) and not
 * already clawed back — the only items the backend will accept (paid-only 422, one-per-item 409). #2/#6.
 */
import type { SaleItem } from '../sales/sales.types';

export function isClawable(item: SaleItem): boolean {
  return item.commission_paid !== null && item.item_status !== 'clawed_back';
}
