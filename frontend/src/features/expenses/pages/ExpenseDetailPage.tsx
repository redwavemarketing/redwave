/**
 * ExpenseDetailPage — view a report + its items + the SERVER-computed km breakdown + status. Actions are
 * gated: Edit shows pre-approval (expenses:edit) or post-approval (Super Admin only — EXP-007); Review
 * (Approve/Reject/Send-back) shows for an approver while the report is submitted. Server is the real gate.
 */
import { useNavigate, useParams } from 'react-router-dom';
import { Breadcrumbs, Button, Card, PageHeader, Table, TBody, TD, TH, THead, TR } from '../../../components/ui';
import { DataState } from '../../../components/data/DataState';
import { useAuth } from '../../../auth/useAuth';
import { useCan } from '../../../auth/useCan';
import { isForbidden } from '../../../lib/api/apiError';
import { displayDate } from '../../../lib/format/date';
import { money } from '../../../lib/format/money';
import { AccessDenied } from '../../dashboards/components/AccessDenied';
import { useExpenseReport, useFieldConfigs } from '../api/useExpenses';
import { useClients, useReps } from '../api/useLookups';
import { categoryLabel, reportTotal } from '../format';
import { ExpenseStatusBadge } from '../components/ExpenseStatusBadge';
import { ReviewActions } from '../components/ReviewActions';
import styles from '../components/expenses.module.css';

export default function ExpenseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();
  const canEdit = useCan('expenses:edit');
  const canApprove = useCan('expenses:approve');
  const canViewReps = useCan('hrm:view');
  const canViewClients = useCan('clients:view');

  const q = useExpenseReport(id);
  const configs = useFieldConfigs();
  const reps = useReps(canViewReps);
  const clients = useClients(canViewClients);

  if (isForbidden(q.error)) return <AccessDenied message="You don’t have access to this report." />;

  const report = q.data;
  const repName = (rid: string | null) => (rid ? reps.data?.find((r) => r.id === rid)?.full_name ?? rid.slice(0, 8) : '—');
  const clientName = (cid: string | null) => (cid ? clients.data?.find((c) => c.id === cid)?.name ?? '—' : '—');

  const editable = report ? (report.status === 'approved' ? isSuperAdmin : canEdit) : false;
  const reviewable = !!report && canApprove && report.status === 'submitted';
  const kmItems = report?.expense_items.filter((i) => i.km_log) ?? [];

  return (
    <div className={styles.page}>
      <PageHeader
        breadcrumbs={<Breadcrumbs items={[{ label: 'Expenses', href: '/expenses' }, { label: 'Report' }]} />}
        title="Expense report"
      />
      <DataState isLoading={q.isLoading} isError={q.isError} isEmpty={false} onRetry={() => q.refetch()}>
        {report && (
          <>
            <Card title="Report">
              <div className={styles.detailHead}>
                <ExpenseStatusBadge status={report.status} />
                <strong className="mono">{money(reportTotal(report))}</strong>
              </div>
              <dl className={styles.dl} style={{ marginTop: 'var(--space-3)' }}>
                <dt>Week</dt>
                <dd className="mono">{displayDate(report.week_start)} – {displayDate(report.week_end)}</dd>
                <dt>Rep</dt>
                <dd>{repName(report.rep_id)}</dd>
                <dt>Pay period</dt>
                <dd>{report.pay_period_id ? 'Assigned' : '—'}</dd>
                <dt>Submitted</dt>
                <dd className="mono">{displayDate(report.created_at)}</dd>
                {report.approved_at && (
                  <>
                    <dt>Approved</dt>
                    <dd className="mono">{displayDate(report.approved_at)}</dd>
                  </>
                )}
              </dl>
            </Card>

            <Card title="Items">
              <Table density="comfortable">
                <THead>
                  <TR>
                    <TH>Category</TH>
                    <TH>Date</TH>
                    <TH>Description</TH>
                    {canViewClients && <TH>Client</TH>}
                    <TH>Receipt</TH>
                    <TH align="right">Amount</TH>
                  </TR>
                </THead>
                <TBody>
                  {report.expense_items.map((it) => (
                    <TR key={it.id}>
                      <TD>{categoryLabel(it.category, configs.data)}</TD>
                      <TD>{displayDate(it.expense_date)}</TD>
                      <TD>{it.description}</TD>
                      {canViewClients && <TD>{clientName(it.client_id)}</TD>}
                      <TD>{it.km_log ? '—' : it.receipt_url ? <span className="mono">{it.receipt_url}</span> : '—'}</TD>
                      <TD numeric>{money(it.amount)}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </Card>

            {kmItems.length > 0 && (
              <Card title="Kilometre details (server-computed)">
                {kmItems.map((it) => (
                  <div key={it.id} className={styles.kmBreakdown}>
                    <span>{displayDate(it.expense_date)} · {it.km_log!.trip_type === 'round' ? 'Round' : 'Single'}</span>
                    <span>Total <strong className="mono">{it.km_log!.total_km}</strong> km</span>
                    <span>− deduction <strong className="mono">{it.km_log!.deduction_km}</strong> km</span>
                    <span>= billable <strong className="mono">{it.km_log!.billable_km}</strong> km</span>
                    <span>× <strong className="mono">${it.km_log!.rate_per_km}</strong>/km</span>
                    <span>= <strong className="mono">{money(it.km_log!.computed_amount)}</strong></span>
                  </div>
                ))}
              </Card>
            )}

            <div className={styles.actions}>
              {editable && (
                <Button variant="secondary" onClick={() => navigate(`/expenses/${report.id}/edit`)}>
                  Edit
                </Button>
              )}
              {reviewable && <ReviewActions reportId={report.id} onDone={() => q.refetch()} />}
              <Button variant="tertiary" onClick={() => navigate('/expenses')}>
                Back to expenses
              </Button>
            </div>
          </>
        )}
      </DataState>
    </div>
  );
}
