/**
 * SessionLoading — a full-screen branded loading state shown while the session boots (restoring a
 * saved session). The LoadingSpinner carries the status role + label. Tokens only. Avoids flashing the
 * login screen for an already-authenticated user.
 */
import { LoadingSpinner } from '../components/ui';
import styles from './SessionLoading.module.css';

export function SessionLoading() {
  return (
    <div className={styles.screen}>
      <LoadingSpinner size="lg" />
    </div>
  );
}
