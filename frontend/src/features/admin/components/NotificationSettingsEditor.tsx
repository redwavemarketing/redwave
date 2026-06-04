/**
 * NotificationSettingsEditor — the per-event channel grid (SRS AUTH-013; Super Admin). Reuses the
 * Session-1 read hook (passed in as `settings`) and adds the write via useSaveNotificationSettings. Local
 * edits are dirty-tracked vs the loaded settings; "Save changes" PATCHes ONLY the changed rows. There is
 * NO per-user override (global, SA-set). Read-only (Switches disabled, no Save) without settings:edit.
 */
import { useState } from 'react';
import { Button, Switch, useToast } from '../../../components/ui';
import { useApiErrorToast } from '../../../lib/api/apiError';
import { useSaveNotificationSettings } from '../../notifications/api/useNotificationSettingsMutation';
import type { NotificationSetting } from '../../notifications/notifications.types';
import styles from '../admin.module.css';

const humanize = (eventType: string): string =>
  eventType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

type Draft = Record<string, { in_app: boolean; email: boolean }>;

export function NotificationSettingsEditor({
  settings,
  canEdit,
}: {
  settings: NotificationSetting[];
  canEdit: boolean;
}) {
  const { toast } = useToast();
  const onError = useApiErrorToast();
  const save = useSaveNotificationSettings();

  const [draft, setDraft] = useState<Draft>(() =>
    Object.fromEntries(settings.map((s) => [s.event_type, { in_app: s.in_app_enabled, email: s.email_enabled }])),
  );

  const changedRows = settings.filter((s) => {
    const d = draft[s.event_type];
    return d && (d.in_app !== s.in_app_enabled || d.email !== s.email_enabled);
  });
  const dirty = changedRows.length > 0;

  const toggle = (eventType: string, channel: 'in_app' | 'email', value: boolean) =>
    setDraft((prev) => ({ ...prev, [eventType]: { ...prev[eventType], [channel]: value } }));

  const onSave = () => {
    if (!dirty) return;
    const payload = changedRows.map((s) => ({
      event_type: s.event_type,
      in_app_enabled: draft[s.event_type].in_app,
      email_enabled: draft[s.event_type].email,
    }));
    save.mutate(
      { settings: payload },
      { onSuccess: () => toast({ title: 'Notification settings saved', tone: 'success' }), onError },
    );
  };

  return (
    <div className={styles.page}>
      <div className={styles.channelHead}>
        <span>Event</span>
        <span className={styles.channelHeadLabel}>In-app</span>
        <span className={styles.channelHeadLabel}>Email</span>
      </div>
      <div className={styles.notifList}>
        {settings.map((s) => {
          const d = draft[s.event_type] ?? { in_app: s.in_app_enabled, email: s.email_enabled };
          return (
            <div key={s.id} className={styles.notifRow}>
              <span className={styles.notifEvent}>{humanize(s.event_type)}</span>
              <span className={styles.channelCell}>
                <Switch
                  aria-label={`${s.event_type} in-app`}
                  checked={d.in_app}
                  disabled={!canEdit}
                  onCheckedChange={(c) => toggle(s.event_type, 'in_app', c)}
                />
              </span>
              <span className={styles.channelCell}>
                <Switch
                  aria-label={`${s.event_type} email`}
                  checked={d.email}
                  disabled={!canEdit}
                  onCheckedChange={(c) => toggle(s.event_type, 'email', c)}
                />
              </span>
            </div>
          );
        })}
      </div>
      {canEdit && (
        <div className={styles.saveBar}>
          {dirty && <span className={styles.dirtyHint}>{changedRows.length} unsaved change(s)</span>}
          <Button variant="primary" onClick={onSave} disabled={!dirty} loading={save.isPending}>
            Save changes
          </Button>
        </div>
      )}
    </div>
  );
}
