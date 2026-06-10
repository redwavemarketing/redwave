/**
 * ThemedStackedAreaChart — stacked-area chart (recharts, token-themed) for composition-over-time (e.g.
 * activations by product type per period). Each series stacks into one `stackId`, coloured from the
 * `--chart-N` tokens (theme-correct). `data` is wide (one row per category with a column per series).
 */
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AXIS_LINE, AXIS_TICK, GRID_STROKE, seriesColor } from './chartTheme';
import { SeriesTooltip } from './SeriesTooltip';
import type { SeriesDef } from './ThemedLineChart';
import type { ChartRow } from './ThemedBarChart';

export interface ThemedStackedAreaChartProps {
  data: ReadonlyArray<ChartRow>;
  categoryKey: string;
  series: SeriesDef[];
  valueFormatter?: (value: number) => string;
}

export function ThemedStackedAreaChart({ data, categoryKey, series, valueFormatter }: ThemedStackedAreaChartProps) {
  const fmt = valueFormatter ?? ((v: number) => String(v));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data as ChartRow[]} margin={{ top: 16, right: 24, bottom: 8, left: 8 }}>
        <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={categoryKey} tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={false} />
        <YAxis tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={false} />
        <Tooltip content={<SeriesTooltip formatter={fmt} />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {series.map((s, i) => (
          <Area key={s.key} type="monotone" dataKey={s.key} name={s.label} stackId="1" stroke={seriesColor(i)} fill={seriesColor(i)} fillOpacity={0.5} />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
