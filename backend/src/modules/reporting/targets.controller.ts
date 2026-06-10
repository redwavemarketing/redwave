/**
 * Sales-targets controller — /v1/sales-targets. GET is authenticated + scoped in the service (rep=own,
 * manager=roster, admin=all). PUT (upsert) requires hrm:edit — the same gate that unredacts rep payment
 * details — and the service further restricts a manager to their roster. — RPT-008
 */
import { Body, Controller, Get, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiErrorResponses } from '../../common/errors/api-error-responses.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/rbac/auth-user.type';
import { TargetsService } from './targets.service';
import { ListSalesTargetsQuery, SalesTargetResponse, SetSalesTargetDto } from './dto/sales-target.dto';

@ApiTags('Reporting & Dashboards')
@ApiBearerAuth()
@ApiErrorResponses()
@Controller('sales-targets')
export class TargetsController {
  constructor(private readonly targets: TargetsService) {}

  @Get()
  @ApiOperation({ summary: 'List sales targets (scoped)', description: 'Authenticated; scoped rep=own / manager=roster / admin=all.' })
  @ApiOkResponse({ type: SalesTargetResponse, isArray: true })
  list(@CurrentUser() user: AuthUser, @Query() query: ListSalesTargetsQuery) {
    return this.targets.list(user, query);
  }

  @Put()
  @RequirePermission('hrm', 'edit')
  @ApiOperation({
    summary: 'Set / replace a rep target for a period',
    description: 'Requires hrm:edit; a manager may only set targets for reps they manage.',
  })
  @ApiOkResponse({ type: SalesTargetResponse })
  set(@CurrentUser() user: AuthUser, @Body() dto: SetSalesTargetDto) {
    return this.targets.set(user, dto);
  }
}
