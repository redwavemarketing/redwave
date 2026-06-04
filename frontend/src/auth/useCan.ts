/**
 * useCan — UI CONVENIENCE ONLY. ⚠️ NOT a security boundary.
 *
 * Returns whether the current user's effective permissions include `permission` (e.g. `'sales:create'`),
 * so the UI can hide/show controls. The REAL authorization is enforced SERVER-SIDE on every request:
 * the backend RBAC guard rejects any unpermitted call with 403 + audit, regardless of what the UI
 * renders (CLAUDE §5). Never rely on this to protect data — hiding a button is not security.
 */
import { useAuth } from './useAuth';

export function useCan(permission: string): boolean {
  return useAuth().permissions.has(permission);
}
