import { assertSaResetConfirmed, maskEmail, resetSuperAdmin } from './superadmin-reset';

const SUPER_ADMIN = 'Super Admin';

/** A mock prisma with the three user methods the core uses. */
function makePrisma(opts: {
  target?: { id: string; email: string; roles: string[] } | null;
  allSuperAdmins?: { id: string; email: string }[];
}) {
  const target = opts.target;
  return {
    user: {
      findFirst: jest.fn().mockResolvedValue(
        target ? { id: target.id, email: target.email, user_roles: target.roles.map((name) => ({ role: { name } })) } : null,
      ),
      update: jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue(opts.allSuperAdmins ?? []),
    },
  };
}

const deps = (prisma: ReturnType<typeof makePrisma>) => ({
  prisma: prisma as never,
  hashPassword: jest.fn(async (p: string) => `hashed:${p}`),
  revokeSessions: jest.fn(async () => 1),
});

describe('assertSaResetConfirmed — guard (mirrors seed:reset)', () => {
  it('throws unless RESET_SA_CONFIRM=yes', () => {
    expect(() => assertSaResetConfirmed({})).toThrow(/RESET_SA_CONFIRM=yes/);
    expect(() => assertSaResetConfirmed({ RESET_SA_CONFIRM: 'no' })).toThrow();
  });
  it('passes when confirmed', () => {
    expect(() => assertSaResetConfirmed({ RESET_SA_CONFIRM: 'yes' })).not.toThrow();
  });
});

describe('maskEmail', () => {
  it('masks the local part, keeps the domain', () => {
    expect(maskEmail('superadmin@redwave.local')).toBe('s***@redwave.local');
  });
});

describe('resetSuperAdmin — case-insensitive lookup + reset', () => {
  it('matches the SA email CASE-INSENSITIVELY and resets (clears lockout, must_change=false, revokes sessions)', async () => {
    const prisma = makePrisma({ target: { id: 'sa-1', email: 'SuperAdmin@Redwave.Local', roles: [SUPER_ADMIN] } });
    const d = deps(prisma);
    await resetSuperAdmin(d, { email: 'superadmin@redwave.local', password: 'NewPass!1', keepExtra: false });

    // case-insensitive query
    expect(prisma.user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: { equals: 'superadmin@redwave.local', mode: 'insensitive' } } }),
    );
    // hashed via the injected (canonical) hasher; lockout cleared; not forced to change
    expect(d.hashPassword).toHaveBeenCalledWith('NewPass!1');
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'sa-1' },
        data: expect.objectContaining({ password_hash: 'hashed:NewPass!1', failed_login_attempts: 0, locked_until: null, must_change_password: false }),
      }),
    );
    expect(d.revokeSessions).toHaveBeenCalledWith('sa-1');
  });

  it('throws when the email is not found', async () => {
    const prisma = makePrisma({ target: null });
    await expect(resetSuperAdmin(deps(prisma), { email: 'nobody@x.co', password: 'p', keepExtra: false })).rejects.toThrow(/No user found/);
  });

  it('REFUSES to reset a user that does not hold the Super Admin role', async () => {
    const prisma = makePrisma({ target: { id: 'u-1', email: 'admin@x.co', roles: ['Admin'] } });
    const d = deps(prisma);
    await expect(resetSuperAdmin(d, { email: 'admin@x.co', password: 'p', keepExtra: false })).rejects.toThrow(/does not hold the Super Admin role/);
    expect(prisma.user.update).not.toHaveBeenCalled(); // never touched
  });

  it('throws on an empty password', async () => {
    const prisma = makePrisma({ target: { id: 'sa-1', email: 'sa@x.co', roles: [SUPER_ADMIN] } });
    await expect(resetSuperAdmin(deps(prisma), { email: 'sa@x.co', password: '', keepExtra: false })).rejects.toThrow(/password is empty/i);
  });
});

describe('resetSuperAdmin — leftover extra Super Admins', () => {
  const target = { id: 'sa-1', email: 'owner@redwave.ca', roles: [SUPER_ADMIN] };

  it('deactivates other Super Admins + revokes their sessions by default', async () => {
    const prisma = makePrisma({
      target,
      allSuperAdmins: [
        { id: 'sa-1', email: 'owner@redwave.ca' }, // the target — excluded
        { id: 'sa-2', email: 'superadmin@redwave.local' }, // a leftover dev SA
      ],
    });
    const d = deps(prisma);
    const summary = await resetSuperAdmin(d, { email: 'owner@redwave.ca', password: 'p', keepExtra: false });

    expect(summary.extra_super_admins_found).toBe(1);
    expect(summary.extra_super_admins_deactivated).toBe(1);
    expect(summary.extra_super_admins_masked).toEqual(['s***@redwave.local']);
    expect(prisma.user.update).toHaveBeenCalledWith({ where: { id: 'sa-2' }, data: { status: 'inactive' } });
    expect(d.revokeSessions).toHaveBeenCalledWith('sa-2');
  });

  it('keeps other Super Admins when KEEP_EXTRA_SA=yes (keepExtra)', async () => {
    const prisma = makePrisma({
      target,
      allSuperAdmins: [{ id: 'sa-1', email: 'owner@redwave.ca' }, { id: 'sa-2', email: 'superadmin@redwave.local' }],
    });
    const summary = await resetSuperAdmin(deps(prisma), { email: 'owner@redwave.ca', password: 'p', keepExtra: true });
    expect(summary.extra_super_admins_found).toBe(1);
    expect(summary.extra_super_admins_deactivated).toBe(0);
    // only the target's own update ran (no deactivation update for sa-2)
    expect(prisma.user.update).not.toHaveBeenCalledWith({ where: { id: 'sa-2' }, data: { status: 'inactive' } });
  });
});
