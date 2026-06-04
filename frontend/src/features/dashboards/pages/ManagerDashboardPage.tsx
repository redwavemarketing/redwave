/**
 * ManagerDashboardPage — roster aggregates + the roster leaderboard (design-system §10.1). Counts only
 * (the manager endpoint returns no money). Pending-validations jumps to the validation queue. Data is
 * server-scoped to the manager's roster; a 403 (a bare rep with no roster) renders AccessDenied. — SRS §14
 */
import { CheckSquare, Receipt } from 'lucide-react';
import { Card, PageHeader, StatCard } from '../../../components/ui';
import { DataState } from '../../../components/data/DataState';
import { useLeaderboard, useManagerDashboard } from '../api/useDashboards';
import { AdminQueueCard } from '../components/AdminQueueCard';
import { LeaderboardTable } from '../components/LeaderboardTable';
import { AccessDenied } from '../components/AccessDenied';
import { isForbidden } from '../../../lib/api/apiError';
import styles from '../dashboards.module.css';

export default function ManagerDashboardPage() {
  const q = useManagerDashboard();
  const board = useLeaderboard();

  if (isForbidden(q.error)) return <AccessDenied message="The team view needs a roster — you have no reps assigned." />;

  const d = q.data;
  return (
    <div className={styles.page}>
      <PageHeader
        title="Team dashboard"
        subtitle={d?.period ? `Pay period ${d.period.period_number}` : 'No open pay period'}
      />
      <DataState isLoading={q.isLoading} isError={q.isError} isEmpty={false} onRetry={() => q.refetch()}>
        {d && (
          <>
            <div className={styles.kpiGrid}>
              <StatCard label="Team internet activations" value={d.team_internet_activations} footnote="This period, roster-wide" />
              <StatCard label="Sales in period" value={d.sales_in_period} footnote="All products" />
              <StatCard label="Roster size" value={d.roster_size ?? '—'} footnote="Active reps you manage" />
            </div>

            <div className={styles.queueGrid}>
              <AdminQueueCard
                label="Pending validations"
                count={d.pending_validations}
                icon={<CheckSquare size={16} />}
                to="/sales?status=entered"
                cta="Review queue"
              />
              <AdminQueueCard
                label="Expenses awaiting approval"
                count={d.pending_expense_approvals}
                icon={<Receipt size={16} />}
              />
            </div>

            <Card title="Leaderboard (counts only)">
              <DataState
                isLoading={board.isLoading}
                isError={board.isError}
                isEmpty={(board.data?.rankings.length ?? 0) === 0}
                onRetry={() => board.refetch()}
                emptyNode={<p className="mono">No ranked activity yet.</p>}
              >
                <LeaderboardTable rows={board.data?.rankings ?? []} maxRows={10} />
              </DataState>
            </Card>
          </>
        )}
      </DataState>
    </div>
  );
}
