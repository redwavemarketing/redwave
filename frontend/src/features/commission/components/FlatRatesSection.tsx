/**
 * FlatRatesSection — effective-dated flat rates per product_type in the shared EffectiveDatedTable. "Add
 * rate" opens the flat-rate form (internet excluded). Reuses the Session-1 component (#10).
 */
import { useState } from 'react';
import { Button, Card, EffectiveDatedTable, type EffectiveColumn } from '../../../components/ui';
import { DataState } from '../../../components/data/DataState';
import { useCan } from '../../../auth/useCan';
import { money } from '../../../lib/format/money';
import { productTypeLabel } from '../../../lib/format/productType';
import { useFlatRates } from '../api/useCommission';
import { FlatRateModal } from './FlatRateModal';
import type { FlatRate } from '../commission.types';

export function FlatRatesSection() {
  const canEdit = useCan('commission:edit');
  const [open, setOpen] = useState(false);
  const q = useFlatRates('all');

  const columns: EffectiveColumn<FlatRate>[] = [
    { header: 'Product type', render: (r) => productTypeLabel(r.product_type) },
    { header: 'Amount', align: 'right', render: (r) => money(r.amount) },
  ];
  const rows = q.data ?? [];

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
        <EffectiveDatedTable rows={rows} columns={columns} />
      </DataState>
      {canEdit && <FlatRateModal open={open} onClose={() => setOpen(false)} />}
    </Card>
  );
}
