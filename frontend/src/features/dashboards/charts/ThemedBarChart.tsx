/**
 * ThemedBarChart — THE bar-chart pattern (recharts, token-themed). Single categorical series: each bar
 * is one category, coloured from the `--chart-N` tokens (per-bar via <Cell>), and **labelled directly**
 * on the category axis with the value printed on the bar — no separate legend box (design-system §3.4).
 * Because every colour is a CSS token, it renders correctly in BOTH themes with zero JS. Multi-series
 * charts (e.g. line/area trends) follow the same shape — add them here when a series endpoint exists.
 *
 * `data` is typed as an open record so recharts accepts plain-string dataKeys; callers pass arrays of
 * `{ [category]: string; [value]: number }` rows.
 */
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AXIS_LINE, AXIS_TICK, LABEL_FILL, seriesColor } from './chartTheme';
import { ChartTooltip } from './ChartTooltip';

export type ChartRow = Record<string, string | number>;

export interface ThemedBarChartProps {
  data: ReadonlyArray<ChartRow>;
  /** Field used as the category (axis label). */
  categoryKey: string;
  /** Numeric field plotted. */
  valueKey: string;
  /** 'vertical' renders horizontal bars (good for long category lists e.g. the leaderboard). */
  orientation?: 'vertical' | 'horizontal';
  /** Format the value for labels + tooltip (e.g. money string, or a plain count). */
  valueFormatter?: (value: number) => string;
  /** Optional fixed colour for every bar (else each category cycles the chart tokens). */
  uniformColor?: string;
}

export function ThemedBarChart({
  data,
  categoryKey,
  valueKey,
  orientation = 'horizontal',
  valueFormatter,
  uniformColor,
}: ThemedBarChartProps) {
  const horizontalBars = orientation === 'vertical'; // recharts 'vertical' layout = horizontal bars
  const fmt = valueFormatter ?? ((v: number) => String(v));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data as ChartRow[]}
        layout={orientation}
        margin={{ top: 16, right: 24, bottom: 8, left: horizontalBars ? 8 : 0 }}
      >
        {horizontalBars ? (
          <>
            <XAxis type="number" tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={false} />
            <YAxis
              type="category"
              dataKey={categoryKey}
              tick={AXIS_TICK}
              axisLine={AXIS_LINE}
              tickLine={false}
              width={140}
            />
          </>
        ) : (
          <>
            <XAxis dataKey={categoryKey} tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={false} />
            <YAxis type="number" tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={false} />
          </>
        )}
        <Tooltip cursor={{ fill: 'var(--surface-2)', opacity: 0.5 }} content={<ChartTooltip formatter={fmt} />} />
        <Bar dataKey={valueKey} radius={horizontalBars ? [0, 4, 4, 0] : [4, 4, 0, 0]} maxBarSize={56}>
          {data.map((_, i) => (
            <Cell key={i} fill={uniformColor ?? seriesColor(i)} />
          ))}
          <LabelList
            dataKey={valueKey}
            position={horizontalBars ? 'right' : 'top'}
            fill={LABEL_FILL}
            fontSize={12}
            formatter={(v: unknown) => fmt(Number(v))}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
