/**
 * AuthUser — the authenticated principal attached to every request by JwtAuthGuard.
 * Carries the effective permission set (union of the user's roles) so authorization is
 * a cheap in-memory check, recomputed fresh each request (no stale grants). — SRS AUTH-005/006
 */
import { UserStatus } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  status: UserStatus;
  /** Names of the roles the user holds (e.g. 'Super Admin', 'Admin'). */
  roleNames: string[];
  isSuperAdmin: boolean;
  /** Effective permissions as a set of `moduleKey:action` strings (union of all roles). */
  permissions: Set<string>;
  /** The rep id if this user is linked to a rep profile, else null. */
  repId: string | null;
}
