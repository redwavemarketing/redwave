/**
 * SeriesTooltip — a token-styled multi-series recharts tooltip (for line / stacked-area charts). Lists each
 * series with its themed colour dot + a mono value. The dot colour is a `var(--chart-N)` token passed by
 * recharts (not a hard-coded hex), so it stays theme-correct.
 */
import styles from './charts.module.css';

interface SeriesPayloadItem {
  name?: string;
  value?: number | string;
  color?: string;
}

export interface SeriesTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: SeriesPayloadItem[];
  formatter?: (value: number) => string;
}

export function SeriesTooltip({ active, label, payload, formatter }: SeriesTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className={styles.tooltip}>
      {label !== undefined && <div className={styles.tipLabel}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className={styles.tipRow}>
          <span className={styles.tipDot} style={{ backgroundColor: p.color }} />
          <span className={styles.tipName}>{p.name}</span>
          <span className={`${styles.tipRowValue} mono`}>{formatter ? formatter(Number(p.value)) : String(p.value)}</span>
        </div>
      ))}
    </div>
  );
}
