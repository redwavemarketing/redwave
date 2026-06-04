/**
 * PrismaService — the single PrismaClient instance for the app.
 *
 * Owns the database connection lifecycle. We deliberately do NOT eagerly $connect on
 * module init: PrismaClient connects lazily on the first query, so the app boots even
 * when the database is unreachable — which lets GET /health report a real 503 instead of
 * the whole process failing to start. We disconnect cleanly on shutdown.
 *
 * Money columns added later use Prisma.Decimal exclusively (CLAUDE.md §3 #1 — never floats).
 */
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
