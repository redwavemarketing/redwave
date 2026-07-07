import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Report-as-folder regression lock (EXP-001). The folder is a PURE grouping layer — every money-critical read
 * of expense_items must key off the ITEM's own columns (rep_id/client_id/pay_period_id/status/is_personal/
 * amount_cad) and NEVER filter or join by `expense_report_id`, so an item is counted once exactly as before
 * (#1/#12 untouched). This structurally forbids a future dev from accidentally joining the folder.
 */
const READS: { label: string; file: string }[] = [
  { label: 'pay-run seam', file: './expense-payrun.provider.ts' },
  { label: 'client expense document', file: '../billing/expense-doc.service.ts' },
  { label: 'dashboards', file: '../reporting/dashboards.service.ts' },
];

describe('expense money reads are folder-agnostic', () => {
  it.each(READS)('$label never references expense_report_id', ({ file }) => {
    const src = readFileSync(join(__dirname, file), 'utf8');
    expect(src).not.toMatch(/expense_report_id/);
  });
});
