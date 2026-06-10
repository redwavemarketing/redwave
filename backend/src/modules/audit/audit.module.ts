/**
 * AuditLogModule — the READ surface over the append-only audit_log (the WRITE side is the @Global
 * common/audit AuditService). Exposes /v1/audit-logs (audit:view). — arch §security (audit)
 */
import { Module } from '@nestjs/common';
import { AuditController } from './audit.controller';
import { AuditQueryService } from './audit-query.service';

@Module({
  controllers: [AuditController],
  providers: [AuditQueryService],
})
export class AuditLogModule {}
