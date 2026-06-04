/**
 * Delta — design-system §6.7. A ▲/▼ change indicator in success/danger. Numeric value uses the mono
 * tabular family so deltas align in tables. Tokens only.
 */
import { cx } from './cx';
import styles from './Delta.module.css';

export interface DeltaProps {
  /** The change value as a display string (e.g. "+12", "-3.4%"). */
  value: string;
  direction: 'up' | 'down';
  /** When true, "down" is good (e.g. clawbacks decreasing) — swaps the colour. */
  invert?: boolean;
}

export function Delta({ value, direction, invert = false }: DeltaProps) {
  const positive = invert ? direction === 'down' : direction === 'up';
  return (
    <span className={cx(styles.delta, positive ? styles.positive : styles.negative)}>
      <span aria-hidden="true">{direction === 'up' ? '▲' : '▼'}</span>
      <span className="mono">{value}</span>
    </span>
  );
}
