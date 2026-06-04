/**
 * <Can permission="…"> — render children only if the user has the permission. UI CONVENIENCE ONLY —
 * the server is the real gate (CLAUDE §5). See useCan for the full caveat. A `fallback` may be shown
 * when the permission is absent.
 */
import type { ReactNode } from 'react';
import { useCan } from './useCan';

export function Can({
  permission,
  children,
  fallback = null,
}: {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return <>{useCan(permission) ? children : fallback}</>;
}
