/**
 * TierSchedulesSection — the effective-dated tier schedules in the shared EffectiveDatedTable (current /
 * pending / past, read-only). "Add schedule" opens the bracket editor. Reuses the Session-1 component (#10).
 */
import { useState } from 'react';
import { Button, Card, EffectiveDatedTable, type EffectiveColumn } from '../../../components/ui';
import { DataState } from '../../../components/data/DataState';
import { useCan } from '../../../auth/useCan';
import { money } from '../../../lib/format/money';
import { useTierSchedules } from '../api/useCommission';
import { TierScheduleModal } from './TierScheduleModal';
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
  const [open, setOpen] = useState(false);
  const q = useTierSchedules();

  const columns: EffectiveColumn<TierConfig>[] = [
    { header: 'Schedule', render: (c) => `${c.tiers.length} tiers · ${rateRange(c.tiers)} per activation` },
  ];
  const rows = q.data ?? [];

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
        <EffectiveDatedTable rows={rows} columns={columns} />
      </DataState>
      {canEdit && <TierScheduleModal open={open} onClose={() => setOpen(false)} />}
    </Card>
  );
}
