/**
 * ClawbackController — /v1/clawbacks. — arch §6.7
 * clawback:create gates the money-affecting entry; the global guard enforces it and the service
 * scopes data per caller.
 */
import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/rbac/auth-user.type';
import { ClawbackService } from './clawback.service';
import { CreateClawbackDto } from './dto/create-clawback.dto';
import { ListClawbacksQuery } from './dto/list-clawbacks.query';

@ApiTags('Clawback')
@ApiBearerAuth()
@Controller('clawbacks')
export class ClawbackController {
  constructor(private readonly clawbacks: ClawbackService) {}

  @Get()
  @RequirePermission('clawback', 'view')
  @ApiOperation({
    summary: 'List clawbacks',
    description: 'Requires clawback:view. Scoped; filters status/rep_id/sale_id.',
  })
  list(@Query() query: ListClawbacksQuery, @CurrentUser() user: AuthUser) {
    return this.clawbacks.list(query, user);
  }

  @Post()
  @RequirePermission('clawback', 'create')
  @ApiOperation({
    summary: 'Enter a clawback',
    description:
      'Requires clawback:create. Targets a PAID sale_item; amount defaults to the exact frozen amount ' +
      '(rate + incentive). Flat, per-item, no date math; the snapshot is never edited.',
  })
  create(@Body() dto: CreateClawbackDto, @CurrentUser() user: AuthUser) {
    return this.clawbacks.enter(dto, user);
  }

  @Get(':id')
  @RequirePermission('clawback', 'view')
  @ApiOperation({ summary: 'Get a clawback', description: 'Requires clawback:view (scoped).' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.clawbacks.findOne(id, user);
  }
}
