import { Module } from '@nestjs/common';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';

@Module({
  controllers: [SalesController],
  providers: [SalesService],
  // Exported so the Import module (later) can drive validation via the same logic.
  exports: [SalesService],
})
export class SalesModule {}
