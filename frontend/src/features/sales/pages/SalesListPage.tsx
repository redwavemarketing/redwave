/**
 * SalesListPage — the sales list + validation queue. Filter state (incl. free-text search) lives in the
 * URL search params (so a preset like `/sales?status=entered` is a shareable "Validation" link). Export
 * (CSV/Excel/PDF/Print) respects the active filters via a paged fetch-all. The "Enter sale" action is
 * gated by `sales:create` for convenience — the server still authorizes (CLAUDE §5). — SALE-001/007
 */
import { useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, PageHeader } from '../../../components/ui';
import { Can } from '../../../auth/Can';
import { useCan } from '../../../auth/useCan';
import { ExportMenu } from '../../../components/data/ExportMenu';
import type { ExportColumn } from '../../../lib/export/exportRows';
import { displayDate } from '../../../lib/format/date';
import { productTypeLabel } from '../../../lib/format/productType';
import { SalesFilterBar } from '../components/SalesFilterBar';
import { SalesTable } from '../components/SalesTable';
import { fetchAllSales, useClients } from '../api/useSales';
import type { Sale, SaleStatus, SalesFilters } from '../sales.types';

const FILTER_KEYS = ['status', 'rep_id', 'client_id', 'date_from', 'date_to', 'search'] as const;

export default function SalesListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const canViewClients = useCan('clients:view');
  const clients = useClients(canViewClients);

  const filters = useMemo<SalesFilters>(() => {
    const status = searchParams.get('status') ?? undefined;
    return {
      status: status as SaleStatus | undefined,
      rep_id: searchParams.get('rep_id') ?? undefined,
      client_id: searchParams.get('client_id') ?? undefined,
      date_from: searchParams.get('date_from') ?? undefined,
      date_to: searchParams.get('date_to') ?? undefined,
      search: searchParams.get('search') ?? undefined,
    };
  }, [searchParams]);

  const onChange = useCallback(
    (patch: Partial<SalesFilters>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const key of FILTER_KEYS) {
            if (key in patch) {
              const value = patch[key];
              if (value) next.set(key, value);
              else next.delete(key);
            }
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const clientName = (id: string) => clients.data?.find((c) => c.id === id)?.name ?? id;
  const exportColumns: ExportColumn<Sale>[] = [
    { header: 'Sale ID', value: (s) => s.sale_code },
    { header: 'Customer', value: (s) => s.customer_name },
    { header: 'Client', value: (s) => clientName(s.client_id) },
    { header: 'Products', value: (s) => s.sale_items.map((i) => productTypeLabel(i.product_type)).join(', ') },
    { header: 'Sale date', value: (s) => displayDate(s.sale_date) },
    { header: 'Greenfield', value: (s) => (s.is_greenfield ? 'Yes' : 'No') },
    { header: 'Status', value: (s) => s.status },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <PageHeader
        title="Sales"
        subtitle="Enter activations, then validate them into the pay run."
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <ExportMenu
              filename="sales"
              title="Sales"
              columns={exportColumns}
              getRows={() => fetchAllSales(filters)}
            />
            <Can permission="sales:create">
              <Button variant="primary" onClick={() => navigate('/sales/new')}>
                Enter sale
              </Button>
            </Can>
          </div>
        }
      />
      <SalesFilterBar filters={filters} onChange={onChange} />
      <SalesTable filters={filters} />
    </div>
  );
}
