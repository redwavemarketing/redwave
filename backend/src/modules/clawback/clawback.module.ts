import { Module } from '@nestjs/common';
import { EngineModule } from '../engine/engine.module';
import { CLAWBACK_TOTAL_PROVIDER } from '../payrun/seams/clawback-total.provider';
import { ClawbackController } from './clawback.controller';
import { ClawbackService } from './clawback.service';
import { ClawbackPayrunProvider } from './clawback-payrun.provider';

@Module({
  imports: [EngineModule], // for CommissionEngineService.computeClawbackAmount (reused, not reimplemented)
  controllers: [ClawbackController],
  providers: [
    ClawbackService,
    ClawbackPayrunProvider,
    // The real implementation of the Pay Run clawback seam — re-binds the token Pay Run left open.
    { provide: CLAWBACK_TOTAL_PROVIDER, useExisting: ClawbackPayrunProvider },
  ],
  // Exported so PayRunModule imports this module to satisfy CLAWBACK_TOTAL_PROVIDER.
  exports: [CLAWBACK_TOTAL_PROVIDER],
})
export class ClawbackModule {}
