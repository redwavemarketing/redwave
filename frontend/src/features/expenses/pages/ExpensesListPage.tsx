/**
 * ExpensesListPage — My Expenses (SRS EXP-010). Server-scoped list of weekly reports with filters in the
 * URL (status/rep/client/date). Defaults the date range to the CURRENT pay cycle for users who can read
 * pay periods (payrun:view); others see their own reports unfiltered. New (expenses:create) + Export
 * (expenses:export). `expenses:view` to see; 403 → AccessDenied. Reuses the playbook.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, PageHeader } from '../../../components/ui';
import { DataState } from '../../../components/data/DataState';
import { useCan } from '../../../auth/useCan';
import { isForbidden } from '../../../lib/api/apiError';
import { todayIso } from '../../../lib/format/date';
import { AccessDenied } from '../../dashboards/components/AccessDenied';
import { currentPeriod, usePayPeriods } from '../api/useLookups';
import { useExpenseReports } from '../api/useExpenses';
import { ExpenseFilterBar } from '../components/ExpenseFilterBar';
import { ExpenseReportsTable } from '../components/ExpenseReportsTable';
import { ExportModal } from '../components/ExportModal';
import type { ExpenseFilters, ExpenseStatus } from '../expenses.types';
import styles from '../components/expenses.module.css';

const KEYS = ['status', 'rep_id', 'client_id', 'from', 'to'] as const;

export default function ExpensesListPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const canView = useCan('expenses:view');
  const canCreate = useCan('expenses:create');
  const canExport = useCan('expenses:export');
  const canViewPeriods = useCan('payrun:view');
  const [exportOpen, setExportOpen] = useState(false);

  const filters = useMemo<ExpenseFilters>(
    () => ({
      status: (params.get('status') as ExpenseStatus | null) ?? undefined,
      rep_id: params.get('rep_id') ?? undefined,
      client_id: params.get('client_id') ?? undefined,
      from: params.get('from') ?? undefined,
      to: params.get('to') ?? undefined,
    }),
    [params],
  );

  // One-time: default the date range to the current pay cycle (only if the URL has no filters at all).
  const periods = usePayPeriods(canView && canViewPeriods);
  const defaulted = useRef(false);
  useEffect(() => {
    if (defaulted.current || !periods.data) return;
    const empty = KEYS.every((k) => !params.get(k));
    const cur = currentPeriod(periods.data, todayIso());
    if (empty && cur) {
      defaulted.current = true;
      setParams({ from: cur.start_date.slice(0, 10), to: cur.end_date.slice(0, 10) }, { replace: true });
    } else {
      defaulted.current = true;
    }
  }, [periods.data, params, setParams]);

  const onChange = useCallback(
    (patch: Partial<ExpenseFilters>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const k of KEYS) {
            if (k in patch) {
              const v = patch[k];
              if (v) next.set(k, v);
              else next.delete(k);
            }
          }
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const q = useExpenseReports(filters, canView);

  if (!canView || isForbidden(q.error)) {
    return <AccessDenied message="Viewing expenses requires the expenses view permission." />;
  }

  const reports = q.data ?? [];
  return (
    <div className={styles.page}>
      <PageHeader
        title="Expenses"
        subtitle="Weekly expense reports across your scope."
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            {canExport && (
              <Button variant="secondary" onClick={() => setExportOpen(true)}>
                Export
              </Button>
            )}
            {canCreate && (
              <Button variant="primary" onClick={() => navigate('/expenses/new')}>
                New report
              </Button>
            )}
          </div>
        }
      />
      <ExpenseFilterBar filters={filters} onChange={onChange} />
      <DataState
        isLoading={q.isLoading}
        isError={q.isError}
        isEmpty={reports.length === 0}
        onRetry={() => q.refetch()}
        emptyNode={<p className="mono">No expense reports match these filters.</p>}
      >
        <ExpenseReportsTable reports={reports} />
      </DataState>
      <ExportModal open={exportOpen} onOpenChange={setExportOpen} />
    </div>
  );
}
