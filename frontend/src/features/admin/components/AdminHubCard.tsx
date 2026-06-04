/**
 * AdminHubCard — one card on the Administration hub (design-system §10.6 hub-of-cards). A built area is a
 * link ("Open →"); an area whose screen isn't built yet shows a "Coming soon" badge and is non-interactive
 * (the same affordance as the Admin-dashboard queue cards). Tokens only.
 */
import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Badge, cx } from '../../../components/ui';
import styles from './AdminHubCard.module.css';

export interface AdminHubCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  /** Destination route when the screen exists; omit for "coming soon". */
  to?: string;
}

export function AdminHubCard({ title, description, icon, to }: AdminHubCardProps) {
  const body = (
    <>
      <div className={styles.top}>
        <span className={styles.icon}>{icon}</span>
        {!to && <Badge tone="muted">Coming soon</Badge>}
      </div>
      <span className={styles.title}>{title}</span>
      <span className={styles.desc}>{description}</span>
      {to && (
        <span className={styles.cta}>
          Open <ArrowRight size={14} aria-hidden />
        </span>
      )}
    </>
  );

  return to ? (
    <Link to={to} className={cx(styles.card, styles.linkCard)}>
      {body}
    </Link>
  ) : (
    <div className={cx(styles.card, styles.disabled)}>{body}</div>
  );
}
