/**
 * BillingExportService — renders a statement/invoice to a file. — SRS BILL-002/003
 * The real PDF/Excel render + object-storage upload is DEFERRED (CLAUDE §12), like the HRM/Expenses
 * exports: we refresh the row's `file_url` reference to the chosen format and return the row content
 * (Pay Run export style). No commission stream is touched (#3 — this only reads billing rows).
 */
import { Injectable } from '@nestjs/common';
import { ExportFormat } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { StatementService } from './statement.service';
import { InvoiceService } from './invoice.service';

const ext = (format: ExportFormat): string => (format === 'excel' ? 'xlsx' : 'pdf');

@Injectable()
export class BillingExportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly statements: StatementService,
    private readonly invoices: InvoiceService,
  ) {}

  async exportStatement(id: string, format: ExportFormat, actorId: string) {
    const statement = await this.statements.findOne(id); // 404 if missing
    const fileUrl = `s3://redwave-exports/statements/${id}.${ext(format)}`;
    await this.prisma.clientStatement.update({ where: { id }, data: { file_url: fileUrl } });
    await this.audit.log({
      actorId,
      entityType: 'client_statements',
      entityId: id,
      action: 'export',
      after: { format, file_url: fileUrl },
    });
    return { statement_id: id, format, file_url: fileUrl, content: JSON.stringify(statement) };
  }

  async exportInvoice(id: string, format: ExportFormat, actorId: string) {
    const invoice = await this.invoices.findOne(id);
    const fileUrl = `s3://redwave-exports/invoices/${id}.${ext(format)}`;
    await this.prisma.clientInvoice.update({ where: { id }, data: { file_url: fileUrl } });
    await this.audit.log({
      actorId,
      entityType: 'client_invoices',
      entityId: id,
      action: 'export',
      after: { format, file_url: fileUrl },
    });
    return { invoice_id: id, format, file_url: fileUrl, content: JSON.stringify(invoice) };
  }
}
