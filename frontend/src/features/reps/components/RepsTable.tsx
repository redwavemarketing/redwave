/**
 * RepsTable — the HRM rep roster on the shared <DataTable> (server pagination/sort + the FORBIDDEN state).
 * Read-only: the roster view this batch unblocks (rep CRUD is a future screen). Columns: code · name ·
 * status · field manager (name resolved via users:view, else hidden) · hire date. Convenience gating only —
 * the server is the real gate (§5).
 */
import { Badge } from '../../../components/ui';
import { DataTable, type DataColumn } from '../../../components/data/DataTable';
import { useCan } from '../../../auth/useCan';
import { displayDate } from '../../../lib/format/date';
import { useUsers } from '../../admin/api/useUsers';
import { useRepsTable } from '../api/useReps';
import type { Rep, RepSortKey, RepsFilters } from '../reps.types';

export function RepsTable({ filters }: { filters: RepsFilters }) {
  const list = useRepsTable(filters);
  const canViewUsers = useCan('users:view');
  const users = useUsers(canViewUsers);

  const managerName = (id: string) => users.data?.find((u) => u.id === id)?.full_name ?? '—';

  const columns: DataColumn<Rep, RepSortKey>[] = [
    { id: 'rep_code', header: 'Code', sortKey: 'rep_code', render: (r) => <span className="mono">{r.rep_code}</span> },
    { id: 'full_name', header: 'Name', sortKey: 'full_name', render: (r) => r.full_name },
    {
      id: 'status',
      header: 'Status',
      sortKey: 'status',
      render: (r) => <Badge tone={r.status === 'active' ? 'success' : 'neutral'}>{r.status === 'active' ? 'Active' : 'Terminated'}</Badge>,
    },
    ...(canViewUsers ? [{ id: 'manager', header: 'Field manager', render: (r: Rep) => managerName(r.field_manager_id) }] : []),
    { id: 'hire_date', header: 'Hired', sortKey: 'hire_date', render: (r) => displayDate(r.hire_date) },
  ];

  return (
    <DataTable<Rep, RepSortKey>
      columns={columns}
      rows={list.rows}
      getRowId={(r) => r.id}
      sort={{ key: list.sort.key, dir: list.sort.dir }}
      onSortChange={list.toggleSort}
      page={list.page}
      pageCount={list.pageCount}
      total={list.total}
      limit={list.limit}
      onPageChange={list.setPage}
      isLoading={list.isLoading}
      isError={list.isError}
      error={list.error}
      onRetry={() => void list.refetch()}
      emptyNode={<p className="mono">No reps match these filters.</p>}
      forbiddenMessage="You don’t have permission to view reps."
      aria-label="Reps"
    />
  );
}
