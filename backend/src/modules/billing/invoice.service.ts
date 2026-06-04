/**
 * InvoiceService — generates the one-line COMMISSION INVOICE for a client + pay period. — SRS BILL-003
 *
 * `total_commission` = the client-billing statement total (Redwave's commission FROM the partner),
 * obtained by reusing `StatementService.priceClientPeriod` — the SAME billing-stream calc as the
 * statement. It NEVER reads rep `commission_*` tables or the engine (#3). One row, no lines, no GST.
 * Replace-in-place per (client, period). Owns client_invoices.
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { StatementService } from './statement.service';

@Injectable()
export class InvoiceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly statements: StatementService,
  ) {}

  async generate(clientId: string, payPeriodId: string, actorId: string) {
    // Same billing-stream total as the statement (structurally identical — never re-derived). (#3)
    const { client, period, draft } = await this.statements.priceClientPeriod(clientId, payPeriodId);
    const total = draft.total_amount.toFixed(2);
    const fileUrl = `s3://redwave-exports/invoices/${client.client_code}-P${period.period_number}.pdf`;

    const invoice = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.clientInvoice.findFirst({
        where: { client_id: clientId, pay_period_id: payPeriodId },
        select: { id: true },
      });
      if (existing) {
        return tx.clientInvoice.update({
          where: { id: existing.id },
          data: { total_commission: total, file_url: fileUrl, generated_at: new Date() },
        });
      }
      return tx.clientInvoice.create({
        data: {
          client_id: clientId,
          pay_period_id: payPeriodId,
          total_commission: total,
          file_url: fileUrl,
        },
      });
    });

    // ClientInvoice has no generated_by column — the actor is captured in the audit row instead.
    await this.audit.log({
      actorId,
      entityType: 'client_invoices',
      entityId: invoice.id,
      action: 'create',
      after: { client_id: clientId, pay_period_id: payPeriodId, total_commission: total },
    });
    return invoice;
  }

  list(query: { client_id?: string; pay_period_id?: string }) {
    return this.prisma.clientInvoice.findMany({
      where: {
        ...(query.client_id ? { client_id: query.client_id } : {}),
        ...(query.pay_period_id ? { pay_period_id: query.pay_period_id } : {}),
      },
      orderBy: { generated_at: 'desc' },
    });
  }

  async findOne(id: string) {
    const invoice = await this.prisma.clientInvoice.findUnique({ where: { id } });
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }
    return invoice;
  }
}
