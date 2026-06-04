/**
 * RBAC catalogue hooks — the modules (matrix rows) and permissions (matrix cells). These rarely change,
 * so they're cached longer. The role builder builds its module×action grid from these. — roles:view
 */
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../api/client';
import { unwrap } from '../../../lib/query/unwrap';
import { rbacKeys } from './keys';
import type { Module, Permission } from '../roles.types';

export function useModules(enabled = true) {
  return useQuery({
    queryKey: rbacKeys.modules(),
    queryFn: () => unwrap<Module[]>(api.GET('/v1/modules')),
    enabled,
    staleTime: 5 * 60_000,
  });
}

export function usePermissions(enabled = true) {
  return useQuery({
    queryKey: rbacKeys.permissions(),
    queryFn: () => unwrap<Permission[]>(api.GET('/v1/permissions')),
    enabled,
    staleTime: 5 * 60_000,
  });
}
