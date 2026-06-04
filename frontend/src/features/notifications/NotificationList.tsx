/**
 * NotificationList — the caller's own notifications inside the bell popover (read-only feed). Newest
 * first; unread rows are emphasised and carry a dot. Clicking an unread row marks it read (PATCH
 * /{id}/read) and invalidates the list. Loading/empty/error via DataState. No mark-all (no endpoint).
 */
import { DataState } from '../../components/data/DataState';
import { relativeTime } from '../../lib/format/date';
import { cx } from '../../components/ui';
import { useMarkNotificationRead, useNotifications } from './api/useNotifications';
import type { AppNotification } from './notifications.types';
import styles from './NotificationList.module.css';

export function NotificationList() {
  const q = useNotifications({});
  const markRead = useMarkNotificationRead();
  const rows = q.data ?? [];

  const onActivate = (n: AppNotification) => {
    if (!n.is_read) markRead.mutate(n.id);
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>Notifications</div>
      <div className={styles.scroll}>
        <DataState
          isLoading={q.isLoading}
          isError={q.isError}
          isEmpty={rows.length === 0}
          onRetry={() => q.refetch()}
          loadingNode={<p className={styles.muted}>Loading…</p>}
          emptyNode={<p className={styles.muted}>You're all caught up.</p>}
          errorMessage="Couldn't load notifications."
        >
          <ul className={styles.list}>
            {rows.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  className={cx(styles.item, !n.is_read && styles.unread)}
                  onClick={() => onActivate(n)}
                  aria-label={n.is_read ? n.title : `${n.title} (unread — mark read)`}
                >
                  <span className={styles.dot} aria-hidden data-on={!n.is_read} />
                  <span className={styles.body}>
                    <span className={styles.title}>{n.title}</span>
                    <span className={styles.text}>{n.body}</span>
                    <span className={styles.time}>{relativeTime(n.created_at)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </DataState>
      </div>
    </div>
  );
}
