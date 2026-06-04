/**
 * ChartContainer — the reusable chart shell: an optional title row + a fixed-height body that a
 * recharts ResponsiveContainer fills. The single place chart chrome lives, so every chart looks the
 * same. Tokens only; the chart inside colours itself from the chart tokens (see chartTheme.ts).
 */
import type { ReactNode } from 'react';
import styles from './charts.module.css';

export interface ChartContainerProps {
  title?: ReactNode;
  actions?: ReactNode;
  /** Body height in px (the responsive chart fills it). Default 280. */
  height?: number;
  children: ReactNode;
}

export function ChartContainer({ title, actions, height = 280, children }: ChartContainerProps) {
  return (
    <div className={styles.container}>
      {(title || actions) && (
        <div className={styles.head}>
          {title && <h3 className={styles.title}>{title}</h3>}
          {actions}
        </div>
      )}
      <div className={styles.body} style={{ height }}>
        {children}
      </div>
    </div>
  );
}
