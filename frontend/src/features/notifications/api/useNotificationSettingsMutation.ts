/**
 * Notification-settings SAVE hook — the write path for the Session-2 admin editor (PATCH
 * /v1/notification-settings, settings:edit / Super Admin). Upserts per-event channel rows (a subset is
 * allowed). On success it invalidates the read key so the editor + the My Account read-only tab refresh.
 * There is NO per-user override (global, SA-set). Toasts via the caller.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../api/client';
import { unwrap } from '../../../lib/query/unwrap';
import { notificationSettingsKeys } from './keys';
import type { NotificationSetting, UpdateNotificationSettingsBody } from '../notifications.types';

export function useSaveNotificationSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateNotificationSettingsBody) =>
      unwrap<NotificationSetting[]>(api.PATCH('/v1/notification-settings', { body })),
    onSuccess: () => qc.invalidateQueries({ queryKey: notificationSettingsKeys.all }),
  });
}
