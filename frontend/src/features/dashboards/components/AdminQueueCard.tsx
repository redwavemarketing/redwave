/**
 * AdminQueueCard — an operational queue tile for the admin home: a labelled count that JUMPS to the
 * relevant screen (design-system §10.1 "action queues, not charts"). When the destination screen isn't
 * built yet, the card shows the count but the action is a disabled "screen coming" affordance rather
 * than a dead link. Tokens only.
 */
import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cx } from '../../../components/ui';
import styles from './AdminQueueCard.module.css';

export interface AdminQueueCardProps {
  label: string;
  count: number;
  icon?: ReactNode;
  /** Destination route; when omitted the card is informational (screen not built yet). */
  to?: string;
  /** Call-to-action text when `to` is present. */
  cta?: string;
}

export function AdminQueueCard({ label, count, icon, to, cta = 'Open' }: AdminQueueCardProps) {
  const active = count > 0;
  const body = (
    <>
      <div className={styles.top}>
        {icon && <span className={styles.icon}>{icon}</span>}
        <span className={styles.label}>{label}</span>
      </div>
      <div className={cx(styles.count, 'mono', active && styles.countActive)}>{count}</div>
      <div className={styles.cta}>
        {to ? (
          <>
            {cta} <ArrowRight size={14} aria-hidden />
          </>
        ) : (
          <span className={styles.soon}>Screen coming soon</span>
        )}
      </div>
    </>
  );

  return to ? (
    <Link to={to} className={cx(styles.card, styles.linkCard)}>
      {body}
    </Link>
  ) : (
    <div className={styles.card}>{body}</div>
  );
}
