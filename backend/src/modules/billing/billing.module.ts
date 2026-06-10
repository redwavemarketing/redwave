import { Module } from '@nestjs/common';
import { StorageModule } from '../../common/storage/storage.module';
import { SequenceService } from '../../common/sequence/sequence.service';
import { BillingGenerationController } from './billing-generation.controller';
import { StatementsController, InvoicesController } from './billing.controller';
import { StatementService } from './statement.service';
import { InvoiceService } from './invoice.service';
import { BillingExportService } from './billing-export.service';
import { StatementExcelRenderer } from './renderers/statement-excel.renderer';
import { InvoicePdfRenderer } from './renderers/invoice-pdf.renderer';
import { QuickbooksCsvRenderer } from './renderers/quickbooks-csv.renderer';

/**
 * BillingModule — client statements + commission invoices. Priced SOLELY from client_billing_rates (#3);
 * gapless-numbered + immutable (versioned). Real Excel/PDF/QuickBooks-CSV rendered on demand + recorded
 * (StorageModule). No Pay Run change.
 */
@Module({
  imports: [StorageModule],
  controllers: [BillingGenerationController, StatementsController, InvoicesController],
  providers: [
    StatementService,
    InvoiceService,
    BillingExportService,
    SequenceService,
    StatementExcelRenderer,
    InvoicePdfRenderer,
    QuickbooksCsvRenderer,
  ],
})
export class BillingModule {}
