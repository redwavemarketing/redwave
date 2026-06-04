import { Module } from '@nestjs/common';
import { BillingGenerationController } from './billing-generation.controller';
import { StatementsController, InvoicesController } from './billing.controller';
import { StatementService } from './statement.service';
import { InvoiceService } from './invoice.service';
import { BillingExportService } from './billing-export.service';

/**
 * BillingModule — client statements + commission invoices (read-over-existing-data; computes no
 * commission). Priced solely from client_billing_rates (#3). No seam, no migration, no Pay Run change.
 */
@Module({
  controllers: [BillingGenerationController, StatementsController, InvoicesController],
  providers: [StatementService, InvoiceService, BillingExportService],
})
export class BillingModule {}
