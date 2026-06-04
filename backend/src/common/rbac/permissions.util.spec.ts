import { buildEffectivePermissions, permissionKey, RoleWithPermissions } from './permissions.util';

describe('buildEffectivePermissions (AUTH-005)', () => {
  it('unions grants across roles and de-duplicates overlaps', () => {
    const roleA: RoleWithPermissions = {
      role_permissions: [
        { permission: { action: 'view', module: { key: 'sales' } } },
        { permission: { action: 'create', module: { key: 'sales' } } },
      ],
    };
    const roleB: RoleWithPermissions = {
      role_permissions: [
        { permission: { action: 'view', module: { key: 'sales' } } }, // overlaps roleA
        { permission: { action: 'approve', module: { key: 'expenses' } } },
      ],
    };

    const permissions = buildEffectivePermissions([roleA, roleB]);

    expect(permissions.has('sales:view')).toBe(true);
    expect(permissions.has('sales:create')).toBe(true);
    expect(permissions.has('expenses:approve')).toBe(true);
    // sales:view appears in both roles but is counted once.
    expect(permissions.size).toBe(3);
  });

  it('returns an empty set when a user has no roles', () => {
    expect(buildEffectivePermissions([]).size).toBe(0);
  });

  it('permissionKey formats as moduleKey:action', () => {
    expect(permissionKey('users', 'view')).toBe('users:view');
  });
});
