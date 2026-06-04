/**
 * Banner / inline alert — design-system §6.5. Persistent context (e.g. "This sale is paid — snapshots
 * are locked", "Proposed rule — confirm with Redwave"). Tones map to semantic status. Tokens only.
 */
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { cx } from './cx';
import styles from './Banner.module.css';

export type BannerTone = 'info' | 'success' | 'warning' | 'danger';

const ICONS: Record<BannerTone, ReactNode> = {
  info: <Info size={18} aria-hidden />,
  success: <CheckCircle2 size={18} aria-hidden />,
  warning: <AlertTriangle size={18} aria-hidden />,
  danger: <XCircle size={18} aria-hidden />,
};

export interface BannerProps {
  tone?: BannerTone;
  title?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Banner({ tone = 'info', title, children, className }: BannerProps) {
  return (
    <div className={cx(styles.banner, styles[tone], className)} role="status">
      <span className={styles.icon}>{ICONS[tone]}</span>
      <div className={styles.content}>
        {title && <div className={styles.title}>{title}</div>}
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}
