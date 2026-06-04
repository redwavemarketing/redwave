/**
 * ExpenseApprovalsPage — the pending-approval queue (SRS EXP-006). REUSES the profile-review pattern: a
 * server-scoped list (`status=submitted`; manager=roster, admin/SA=all — the UI never filters) → a card
 * per report with Approve / Reject / Send-back. `expenses:approve` to see; 403 → AccessDenied.
 */
import { PageHeader } from '../../../components/ui';
import { DataState } from '../../../components/data/DataState';
import { useCan } from '../../../auth/useCan';
import { isForbidden } from '../../../lib/api/apiError';
import { AccessDenied } from '../../dashboards/components/AccessDenied';
import { useExpenseReports, useFieldConfigs } from '../api/useExpenses';
import { ExpenseReviewCard } from '../components/ExpenseReviewCard';
import styles from '../components/expenses.module.css';

export default function ExpenseApprovalsPage() {
  const canApprove = useCan('expenses:approve');
  const q = useExpenseReports({ status: 'submitted' }, canApprove);
  const configs = useFieldConfigs(canApprove);

  if (!canApprove || isForbidden(q.error)) {
    return <AccessDenied message="Reviewing expenses requires the expenses approve permission." />;
  }

  const reports = q.data ?? [];
  return (
    <div className={styles.page}>
      <PageHeader title="Expense approvals" subtitle="Reports submitted for your review. Approve, reject, or send back." />
      <DataState
        isLoading={q.isLoading}
        isError={q.isError}
        isEmpty={reports.length === 0}
        onRetry={() => q.refetch()}
        emptyNode={<p className="mono">No expenses awaiting approval.</p>}
      >
        <div className={styles.queue}>
          {reports.map((r) => (
            <ExpenseReviewCard key={r.id} report={r} configs={configs.data ?? []} />
          ))}
        </div>
      </DataState>
    </div>
  );
}
