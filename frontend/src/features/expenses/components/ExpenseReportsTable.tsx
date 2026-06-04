/**
 * ExpenseReportsTable — the My Expenses list. One row per weekly report (Week, Rep [gated], status, item
 * count, total). The Rep column shows only with hrm:view (others see their own reports). Total is an
 * exact-decimal sum of item amounts (km amounts are the server-computed values stored on the item). Row →
 * detail. Tokens only.
 */
import { Link } from 'react-router-dom';
import { Table, TBody, TD, TH, THead, TR } from '../../../components/ui';
import { useCan } from '../../../auth/useCan';
import { displayDate } from '../../../lib/format/date';
import { money } from '../../../lib/format/money';
import { useReps } from '../api/useLookups';
import { reportTotal } from '../format';
import { ExpenseStatusBadge } from './ExpenseStatusBadge';
import type { ExpenseReport } from '../expenses.types';
import styles from './expenses.module.css';

export function ExpenseReportsTable({ reports }: { reports: ExpenseReport[] }) {
  const canViewReps = useCan('hrm:view');
  const reps = useReps(canViewReps);
  const repName = (id: string | null) => {
    if (!id) return '—';
    const r = reps.data?.find((x) => x.id === id);
    return r ? `${r.full_name}` : id.slice(0, 8);
  };

  return (
    <Table density="comfortable">
      <THead>
        <TR>
          <TH>Week of</TH>
          {canViewReps && <TH>Rep</TH>}
          <TH>Status</TH>
          <TH align="right">Items</TH>
          <TH align="right">Total</TH>
          <TH>Submitted</TH>
        </TR>
      </THead>
      <TBody>
        {reports.map((r) => (
          <TR key={r.id}>
            <TD>
              <Link to={`/expenses/${r.id}`} className={styles.reviewName}>
                {displayDate(r.week_start)}
              </Link>
            </TD>
            {canViewReps && <TD>{repName(r.rep_id)}</TD>}
            <TD>
              <ExpenseStatusBadge status={r.status} />
            </TD>
            <TD numeric>{r.expense_items.length}</TD>
            <TD numeric>{money(reportTotal(r))}</TD>
            <TD>{displayDate(r.created_at)}</TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}
