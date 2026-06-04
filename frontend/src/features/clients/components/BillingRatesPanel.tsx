/**
 * BillingRatesPanel — the effective-dating UI for a client's billing rates (#10). A read-only
 * current/pending/past table (the shared EffectiveDatedTable) with filters, plus "Add rate" (clients:edit).
 * Rows are never edited — adding a future-dated rate supersedes/bounds (see BillingRateFormModal). Money is
 * exact-decimal via money(). This panel reads ONLY billing rates — never commission (#3). Tokens only.
 */
import { useState } from 'react';
import { Button, Select } from '../../../components/ui';
import { DataState } from '../../../components/data/DataState';
import { useCan } from '../../../auth/useCan';
import { money } from '../../../lib/format/money';
import { useClientBillingRates } from '../api/useClients';
import { EffectiveDatedTable, type EffectiveColumn } from '../../../components/ui';
import { BillingRateFormModal } from './BillingRateFormModal';
import type { BillingRate, BillingRateFilters, Product, RateKind } from '../clients.types';
import styles from './clients.module.css';

const ALL = '__all__';
const RATE_KIND_LABEL: Record<RateKind, string> = {
  product: 'Product rate',
  tv_addon: 'TV add-on',
  hp_addon: 'Home-phone add-on',
  bundle_bonus: 'Bundle bonus',
  spiff: 'Spiff',
};
const STATUS_OPTIONS = [
  { value: ALL, label: 'All statuses' },
  { value: 'current', label: 'Current' },
  { value: 'pending', label: 'Pending' },
  { value: 'past', label: 'Past' },
];

export function BillingRatesPanel({ clientId, products }: { clientId: string; products: Product[] }) {
  const canEdit = useCan('clients:edit');
  const [filters, setFilters] = useState<BillingRateFilters>({});
  const [addOpen, setAddOpen] = useState(false);
  const q = useClientBillingRates(clientId, filters);

  const productName = (id: string | null) => (id ? products.find((p) => p.id === id)?.name ?? '—' : '—');

  const columns: EffectiveColumn<BillingRate>[] = [
    { header: 'Rate kind', render: (r) => RATE_KIND_LABEL[r.rate_kind] },
    { header: 'Product', render: (r) => productName(r.product_id) },
    { header: 'Amount', align: 'right', render: (r) => money(r.amount) },
  ];

  const rates = q.data ?? [];
  return (
    <div>
      <div className={styles.filters}>
        <div className={styles.filterControl}>
          <Select
            aria-label="Product filter"
            options={[{ value: ALL, label: 'All products' }, ...products.map((p) => ({ value: p.id, label: p.name }))]}
            value={filters.productId ?? ALL}
            onValueChange={(v) => setFilters((f) => ({ ...f, productId: v === ALL ? undefined : v }))}
          />
        </div>
        <div className={styles.filterControl}>
          <Select
            aria-label="Rate kind filter"
            options={[{ value: ALL, label: 'All rate kinds' }, ...Object.entries(RATE_KIND_LABEL).map(([v, label]) => ({ value: v, label }))]}
            value={filters.rateKind ?? ALL}
            onValueChange={(v) => setFilters((f) => ({ ...f, rateKind: v === ALL ? undefined : (v as RateKind) }))}
          />
        </div>
        <div className={styles.filterControl}>
          <Select
            aria-label="Status filter"
            options={STATUS_OPTIONS}
            value={filters.status ?? ALL}
            onValueChange={(v) => setFilters((f) => ({ ...f, status: v === ALL ? undefined : (v as BillingRateFilters['status']) }))}
          />
        </div>
      </div>

      <DataState
        isLoading={q.isLoading}
        isError={q.isError}
        isEmpty={rates.length === 0}
        onRetry={() => q.refetch()}
        emptyNode={<p className={styles.supersedeNote}>No billing rates yet — add one to set what this client is charged.</p>}
      >
        <EffectiveDatedTable rows={rates} columns={columns} />
      </DataState>

      {canEdit && <BillingRateFormModal open={addOpen} clientId={clientId} products={products} onClose={() => setAddOpen(false)} />}
      {canEdit && (
        <div style={{ marginTop: 'var(--space-3)' }}>
          <Button variant="secondary" onClick={() => setAddOpen(true)}>
            Add rate
          </Button>
        </div>
      )}
    </div>
  );
}
