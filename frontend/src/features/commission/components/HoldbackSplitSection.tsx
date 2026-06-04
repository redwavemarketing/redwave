/**
 * HoldbackSplitSection — effective-dated advance/holdback splits in the shared EffectiveDatedTable. "Set
 * split" opens the form (live 100% check). Reuses the Session-1 component (#10).
 */
import { useState } from 'react';
import { Button, Card, EffectiveDatedTable, type EffectiveColumn } from '../../../components/ui';
import { DataState } from '../../../components/data/DataState';
import { useCan } from '../../../auth/useCan';
import { useHoldbackConfig } from '../api/useCommission';
import { pctLabel } from '../pct';
import { HoldbackSplitModal } from './HoldbackSplitModal';
import type { HoldbackConfig } from '../commission.types';

export function HoldbackSplitSection() {
  const canEdit = useCan('commission:edit');
  const [open, setOpen] = useState(false);
  const q = useHoldbackConfig();

  const columns: EffectiveColumn<HoldbackConfig>[] = [
    { header: 'Advance', align: 'right', render: (r) => pctLabel(r.advance_pct) },
    { header: 'Holdback', align: 'right', render: (r) => pctLabel(r.holdback_pct) },
  ];
  const rows = q.data ?? [];

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
        <EffectiveDatedTable rows={rows} columns={columns} />
      </DataState>
      {canEdit && <HoldbackSplitModal open={open} onClose={() => setOpen(false)} />}
    </Card>
  );
}
