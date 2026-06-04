/**
 * Effective-permission resolution. Pure functions (no I/O) so they're trivially testable.
 * Effective permissions = the UNION of the grants of all the user's roles. — SRS AUTH-005
 */
import { PermissionAction } from '@prisma/client';

/** A role with its granted permissions (the shape JwtAuthGuard loads). */
export interface RoleWithPermissions {
  role_permissions: {
    permission: { action: PermissionAction; module: { key: string } };
  }[];
}

/** Canonical permission identifier used everywhere: `moduleKey:action` (e.g. `users:view`). */
export const permissionKey = (moduleKey: string, action: string): string =>
  `${moduleKey}:${action}`;

/** Build the deduplicated union of `moduleKey:action` grants across the given roles. */
export function buildEffectivePermissions(roles: RoleWithPermissions[]): Set<string> {
  const permissions = new Set<string>();
  for (const role of roles) {
    for (const rp of role.role_permissions) {
      permissions.add(permissionKey(rp.permission.module.key, rp.permission.action));
    }
  }
  return permissions;
}
