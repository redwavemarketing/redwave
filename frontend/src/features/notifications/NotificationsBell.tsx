/**
 * NotificationsBell — the TopBar bell, now wired to /v1/notifications. Shows an unread dot when the
 * caller has any unread notification, and opens a Popover listing their own notifications (read-only;
 * click an unread row to mark it read). Closes the in-app notification loop (signature events surface here).
 */
import { Bell } from 'lucide-react';
import { IconButton } from '../../components/ui';
import { Popover } from '../../components/ui';
import { useNotifications } from './api/useNotifications';
import { NotificationList } from './NotificationList';
import styles from './NotificationsBell.module.css';

export function NotificationsBell() {
  // Cheap always-on query just for the unread dot; the full list loads when the popover opens.
  const unread = useNotifications({ is_read: false });
  const hasUnread = (unread.data?.length ?? 0) > 0;

  return (
    <span className={styles.wrap}>
      <Popover align="end" trigger={<IconButton label="Notifications" icon={<Bell size={18} />} />}>
        <NotificationList />
      </Popover>
      {hasUnread && <span className={styles.dot} aria-hidden />}
    </span>
  );
}
