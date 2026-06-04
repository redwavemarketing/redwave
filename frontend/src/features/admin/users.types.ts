/**
 * User-management types — RESPONSE shapes hand-written (the backend declares no response schema, so
 * generated types are `never`). Mirrors `backend/src/modules/users/`. REQUEST bodies are typed from the
 * generated schema (re-exported). Keep in sync with the backend.
 */
import type { components } from '../../api/generated/schema';
import type { ThemePreference } from '../../theme/theme.types';

export type UserStatus = 'active' | 'inactive';

/** A user's role membership as returned in the user list (effective perms = union of these roles). */
export interface UserRoleRef {
  role: { id: string; name: string };
}

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  theme_preference: ThemePreference;
  status: UserStatus;
  created_at: string;
  updated_at: string;
  user_roles: UserRoleRef[];
}

// Request bodies — typed from the generated schema.
export type CreateUserBody = components['schemas']['CreateUserDto'];
export type UpdateUserBody = components['schemas']['UpdateUserDto'];
export type SetUserRolesBody = components['schemas']['SetUserRolesDto'];
