/**
 * AuditController — /v1/audit-logs: the Super-Admin audit view + the per-record History tab feed.
 *
 * Read-only, gated by `audit:view` (Super Admin only by default). No write endpoints — the trail is
 * append-only. — arch §security (audit)
 */
import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiErrorResponses } from '../../common/errors/api-error-responses.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AuditQueryService } from './audit-query.service';
import { AuditQueryDto } from './dto/audit-query.dto';
import { AuditLogPageResponse } from './dto/audit.response';

@ApiTags('Audit')
@ApiBearerAuth()
@ApiErrorResponses()
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly audit: AuditQueryService) {}

  @Get()
  @RequirePermission('audit', 'view')
  @ApiOperation({
    summary: 'List audit-log entries (filter by actor / entity / action / date)',
    description: 'Requires audit:view (Super Admin). Pass entity_type + entity_id for a record’s History.',
  })
  @ApiOkResponse({ type: AuditLogPageResponse })
  list(@Query() query: AuditQueryDto) {
    return this.audit.list(query);
  }
}
