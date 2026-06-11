/**
 * Seed entry — wired to `prisma db seed` (npm run prisma:seed). Boots a Nest application CONTEXT so the
 * demo can drive the REAL services (authentic, invariant-honouring pipeline: atomic+idempotent pay-run
 * finalize, clawback off the frozen snapshot, statement priced from billing rates).
 *
 * PRODUCTION SAFETY: deploys run `prisma:seed`, so this ALWAYS runs the idempotent **bootstrap** catalogue
 * (RBAC/roles/Super Admin/pay-periods/configs) — safe on every deploy. The rich **demo** transactional
 * dataset (which WIPES + regenerates transactional rows) is OPT-IN: it runs only when `SEED_DEMO=yes`, so a
 * production deploy never clobbers real data. The handover clean-wipe stays the SEPARATE `npm run seed:reset`
 * (prisma/reset.ts, guarded by RESET_CONFIRM=yes). — CLAUDE §4/§11
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { seedBootstrap } from './seed/bootstrap';
import { seedDemo } from './seed/demo';

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  const prisma = app.get(PrismaService);
  try {
    const { superAdminUserId } = await seedBootstrap(prisma); // always — idempotent genesis catalogue
    if (process.env.SEED_DEMO === 'yes') {
      await seedDemo(prisma, app, superAdminUserId);
      console.log('Seed complete (bootstrap + demo).');
    } else {
      console.log('Seed complete (bootstrap only — set SEED_DEMO=yes to include demo data).');
    }
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
