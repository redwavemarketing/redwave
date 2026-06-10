/**
 * Billing file downloads/exports — thin wrappers over `lib/api/downloadFile`. Downloads (GET, billing:view)
 * re-render from the frozen record; exports (POST, billing:export) additionally record a billing_exports
 * artifact. All stream the file as an attachment. — arch §6.9
 */
import { downloadFile } from '../../lib/api/downloadFile';

/** Re-download the statement workbook (billing:view). */
export const downloadStatementExcel = (id: string) => downloadFile(`/v1/statements/${id}/download?format=excel`);

/** Export the statement as a recorded QuickBooks CSV (billing:export). */
export const exportStatementQuickbooks = (id: string) =>
  downloadFile(`/v1/statements/${id}/export`, { method: 'POST', body: { format: 'quickbooks' } });

/** Export the statement workbook as a recorded artifact (billing:export). */
export const exportStatementExcel = (id: string) =>
  downloadFile(`/v1/statements/${id}/export`, { method: 'POST', body: { format: 'excel' } });

/** Re-download the invoice PDF (billing:view). */
export const downloadInvoicePdf = (id: string) => downloadFile(`/v1/invoices/${id}/download`);

/** Export the invoice PDF as a recorded artifact (billing:export). */
export const exportInvoicePdf = (id: string) => downloadFile(`/v1/invoices/${id}/export`, { method: 'POST' });
