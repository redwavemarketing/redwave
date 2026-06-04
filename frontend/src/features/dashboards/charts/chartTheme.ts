/**
 * Chart theming — THE charting pattern's token bridge (design-system §3.4). Series colours are the
 * `--chart-1..5` CSS variables (NOT hard-coded hex), so every chart themes via tokens and adapts to
 * light/dark automatically (the dark overrides live in styles/theme.css). Axis/grid colours reuse the
 * neutral tokens. Keep all chart colour decisions here so no chart component hard-codes a colour.
 */

/** Categorical series palette, in order. Each is a live `var(--chart-N)` reference. */
export const CHART_SERIES = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
] as const;

/** Colour for the i-th series/category (wraps after 5). */
export const seriesColor = (i: number): string => CHART_SERIES[i % CHART_SERIES.length];

/** Shared recharts axis styling (SVG attrs that reference tokens — resolve live on theme switch). */
export const AXIS_TICK = { fill: 'var(--text-secondary)', fontSize: 12 } as const;
export const AXIS_LINE = { stroke: 'var(--border)' } as const;
export const GRID_STROKE = 'var(--border)';
export const LABEL_FILL = 'var(--text-secondary)';
