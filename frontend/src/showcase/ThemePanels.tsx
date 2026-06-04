/**
 * ThemePanels — renders the same content TWICE side by side in a forced-light and a forced-dark panel
 * (each carries its own data-theme so the tokens re-root). The at-a-glance proof that in-flow
 * components render correctly in BOTH themes. (Portaled overlays — modal/select/toast — follow the
 * GLOBAL theme; toggle the top-bar control to see those in both.)
 */
import type { ReactNode } from 'react';
import styles from './Showcase.module.css';

export function ThemePanels({ children }: { children: ReactNode }) {
  return (
    <div className={styles.panels}>
      <div className={styles.panel} data-theme="light">
        <span className={styles.panelTag}>Light</span>
        <div className={styles.panelBody}>{children}</div>
      </div>
      <div className={styles.panel} data-theme="dark">
        <span className={styles.panelTag}>Dark</span>
        <div className={styles.panelBody}>{children}</div>
      </div>
    </div>
  );
}
