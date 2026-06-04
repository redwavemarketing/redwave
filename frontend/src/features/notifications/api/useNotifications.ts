/**
 * Notifications hooks — list the caller's OWN notifications and mark one read (the Sales playbook:
 * TanStack Query + unwrap + invalidate-on-mutation). The list is own-scoped server-side; there is no
 * mark-all endpoint, so we mark rows individually. Responses are `never`-typed → cast to hand types.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../api/client';
import { unwrap } from '../../../lib/query/unwrap';
import { notificationKeys } from './keys';
import type { AppNotification, NotificationFilter } from '../notifications.types';

export function useNotifications(filter: NotificationFilter = {}, enabled = true) {
  return useQuery({
    queryKey: notificationKeys.list(filter),
    queryFn: () =>
      unwrap<AppNotification[]>(api.GET('/v1/notifications', { params: { query: filter } })),
    enabled,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      unwrap<AppNotification>(api.PATCH('/v1/notifications/{id}/read', { params: { path: { id } } })),
    onSuccess: () => qc.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}
