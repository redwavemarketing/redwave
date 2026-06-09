/**
 * ThemedLineChart — multi-series line chart (recharts, token-themed) for cross-period TRENDS. Each series
 * colour is a `--chart-N` token (via seriesColor), so it renders correctly in both themes with zero JS. A
 * legend labels the series; the SeriesTooltip lists each value. `data` is wide (one row per category with
 * a column per series). — design-system §3.4 (charts), CLAUDE §13
 */
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AXIS_LINE, AXIS_TICK, GRID_STROKE, seriesColor } from './chartTheme';
import { SeriesTooltip } from './SeriesTooltip';
import type { ChartRow } from './ThemedBarChart';

export interface SeriesDef {
  key: string;
  label: string;
}

export interface ThemedLineChartProps {
  data: ReadonlyArray<ChartRow>;
  categoryKey: string;
  series: SeriesDef[];
  valueFormatter?: (value: number) => string;
}

export function ThemedLineChart({ data, categoryKey, series, valueFormatter }: ThemedLineChartProps) {
  const fmt = valueFormatter ?? ((v: number) => String(v));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data as ChartRow[]} margin={{ top: 16, right: 24, bottom: 8, left: 8 }}>
        <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={categoryKey} tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={false} />
        <YAxis tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={false} />
        <Tooltip content={<SeriesTooltip formatter={fmt} />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {series.map((s, i) => (
          <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={seriesColor(i)} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
