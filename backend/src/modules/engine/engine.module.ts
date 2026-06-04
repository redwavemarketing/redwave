/**
 * EngineModule — provides the pure CommissionEngineService for later consumers (Pay Run, etc.).
 * Not imported into AppModule yet: nothing depends on the engine in this session.
 */
import { Module } from '@nestjs/common';
import { CommissionEngineService } from './commission-engine.service';

@Module({
  providers: [CommissionEngineService],
  exports: [CommissionEngineService],
})
export class EngineModule {}
