/**
 * Super Admin recovery — the TESTABLE core of the `sa:reset` operator script (entry:
 * `backend/scripts/reset-superadmin.ts`). No Nest/DB boot here: deps are injected (a Prisma client, the
 * canonical `hashPassword`, a session-revoke fn) so the logic is unit-tested without a database. Restores
 * SA access: re-hash from env, clear lockout, revoke stale sessions, and tidy leftover extra Super Admins.
 * GUARDED + local-run only. — CLAUDE §4 (ops)
 */
import type { PrismaClient } from '@prisma/client';
import { BUILTIN_ROLES } from '../rbac/rbac.constants';

const SUPER_ADMIN = BUILTIN_ROLES.SUPER_ADMIN;

/** Refuse to run unless explicitly confirmed (same guard shape as seed:reset). */
export function assertSaResetConfirmed(env: NodeJS.ProcessEnv): void {
  if (env.RESET_SA_CONFIRM !== 'yes') {
    throw new Error(
      'sa:reset is a guarded recovery action (it re-hashes the Super Admin password, clears lockout, and\n' +
        '  revokes sessions). Re-run with the confirmation flag, locally, against the target DB:\n\n' +
        '    RESET_SA_CONFIRM=yes SEED_SUPERADMIN_PASSWORD=... npm -w backend run sa:reset\n',
    );
  }
}

/** Mask an email for logs: `jane@x.co` → `j***@x.co` (never log the full address). */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  const head = (local ?? '').slice(0, 1);
  return domain ? `${head}***@${domain}` : `${head}***`;
}

export interface ResetDeps {
  prisma: PrismaClient;
  hashPassword: (plain: string) => Promise<string>;
  revokeSessions: (userId: string) => Promise<number>;
}

export interface ResetOpts {
  email: string;
  password: string;
  keepExtra: boolean;
}

export interface ResetSummary {
  target_email_masked: string;
  extra_super_admins_found: number;
  extra_super_admins_deactivated: number;
  extra_super_admins_masked: string[];
}

/**
 * Reset the Super Admin identified by `opts.email` (matched CASE-INSENSITIVELY). Refuses if the user is not
 * found or does not hold the Super Admin role. Clears lockout + `must_change_password` (the operator knows
 * this password) and revokes their sessions. Then handles any OTHER Super Admins (deactivate unless kept).
 * Never returns/logs the password or the hash.
 */
export async function resetSuperAdmin(deps: ResetDeps, opts: ResetOpts): Promise<ResetSummary> {
  const email = opts.email?.trim();
  if (!email) throw new Error('SEED_SUPERADMIN_EMAIL is empty — set it before running sa:reset.');
  if (!opts.password) throw new Error('SEED_SUPERADMIN_PASSWORD is empty — set the password to restore before running sa:reset.');

  const target = await deps.prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
    include: { user_roles: { include: { role: { select: { name: true } } } } },
  });
  if (!target) {
    throw new Error(`No user found for SEED_SUPERADMIN_EMAIL (${maskEmail(email)}).`);
  }
  const holdsSuperAdmin = target.user_roles.some((ur) => ur.role.name === SUPER_ADMIN);
  if (!holdsSuperAdmin) {
    throw new Error(`User ${maskEmail(email)} does not hold the ${SUPER_ADMIN} role — refusing to reset a non-Super-Admin.`);
  }

  const password_hash = await deps.hashPassword(opts.password);
  await deps.prisma.user.update({
    where: { id: target.id },
    data: { password_hash, failed_login_attempts: 0, locked_until: null, must_change_password: false },
  });
  await deps.revokeSessions(target.id);

  // Any OTHER Super Admins (e.g. a leftover local-dev superadmin@redwave.local) — warn + deactivate unless kept.
  const allSuperAdmins = await deps.prisma.user.findMany({
    where: { user_roles: { some: { role: { name: SUPER_ADMIN } } } },
    select: { id: true, email: true },
  });
  const extras = allSuperAdmins.filter((u) => u.email.toLowerCase() !== email.toLowerCase());
  let deactivated = 0;
  if (extras.length > 0 && !opts.keepExtra) {
    for (const u of extras) {
      await deps.prisma.user.update({ where: { id: u.id }, data: { status: 'inactive' } });
      await deps.revokeSessions(u.id);
      deactivated += 1;
    }
  }

  return {
    target_email_masked: maskEmail(email),
    extra_super_admins_found: extras.length,
    extra_super_admins_deactivated: deactivated,
    extra_super_admins_masked: extras.map((u) => maskEmail(u.email)),
  };
}
