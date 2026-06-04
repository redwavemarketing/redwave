/**
 * AppShell — design-system §5.2/§6.6. The structural frame every screen lives in: navy sidebar + top
 * bar + scrollable content region + minimal footer, with a skip-to-content link (§9). Routed pages
 * render into the <Outlet />. Tokens only.
 */
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { Footer } from './Footer';
import styles from './AppShell.module.css';

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className={styles.shell}>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <Sidebar collapsed={collapsed} />
      <div className={styles.body}>
        <TopBar onToggleSidebar={() => setCollapsed((c) => !c)} />
        <main id="main-content" className={styles.content}>
          <div className={styles.inner}>
            <Outlet />
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
