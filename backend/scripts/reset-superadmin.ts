/**
 * sa:reset — one-off OPERATOR RECOVERY for a locked-out / unknown-password Super Admin. LOCAL-RUN ONLY,
 * guarded by RESET_SA_CONFIRM=yes. Re-hashes the SA password from env (SEED_SUPERADMIN_EMAIL /
 * SEED_SUPERADMIN_PASSWORD) with the canonical hasher, clears brute-force lockout, revokes the SA's sessions,
 * and deactivates any leftover extra Super Admins (KEEP_EXTRA_SA=yes to keep). Never prints the password/hash.
 *
 * Run:  RESET_SA_CONFIRM=yes SEED_SUPERADMIN_PASSWORD=... npm -w backend run sa:reset
 *       (optionally KEEP_EXTRA_SA=yes to keep other Super Admin accounts) — CLAUDE §4 (ops)
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { RefreshSessionService } from '../src/modules/auth/refresh-session.service';
import { hashPassword } from '../src/common/crypto/password-hash';
import { assertSaResetConfirmed, resetSuperAdmin } from '../src/common/ops/superadmin-reset';

async function main(): Promise<void> {
  assertSaResetConfirmed(process.env); // throws (with the re-run command) unless RESET_SA_CONFIRM=yes

  const email = process.env.SEED_SUPERADMIN_EMAIL ?? '';
  const password = process.env.SEED_SUPERADMIN_PASSWORD ?? '';
  const keepExtra = process.env.KEEP_EXTRA_SA === 'yes';

  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  const prisma = app.get(PrismaService);
  const sessions = app.get(RefreshSessionService);
  try {
    const summary = await resetSuperAdmin(
      { prisma, hashPassword, revokeSessions: (id) => sessions.revokeAllForUser(id) },
      { email, password, keepExtra },
    );

    console.log(`✓ Super Admin password reset for ${summary.target_email_masked} — lockout cleared, sessions revoked.`);
    if (summary.extra_super_admins_found > 0) {
      console.warn(`⚠️  ${summary.extra_super_admins_found} OTHER Super Admin account(s) found: ${summary.extra_super_admins_masked.join(', ')}`);
      if (keepExtra) {
        console.warn('   Kept (KEEP_EXTRA_SA=yes).');
      } else {
        console.warn(`   Deactivated ${summary.extra_super_admins_deactivated} + revoked their sessions. Set KEEP_EXTRA_SA=yes to keep them.`);
      }
    }
    console.log('sa:reset complete.');
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
