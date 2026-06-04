/**
 * @RequirePermission(moduleKey, action) — declares the (module, action) a route requires.
 * THE reusable RBAC seam: every protected endpoint in every module annotates with this, and
 * PermissionsGuard enforces it server-side (missing → 403 + audit). — SRS AUTH-006, arch §7
 */
import { SetMetadata, CustomDecorator } from '@nestjs/common';
import { PermissionAction } from '@prisma/client';
import { ModuleKey } from '../rbac/rbac.constants';

export const RBAC_KEY = 'rbac';

export interface RequiredPermission {
  moduleKey: ModuleKey;
  action: PermissionAction;
}

export const RequirePermission = (
  moduleKey: ModuleKey,
  action: PermissionAction,
): CustomDecorator => SetMetadata(RBAC_KEY, { moduleKey, action });
