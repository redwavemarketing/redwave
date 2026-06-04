/**
 * Card / panel — design-system §6.5. Groups related content; subtle border + --shadow-1. KPI tiles
 * are cards. Optional header (title + actions). Tokens only.
 */
import type { ReactNode } from 'react';
import { cx } from './cx';
import styles from './Card.module.css';

export interface CardProps {
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  /** Remove body padding (e.g. when wrapping a full-bleed table). */
  flush?: boolean;
  className?: string;
}

export function Card({ title, actions, children, flush, className }: CardProps) {
  return (
    <section className={cx(styles.card, className)}>
      {(title || actions) && (
        <header className={styles.header}>
          {title && <h3 className={styles.title}>{title}</h3>}
          {actions && <div className={styles.actions}>{actions}</div>}
        </header>
      )}
      <div className={cx(!flush && styles.body)}>{children}</div>
    </section>
  );
}
