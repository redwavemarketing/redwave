/**
 * BusinessDashboardPage — the org-wide executive view (design-system §10.1; SUPER ADMIN ONLY, enforced
 * server-side — CLAUDE §5). KPI tiles + a single-period financial-breakdown chart, driven by a pay-period
 * selector. The business endpoint returns single-period SCALARS only, so cross-period TREND charts await
 * a backend aggregation endpoint (flagged in-page, not faked). A 403 renders AccessDenied. — SRS §14
 */
import { useMemo, useState } from 'react';
import { Banner, Card, PageHeader, Select, StatCard } from '../../../components/ui';
import { DataState } from '../../../components/data/DataState';
import { useCan } from '../../../auth/useCan';
import { displayDate } from '../../../lib/format/date';
import { money } from '../../../lib/format/money';
import { useBusinessDashboard, usePayPeriods } from '../api/useDashboards';
import { ChartContainer } from '../charts/ChartContainer';
import { ThemedBarChart } from '../charts/ThemedBarChart';
import { AccessDenied } from '../components/AccessDenied';
import { isForbidden } from '../../../lib/api/apiError';
import styles from '../dashboards.module.css';

const ALL = '__all__';

export default function BusinessDashboardPage() {
  const canViewPeriods = useCan('payrun:view');
  const periods = usePayPeriods(canViewPeriods);
  const [periodId, setPeriodId] = useState<string | undefined>(undefined);

  const q = useBusinessDashboard({ pay_period_id: periodId });

  const periodOptions = useMemo(
    () => [
      { value: ALL, label: 'All periods (current)' },
      ...(periods.data ?? []).map((p) => ({
        value: p.id,
        label: `Period ${p.period_number} · ${displayDate(p.start_date)}–${displayDate(p.end_date)}`,
      })),
    ],
    [periods.data],
  );

  if (isForbidden(q.error)) return <AccessDenied message="The business dashboard is Super Admin only." />;

  const d = q.data;
  const breakdown = d
    ? [
        { metric: 'Revenue', amount: Number(d.revenue) },
        { metric: 'Rep payout', amount: Number(d.rep_payout) },
        { metric: 'Net margin', amount: Number(d.net_margin) },
        { metric: 'Holdback', amount: Number(d.holdback_liability) },
        { metric: 'Clawbacks', amount: Number(d.clawback_total) },
      ]
    : [];

  return (
    <div className={styles.page}>
      <PageHeader
        title="Business overview"
        subtitle="Org-wide financials and activity. Super Admin only."
        actions={
          canViewPeriods ? (
            <Select
              aria-label="Pay period"
              options={periodOptions}
              value={periodId ?? ALL}
              onValueChange={(v) => setPeriodId(v === ALL ? undefined : v)}
            />
          ) : undefined
        }
      />
      <DataState isLoading={q.isLoading} isError={q.isError} isEmpty={false} onRetry={() => q.refetch()}>
        {d && (
          <>
            <div className={styles.kpiGrid}>
              <StatCard label="Revenue" value={money(d.revenue)} footnote="Client statements" />
              <StatCard label="Rep payout" value={money(d.rep_payout)} footnote="Pay-run net" />
              <StatCard label="Net margin" value={money(d.net_margin)} footnote="Revenue − payout" />
              <StatCard label="Holdback liability" value={money(d.holdback_liability)} footnote="Held + scheduled" />
              <StatCard label="Clawback total" value={money(d.clawback_total)} footnote="Recovered" />
              <StatCard label="Active reps" value={d.active_rep_count} footnote="Status = active" />
            </div>

            <Card title="Financial breakdown (selected period)">
              <ChartContainer height={300}>
                <ThemedBarChart data={breakdown} categoryKey="metric" valueKey="amount" valueFormatter={money} />
              </ChartContainer>
            </Card>

            <Banner tone="info" title="Period-trend charts are coming">
              Cross-period trend &amp; breakdown charts (by client/product/rep over time) need a backend
              aggregation endpoint — the business endpoint returns one period&rsquo;s totals today. Tracked
              as a follow-up; the single-period breakdown above uses live data.
            </Banner>
          </>
        )}
      </DataState>
    </div>
  );
}
