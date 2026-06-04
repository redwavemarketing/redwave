import { Module } from '@nestjs/common';
import { SalesModule } from '../sales/sales.module';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';

/**
 * ImportModule — the staging → reconcile → commit pipeline (bulk validation + go-live migration).
 * Imports SalesModule to DRIVE `SalesService.validateWithinTx` (Import→Sales is one-directional, no
 * cycle). Back-dated rates + opening holdback are written directly via PrismaService (the #10 path).
 */
@Module({
  imports: [SalesModule],
  controllers: [ImportController],
  providers: [ImportService],
})
export class ImportModule {}
