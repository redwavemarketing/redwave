/**
 * StatCard — design-system §6.3/§10.1 KPI tile. A labelled metric with a large value (mono+tabular for
 * money/counts), an optional Delta change indicator, and an optional footnote. Used across every
 * dashboard so KPI tiles look identical everywhere. Tokens only.
 */
import type { ReactNode } from 'react';
import { cx } from './cx';
import { Delta } from './Delta';
import styles from './StatCard.module.css';

export interface StatCardProps {
  label: ReactNode;
  value: ReactNode;
  /** Render the value in the mono tabular family (money, codes, counts). Default true. */
  mono?: boolean;
  /** Optional change indicator shown beside the value. */
  delta?: { value: string; direction: 'up' | 'down'; invert?: boolean };
  /** Small caption under the value (e.g. "Releases next cycle"). */
  footnote?: ReactNode;
  /** Optional leading icon in the label row. */
  icon?: ReactNode;
  className?: string;
}

export function StatCard({ label, value, mono = true, delta, footnote, icon, className }: StatCardProps) {
  return (
    <div className={cx(styles.card, className)}>
      <div className={styles.labelRow}>
        {icon && <span className={styles.icon}>{icon}</span>}
        <span className={styles.label}>{label}</span>
      </div>
      <div className={styles.valueRow}>
        <span className={cx(styles.value, mono && 'mono')}>{value}</span>
        {delta && <Delta value={delta.value} direction={delta.direction} invert={delta.invert} />}
      </div>
      {footnote && <p className={styles.footnote}>{footnote}</p>}
    </div>
  );
}
