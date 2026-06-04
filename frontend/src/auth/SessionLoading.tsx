/**
 * SessionLoading — a full-screen branded loading state shown while the session boots (restoring a
 * saved session). Tokens only. Avoids flashing the login screen for an already-authenticated user.
 */
import styles from './SessionLoading.module.css';

export function SessionLoading() {
  return (
    <div className={styles.screen} role="status" aria-live="polite" aria-label="Loading">
      <span className={styles.mark} aria-hidden>
        R
      </span>
      <span className={styles.spinner} aria-hidden />
    </div>
  );
}
