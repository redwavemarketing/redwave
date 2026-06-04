/**
 * ChartTooltip — token-styled replacement for the recharts default tooltip (which is a hard-coded white
 * box). Reads the hovered category + value and renders them with our surface/border/shadow tokens and a
 * mono value, so the tooltip looks native in both themes.
 */
import styles from './charts.module.css';

interface TooltipPayloadItem {
  value?: number | string;
}

export interface ChartTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: TooltipPayloadItem[];
  formatter?: (value: number) => string;
}

export function ChartTooltip({ active, label, payload, formatter }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const raw = payload[0]?.value;
  const value = formatter ? formatter(Number(raw)) : String(raw);
  return (
    <div className={styles.tooltip}>
      {label !== undefined && <div className={styles.tipLabel}>{label}</div>}
      <div className={`${styles.tipValue} mono`}>{value}</div>
    </div>
  );
}
