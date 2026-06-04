/**
 * PrismaHealthIndicator — reports whether the database is reachable.
 *
 * Runs a trivial `SELECT 1` through Prisma. Used by GET /health so a green response
 * proves the backend ↔ PostgreSQL wiring end to end. Uses the terminus v11
 * HealthIndicatorService API.
 */
import { Injectable } from '@nestjs/common';
import { HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaHealthIndicator {
  constructor(
    private readonly prisma: PrismaService,
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return indicator.up();
    } catch (error) {
      return indicator.down({ message: (error as Error).message });
    }
  }
}
