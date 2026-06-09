/**
 * TierSchedulesSection — the effective-dated tier schedules in the shared EffectiveDatedTable (current /
 * pending / past). "Add schedule" opens the bracket editor (supersedes). A PENDING schedule can be Deleted
 * (ConfirmDialog) — to change one, delete it and add a new one (the bracket editor is the create surface).
 * The server is the real gate (current/past → 422). Reuses the Session-1 component (#10).
 */
import { useState } from 'react';
import { Button, Card, ConfirmDialog, EffectiveDatedTable, useToast, type EffectiveColumn } from '../../../components/ui';
import { DataState } from '../../../components/data/DataState';
import { useCan } from '../../../auth/useCan';
import { useApiErrorToast } from '../../../lib/api/apiError';
import { money } from '../../../lib/format/money';
import { useTierSchedules } from '../api/useCommission';
import { useDeleteTierSchedule } from '../api/useCommissionMutations';
import { TierScheduleModal } from './TierScheduleModal';
import { PendingRowActions } from './PendingRowActions';
import type { TierConfig, TierBracket } from '../commission.types';

function rateRange(tiers: TierBracket[]): string {
  if (tiers.length === 0) return '—';
  const rates = tiers.map((t) => Number(t.rate_per_activation));
  const min = Math.min(...rates).toFixed(2);
  const max = Math.max(...rates).toFixed(2);
  return `${money(min)}–${money(max)}`;
}

export function TierSchedulesSection() {
  const canEdit = useCan('commission:edit');
  const { toast } = useToast();
  const onError = useApiErrorToast();
  const remove = useDeleteTierSchedule();
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const q = useTierSchedules();

  const columns: EffectiveColumn<TierConfig>[] = [
    { header: 'Schedule', render: (c) => `${c.tiers.length} tiers · ${rateRange(c.tiers)} per activation` },
  ];
  const rows = q.data ?? [];

  const onConfirmDelete = () => {
    if (!deleteId) return;
    remove.mutate(deleteId, {
      onSuccess: () => { toast({ title: 'Tier schedule deleted', tone: 'success' }); setDeleteId(null); },
      onError: (e) => { onError(e); setDeleteId(null); },
    });
  };

  return (
    <Card
      title="Tier schedule"
      actions={canEdit ? <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>Add schedule</Button> : undefined}
    >
      <DataState
        isLoading={q.isLoading}
        isError={q.isError}
        isEmpty={rows.length === 0}
        onRetry={() => q.refetch()}
        emptyNode={<p className="mono">No tier schedule yet.</p>}
      >
        <EffectiveDatedTable
          rows={rows}
          columns={columns}
          rowActions={canEdit ? (c) => <PendingRowActions status={c.status} onDelete={() => setDeleteId(c.id)} /> : undefined}
        />
      </DataState>
      {canEdit && <TierScheduleModal open={open} onClose={() => setOpen(false)} />}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete pending schedule?"
        description="Removes the future-dated tier schedule before it takes effect. To change it, delete and add a new one."
        confirmLabel="Delete"
        loading={remove.isPending}
        onConfirm={onConfirmDelete}
      />
    </Card>
  );
}
