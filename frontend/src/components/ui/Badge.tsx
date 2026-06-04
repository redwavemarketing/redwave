/**
 * Badge — design-system §6.7. A small label pill in a semantic tone. Always pairs colour with text
 * (never colour alone — §3.3/§9). Tokens only.
 */
import type { ReactNode } from 'react';
import { cx } from './cx';
import styles from './Badge.module.css';

export type BadgeTone =
  | 'neutral'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'muted';

export interface BadgeProps {
  tone?: BadgeTone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Badge({ tone = 'neutral', icon, children, className }: BadgeProps) {
  return (
    <span className={cx(styles.badge, styles[tone], className)}>
      {icon && <span className={styles.icon}>{icon}</span>}
      {children}
    </span>
  );
}
