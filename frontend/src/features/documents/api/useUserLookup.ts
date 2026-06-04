/**
 * useUserLookup — resolve a user id to a display name + avatar for the documents screens. The document detail
 * returns raw user IDs only, so names come from the users list (`useUsers`, gated `users:view`). The current
 * user resolves to "You" via useAuth; an unknown id degrades to a short id. Also exposes the users list (for
 * the recipient/signer picker) + whether the caller can list users.
 */
import { useMemo } from 'react';
import { useAuth } from '../../../auth/useAuth';
import { useCan } from '../../../auth/useCan';
import { useUsers } from '../../admin/api/useUsers';

export interface ResolvedUser {
  label: string; // "You" / full name / short id — for text
  name: string; // a name for Avatar initials (never "You")
  avatarUrl: string | null;
}

export function useUserLookup() {
  const canViewUsers = useCan('users:view');
  const { user } = useAuth();
  const usersQ = useUsers(canViewUsers);
  const byId = useMemo(() => new Map((usersQ.data ?? []).map((u) => [u.id, u])), [usersQ.data]);

  const resolve = (userId: string): ResolvedUser => {
    const u = byId.get(userId);
    const isSelf = userId === user?.id;
    const fullName = u?.full_name ?? (isSelf ? user?.full_name : undefined);
    return {
      label: isSelf ? 'You' : fullName ?? `User ${userId.slice(0, 8)}`,
      name: fullName ?? (isSelf ? 'You' : '?'),
      avatarUrl: u?.avatar_url ?? (isSelf ? user?.avatar_url ?? null : null),
    };
  };

  return { resolve, users: usersQ.data ?? [], canViewUsers };
}
