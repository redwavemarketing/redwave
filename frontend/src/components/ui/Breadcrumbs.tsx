/**
 * Breadcrumbs — design-system §6.6. For nested detail pages. Tokens only.
 */
import { ChevronRight } from 'lucide-react';
import { Fragment } from 'react';
import styles from './Breadcrumbs.module.css';

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className={styles.nav} aria-label="Breadcrumb">
      <ol className={styles.list} role="list">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <Fragment key={i}>
              <li className={styles.item}>
                {c.href && !last ? (
                  <a href={c.href} className={styles.link}>
                    {c.label}
                  </a>
                ) : (
                  <span aria-current={last ? 'page' : undefined} className={last ? styles.current : undefined}>
                    {c.label}
                  </span>
                )}
              </li>
              {!last && <ChevronRight size={14} className={styles.sep} aria-hidden />}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
