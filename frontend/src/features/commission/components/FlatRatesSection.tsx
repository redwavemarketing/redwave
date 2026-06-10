/**
 * FlatRatesSection — effective-dated flat rates per product_type in the shared EffectiveDatedTable. "Add
 * rate" supersedes; PENDING rows offer Edit (reuses FlatRateModal) and Delete (ConfirmDialog). The server
 * is the real gate (current/past → 422). Reuses the Session-1 component (#10).
 */
import { useState } from 'react';
import { Button, Card, ConfirmDialog, EffectiveDatedTable, useToast, type EffectiveColumn } from '../../../components/ui';
import { DataState } from '../../../components/data/DataState';
import { useCan } from '../../../auth/useCan';
import { useApiErrorToast } from '../../../lib/api/apiError';
import { money } from '../../../lib/format/money';
import { productTypeLabel } from '../../../lib/format/productType';
import { useFlatRates } from '../api/useCommission';
import { useDeleteFlatRate } from '../api/useCommissionMutations';
import { FlatRateModal } from './FlatRateModal';
import { PendingRowActions } from './PendingRowActions';
import type { FlatRate } from '../commission.types';

export function FlatRatesSection() {
  const canEdit = useCan('commission:edit');
  const { toast } = useToast();
  const onError = useApiErrorToast();
  const remove = useDeleteFlatRate();
  const [open, setOpen] = useState(false);
  const [editRate, setEditRate] = useState<FlatRate | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const q = useFlatRates('all');

  const columns: EffectiveColumn<FlatRate>[] = [
    { header: 'Product type', render: (r) => productTypeLabel(r.product_type) },
    { header: 'Amount', align: 'right', render: (r) => money(r.amount) },
  ];
  const rows = q.data ?? [];

  const onConfirmDelete = () => {
    if (!deleteId) return;
    remove.mutate(deleteId, {
      onSuccess: () => { toast({ title: 'Flat rate deleted', tone: 'success' }); setDeleteId(null); },
      onError: (e) => { onError(e); setDeleteId(null); },
    });
  };

  return (
    <Card
      title="Flat rates"
      actions={canEdit ? <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>Add rate</Button> : undefined}
    >
      <DataState
        isLoading={q.isLoading}
        isError={q.isError}
        isEmpty={rows.length === 0}
        onRetry={() => q.refetch()}
        emptyNode={<p className="mono">No flat rates yet.</p>}
      >
        <EffectiveDatedTable
          rows={rows}
          columns={columns}
          rowActions={canEdit ? (r) => <PendingRowActions status={r.status} onEdit={() => setEditRate(r)} onDelete={() => setDeleteId(r.id)} /> : undefined}
        />
      </DataState>
      {canEdit && <FlatRateModal open={open} onClose={() => setOpen(false)} />}
      {editRate && <FlatRateModal open rate={editRate} onClose={() => setEditRate(null)} />}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete pending flat rate?"
        description="Removes the future-dated rate before it takes effect."
        confirmLabel="Delete"
        loading={remove.isPending}
        onConfirm={onConfirmDelete}
      />
    </Card>
  );
}
