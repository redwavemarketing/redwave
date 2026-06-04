/**
 * ExpenseReviewCard — one report in the approval queue (mirrors the Account ReviewRequestCard). Shows the
 * submitter/week, the item summary (category + amount; km amounts are the server-computed values), the
 * total, and the review actions (Approve / Reject / Send-back) + links to view/edit. Tokens only.
 */
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '../../../components/ui';
import { useCan } from '../../../auth/useCan';
import { displayDate } from '../../../lib/format/date';
import { money } from '../../../lib/format/money';
import { useReps } from '../api/useLookups';
import { categoryLabel, reportTotal } from '../format';
import { ExpenseStatusBadge } from './ExpenseStatusBadge';
import { ReviewActions } from './ReviewActions';
import type { ExpenseReport, FieldConfig } from '../expenses.types';
import styles from './expenses.module.css';

export function ExpenseReviewCard({ report, configs }: { report: ExpenseReport; configs: FieldConfig[] }) {
  const navigate = useNavigate();
  const canViewReps = useCan('hrm:view');
  const canEdit = useCan('expenses:edit');
  const reps = useReps(canViewReps);
  const rep = reps.data?.find((r) => r.id === report.rep_id);

  return (
    <Card>
      <div className={styles.reviewHead}>
        <div className={styles.reviewIdentity}>
          <div className={styles.reviewName}>Week of {displayDate(report.week_start)}</div>
          <div className={styles.reviewMeta}>
            {rep ? `${rep.full_name} (${rep.rep_code})` : 'Submitter'} · {report.expense_items.length} item(s)
          </div>
        </div>
        <ExpenseStatusBadge status={report.status} />
      </div>

      <div className={styles.reviewItems}>
        {report.expense_items.map((it) => (
          <div key={it.id} className={styles.reviewItem}>
            <span>
              {categoryLabel(it.category, configs)} · {displayDate(it.expense_date)} · {it.description}
            </span>
            <span className="mono">{money(it.amount)}</span>
          </div>
        ))}
        <div className={styles.reviewItem}>
          <strong>Total</strong>
          <strong className="mono">{money(reportTotal(report))}</strong>
        </div>
      </div>

      <div className={styles.actions}>
        <ReviewActions reportId={report.id} />
        {canEdit && (
          <Button variant="tertiary" onClick={() => navigate(`/expenses/${report.id}/edit`)}>
            Edit
          </Button>
        )}
        <Button variant="tertiary" onClick={() => navigate(`/expenses/${report.id}`)}>
          View
        </Button>
      </div>
    </Card>
  );
}
