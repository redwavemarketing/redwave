/**
 * AuditModule — provides AuditService app-wide (@Global) so guards and every domain
 * module can write audit entries without re-importing.
 */
import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit.service';

@Global()
@Module({
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
