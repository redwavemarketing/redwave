import { Module } from '@nestjs/common';
import { CommissionController, IncentivesController } from './commission.controller';
import { TierScheduleService } from './tier-schedule.service';
import { FlatRateService } from './flat-rate.service';
import { HoldbackService } from './holdback.service';
import { IncentiveService } from './incentive.service';
import { CommissionConfigProvider } from './commission-config.provider';

@Module({
  controllers: [CommissionController, IncentivesController],
  providers: [
    TierScheduleService,
    FlatRateService,
    HoldbackService,
    IncentiveService,
    CommissionConfigProvider,
  ],
  // CommissionConfigProvider is exported so Pay Run (later) can read engine config from stored values.
  exports: [CommissionConfigProvider],
})
export class CommissionModule {}
