/**
 * ExpenseEditPage — edit a report (`expenses:edit`). EDIT-RIGHTS (EXP-007): pre-approval needs
 * expenses:edit; an APPROVED report is editable only by a Super Admin (else 403). The UI applies the same
 * gate; the server is the real gate. PATCH replaces all items (the form rebuilds them).
 */
import { useParams } from 'react-router-dom';
import { Breadcrumbs, PageHeader } from '../../../components/ui';
import { DataState } from '../../../components/data/DataState';
import { useAuth } from '../../../auth/useAuth';
import { useCan } from '../../../auth/useCan';
import { isForbidden } from '../../../lib/api/apiError';
import { AccessDenied } from '../../dashboards/components/AccessDenied';
import { useFieldConfigs, useExpenseReport } from '../api/useExpenses';
import { useClients } from '../api/useLookups';
import { ExpenseForm } from '../components/ExpenseForm';
import styles from '../components/expenses.module.css';

export default function ExpenseEditPage() {
  const { id } = useParams<{ id: string }>();
  const { isSuperAdmin } = useAuth();
  const canEdit = useCan('expenses:edit');
  const canViewClients = useCan('clients:view');

  const report = useExpenseReport(id);
  const configs = useFieldConfigs(canEdit);
  const clients = useClients(canEdit && canViewClients);

  if (!canEdit || isForbidden(report.error) || isForbidden(configs.error)) {
    return <AccessDenied message="Editing expenses requires the expenses edit permission." />;
  }

  // Edit-rights gate (mirrors the server): approved → Super Admin only.
  if (report.data && report.data.status === 'approved' && !isSuperAdmin) {
    return <AccessDenied message="An approved report can only be edited by a Super Admin." />;
  }

  const ready = !!report.data && !!configs.data;
  const clientOptions = (clients.data ?? []).map((c) => ({ value: c.id, label: c.name }));
  return (
    <div className={styles.page}>
      <PageHeader
        breadcrumbs={<Breadcrumbs items={[{ label: 'Expenses', href: '/expenses' }, { label: 'Edit report' }]} />}
        title="Edit expense report"
      />
      <DataState
        isLoading={report.isLoading || configs.isLoading}
        isError={report.isError || configs.isError}
        isEmpty={false}
        onRetry={() => {
          void report.refetch();
          void configs.refetch();
        }}
      >
        {ready && <ExpenseForm mode="edit" report={report.data} configs={configs.data!} clientOptions={clientOptions} />}
      </DataState>
    </div>
  );
}
