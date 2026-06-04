/**
 * HealthController — GET /health.
 *
 * Returns the standard terminus health envelope and includes a real DB connectivity
 * check (PrismaHealthIndicator). 200 = backend + database are up; 503 if the DB is
 * unreachable. Unversioned by convention (no /v1 prefix).
 */
import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { HealthCheck, HealthCheckResult, HealthCheckService } from '@nestjs/terminus';
import { PrismaHealthIndicator } from './prisma.health';
import { Public } from '../common/decorators/public.decorator';

// Version-neutral so it stays at /health (not /v1/health) under URI versioning.
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaHealth: PrismaHealthIndicator,
  ) {}

  // Public — the health check must not require authentication.
  @Public()
  @Get()
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    return this.health.check([() => this.prismaHealth.isHealthy('database')]);
  }
}
