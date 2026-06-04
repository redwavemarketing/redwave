/**
 * Roles & permissions types — RESPONSE shapes hand-written (`never`-typed contract). Mirrors
 * `backend/src/modules/roles/`. The role builder is a module × action matrix: rows = Modules, columns =
 * the 6 actions, cells = Permission ids. REQUEST bodies typed from the generated schema. Keep in sync.
 */
import type { components } from '../../api/generated/schema';

export type PermissionAction = 'view' | 'create' | 'edit' | 'approve' | 'delete' | 'export';

/** The 6 actions in display order (the matrix columns). */
export const PERMISSION_ACTIONS: PermissionAction[] = ['view', 'create', 'edit', 'approve', 'delete', 'export'];

/** A role row in the list. */
export interface RoleSummary {
  id: string;
  name: string;
  description: string | null;
  is_system: boolean;
  created_at: string;
  _count: { role_permissions: number; user_roles: number };
}

export interface RolePermissionRef {
  id: string;
  key: string; // "module:action"
}

/** A single role with its granted permissions (GET /v1/roles/{id}). */
export interface RoleDetail {
  id: string;
  name: string;
  description: string | null;
  is_system: boolean;
  created_at: string;
  permissions: RolePermissionRef[];
}

/** A module = a matrix ROW. */
export interface Module {
  id: string;
  key: string;
  name: string;
  description: string | null;
}

/** A permission = one matrix CELL (a module×action pair with a stable id). */
export interface Permission {
  id: string;
  module_id: string;
  module_key: string;
  action: PermissionAction;
  key: string; // "module:action"
}

// Request bodies — typed from the generated schema.
export type CreateRoleBody = components['schemas']['CreateRoleDto'];
export type UpdateRoleBody = components['schemas']['UpdateRoleDto'];
export type SetRolePermissionsBody = components['schemas']['SetRolePermissionsDto'];
