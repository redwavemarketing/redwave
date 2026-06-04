/**
 * Dashboards + leaderboard controllers — /v1/dashboards/* and /v1/leaderboard. — arch §6.12
 * Rep dashboard is authenticated-only (scoped to the caller's own rep in the service). Manager/business/
 * admin require reports:view and are further scope-gated in the service (manager=roster, business=SA,
 * admin=Admin/SA). The leaderboard is counts-only.
 */
import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/rbac/auth-user.type';
import { DashboardsService } from './dashboards.service';
import { LeaderboardService } from './leaderboard.service';
import { DashboardQuery } from './dto/dashboard-query.dto';

@ApiTags('Reporting & Dashboards')
@ApiBearerAuth()
@Controller('dashboards')
export class DashboardsController {
  constructor(private readonly dashboards: DashboardsService) {}

  @Get('rep')
  @ApiOperation({ summary: "Rep's own dashboard", description: 'Authenticated; scoped to the caller’s own rep.' })
  rep(@CurrentUser() user: AuthUser) {
    return this.dashboards.rep(user);
  }

  @Get('manager')
  @RequirePermission('reports', 'view')
  @ApiOperation({ summary: 'Manager dashboard', description: 'Requires reports:view; scoped to the caller’s roster (bare rep → 403).' })
  manager(@CurrentUser() user: AuthUser) {
    return this.dashboards.manager(user);
  }

  @Get('business')
  @RequirePermission('reports', 'view')
  @ApiOperation({ summary: 'Business / executive dashboard', description: 'Requires reports:view AND Super Admin (else 403).' })
  business(@CurrentUser() user: AuthUser, @Query() query: DashboardQuery) {
    return this.dashboards.business(user, query);
  }

  @Get('admin')
  @RequirePermission('reports', 'view')
  @ApiOperation({ summary: 'Admin operational home (queues)', description: 'Requires reports:view AND Admin/Super Admin.' })
  admin(@CurrentUser() user: AuthUser) {
    return this.dashboards.admin(user);
  }
}

@ApiTags('Reporting & Dashboards')
@ApiBearerAuth()
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboard: LeaderboardService) {}

  @Get()
  @RequirePermission('reports', 'view')
  @ApiOperation({
    summary: 'Company-wide leaderboard (counts only)',
    description: 'Requires reports:view. Ranked by internet activation count for the period — no earnings.',
  })
  list() {
    return this.leaderboard.list();
  }
}
