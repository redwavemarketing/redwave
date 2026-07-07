/**
 * ExpenseApprovalsPage — the approval queue as FOLDERS (report-as-folder, EXP-006). Lists the report folders
 * with ≥1 item awaiting review (server-filtered + scoped: manager=roster, admin/SA=all — the UI never
 * filters). From a row the approver can Approve-all / Send-back-all, or open the folder workspace to review
 * per item. The item-level flagged count is shown for context. `expenses:approve` to see; 403 → AccessDenied.
 */
import { PageHeader } from '../../../components/ui';
import { useCan } from '../../../auth/useCan';
import { AccessDenied } from '../../dashboards/components/AccessDenied';
import { FoldersTable } from '../components/FoldersTable';
import { ValidationSummaryBanner } from '../components/ValidationSummaryBanner';
import type { ExpenseFilters } from '../expenses.types';
import type { ReportFilters } from '../api/useExpenseReports';
import styles from '../components/expenses.module.css';

const SUBMITTED_ITEMS: ExpenseFilters = { status: 'submitted' };
const AWAITING: ReportFilters = { awaiting_review: 'true' };

export default function ExpenseApprovalsPage() {
  const canApprove = useCan('expenses:approve');
  if (!canApprove) {
    return <AccessDenied message="Reviewing expenses requires the expenses approve permission." />;
  }
  return (
    <div className={styles.page}>
      <PageHeader
        title="Expense approvals"
        subtitle="Report folders awaiting review. Approve or send back a whole folder, or open it to review item by item."
      />
      <ValidationSummaryBanner filters={SUBMITTED_ITEMS} />
      <FoldersTable filters={AWAITING} canReview />
    </div>
  );
}
