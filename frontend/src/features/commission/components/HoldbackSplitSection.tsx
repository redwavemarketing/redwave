/**
 * HoldbackSplitSection — effective-dated advance/holdback splits in the shared EffectiveDatedTable. "Set
 * split" supersedes; PENDING rows offer Edit (reuses HoldbackSplitModal) and Delete (ConfirmDialog). The
 * server is the real gate (current/past → 422). Reuses the Session-1 component (#10).
 */
import { useState } from 'react';
import { Button, Card, ConfirmDialog, EffectiveDatedTable, useToast, type EffectiveColumn } from '../../../components/ui';
import { DataState } from '../../../components/data/DataState';
import { useCan } from '../../../auth/useCan';
import { useApiErrorToast } from '../../../lib/api/apiError';
import { useHoldbackConfig } from '../api/useCommission';
import { useDeleteHoldback } from '../api/useCommissionMutations';
import { pctLabel } from '../pct';
import { HoldbackSplitModal } from './HoldbackSplitModal';
import { PendingRowActions } from './PendingRowActions';
import type { HoldbackConfig } from '../commission.types';

export function HoldbackSplitSection() {
  const canEdit = useCan('commission:edit');
  const { toast } = useToast();
  const onError = useApiErrorToast();
  const remove = useDeleteHoldback();
  const [open, setOpen] = useState(false);
  const [editRow, setEditRow] = useState<HoldbackConfig | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const q = useHoldbackConfig();

  const columns: EffectiveColumn<HoldbackConfig>[] = [
    { header: 'Advance', align: 'right', render: (r) => pctLabel(r.advance_pct) },
    { header: 'Holdback', align: 'right', render: (r) => pctLabel(r.holdback_pct) },
  ];
  const rows = q.data ?? [];

  const onConfirmDelete = () => {
    if (!deleteId) return;
    remove.mutate(deleteId, {
      onSuccess: () => { toast({ title: 'Holdback split deleted', tone: 'success' }); setDeleteId(null); },
      onError: (e) => { onError(e); setDeleteId(null); },
    });
  };

  return (
    <Card
      title="Holdback split"
      actions={canEdit ? <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>Set split</Button> : undefined}
    >
      <DataState
        isLoading={q.isLoading}
        isError={q.isError}
        isEmpty={rows.length === 0}
        onRetry={() => q.refetch()}
        emptyNode={<p className="mono">No holdback split set.</p>}
      >
        <EffectiveDatedTable
          rows={rows}
          columns={columns}
          rowActions={canEdit ? (r) => <PendingRowActions status={r.status} onEdit={() => setEditRow(r)} onDelete={() => setDeleteId(r.id)} /> : undefined}
        />
      </DataState>
      {canEdit && <HoldbackSplitModal open={open} onClose={() => setOpen(false)} />}
      {editRow && <HoldbackSplitModal open row={editRow} onClose={() => setEditRow(null)} />}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete pending split?"
        description="Removes the future-dated split before it takes effect."
        confirmLabel="Delete"
        loading={remove.isPending}
        onConfirm={onConfirmDelete}
      />
    </Card>
  );
}
