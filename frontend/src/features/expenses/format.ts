/**
 * Expense display helpers — category labels (from the dynamic field configs, falling back to a humanized
 * key) and the report total (exact-decimal sum of item amounts for DISPLAY). km item amounts are the
 * server-computed values stored on the item, so the total covers km too.
 */
import { sumMoney } from '../../lib/format/money';
import type { ExpenseReport, FieldConfig } from './expenses.types';

const humanize = (key: string): string => key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export function categoryLabel(key: string, configs?: FieldConfig[]): string {
  return configs?.find((c) => c.category_key === key)?.label ?? humanize(key);
}

/** Exact-decimal total of a report's item amounts (display string "X.YY"). */
export function reportTotal(report: ExpenseReport): string {
  return sumMoney(report.expense_items.map((i) => i.amount));
}
