/**
 * SalesListPage — the sales list + validation queue. Filter state lives in the URL search params (so a
 * preset like `/sales?status=entered` is a shareable "Validation" link). The "Enter sale" action is
 * gated by `sales:create` for convenience — the server still authorizes (CLAUDE §5). — SALE-001/007
 */
import { useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, PageHeader } from '../../../components/ui';
import { Can } from '../../../auth/Can';
import { SalesFilterBar } from '../components/SalesFilterBar';
import { SalesTable } from '../components/SalesTable';
import type { SaleStatus, SalesFilters } from '../sales.types';

const FILTER_KEYS = ['status', 'rep_id', 'client_id', 'date_from', 'date_to'] as const;

export default function SalesListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo<SalesFilters>(() => {
    const status = searchParams.get('status') ?? undefined;
    return {
      status: status as SaleStatus | undefined,
      rep_id: searchParams.get('rep_id') ?? undefined,
      client_id: searchParams.get('client_id') ?? undefined,
      date_from: searchParams.get('date_from') ?? undefined,
      date_to: searchParams.get('date_to') ?? undefined,
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <PageHeader
        title="Sales"
        subtitle="Enter activations, then validate them into the pay run."
        actions={
          <Can permission="sales:create">
            <Button variant="primary" onClick={() => navigate('/sales/new')}>
              Enter sale
            </Button>
          </Can>
        }
      />
      <SalesFilterBar filters={filters} onChange={onChange} />
      <SalesTable filters={filters} />
    </div>
  );
}
