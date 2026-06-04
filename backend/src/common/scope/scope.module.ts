/**
 * ScopeModule — provides ScopeService app-wide (@Global) so any module can scope its
 * queries without re-importing.
 */
import { Global, Module } from '@nestjs/common';
import { ScopeService } from './scope.service';

@Global()
@Module({
  providers: [ScopeService],
  exports: [ScopeService],
})
export class ScopeModule {}
