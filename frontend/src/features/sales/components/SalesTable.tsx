/**
 * SalesTable — the validation-queue surface: the foundation Table fed by `useSalesList` (server filters
 * + client sort/paginate). Bulk-select (Entered rows only) → BulkActionBar → batch-validate. Money/IDs
 * use mono; status uses StatusPill. Loading/empty/error via DataState. Tokens only.
 */
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BulkActionBar,
  Button,
  Checkbox,
  IconButton,
  StatusPill,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Table,
  type SortDirection,
} from '../../../components/ui';
import { DataState } from '../../../components/data/DataState';
import { useCan } from '../../../auth/useCan';
import { useApiErrorToast } from '../../../lib/api/apiError';
import { displayDate } from '../../../lib/format/date';
import { useClients } from '../api/useSales';
import { useBulkValidate } from '../api/useSaleMutations';
import { useSalesList, type SortKey } from '../api/useSalesList';
import { useToast } from '../../../components/ui';
import type { BulkValidateResult, SalesFilters } from '../sales.types';
import { ProductSummary } from './ProductSummary';
import { GreenfieldBadge } from './GreenfieldBadge';
import { SaleRowActions } from './SaleRowActions';
import { BulkValidateSummary } from './BulkValidateSummary';
import styles from './SalesTable.module.css';

export function SalesTable({ filters }: { filters: SalesFilters }) {
  const list = useSalesList(filters);
  const canViewClients = useCan('clients:view');
  const canApprove = useCan('sales:approve');
  const clients = useClients(canViewClients);
  const { toast } = useToast();
  const onError = useApiErrorToast();
  const bulk = useBulkValidate();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [summary, setSummary] = useState<BulkValidateResult | null>(null);

  const clientName = (id: string) => clients.data?.find((c) => c.id === id)?.name ?? '—';
  const enteredOnPage = useMemo(() => list.rows.filter((s) => s.status === 'entered'), [list.rows]);
  const allEnteredSelected = enteredOnPage.length > 0 && enteredOnPage.every((s) => selected.has(s.id));
  const someSelected = selected.size > 0;

  const toggleRow = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allEnteredSelected) enteredOnPage.forEach((s) => next.delete(s.id));
      else enteredOnPage.forEach((s) => next.add(s.id));
      return next;
    });

  const sortDir = (key: SortKey): SortDirection =>
    list.sort.key === key ? list.sort.dir : null;

  const runBulkValidate = () =>
    bulk.mutate(
      { sale_ids: [...selected] },
      {
        onSuccess: (result) => {
          toast({
            title: `Validated ${result.validated} sale(s)`,
            description: result.failed > 0 ? `${result.failed} skipped` : undefined,
            tone: result.failed > 0 ? 'warning' : 'success',
          });
          setSummary(result.failed > 0 ? result : null);
          setSelected(new Set());
        },
        onError,
      },
    );

  return (
    <div className={styles.wrap}>
      {summary && <BulkValidateSummary result={summary} />}

      {someSelected && (
        <BulkActionBar count={selected.size}>
          <Button variant="primary" size="sm" loading={bulk.isPending} onClick={runBulkValidate}>
            Validate selected
          </Button>
          <Button variant="tertiary" size="sm" onClick={() => setSelected(new Set())}>
            Clear
          </Button>
        </BulkActionBar>
      )}

      <DataState
        isLoading={list.isLoading}
        isError={list.isError}
        isEmpty={list.total === 0}
        onRetry={() => void list.refetch()}
        emptyNode={<EmptyState />}
      >
        <Table>
          <THead>
            <TR>
              {canApprove && (
                <TH>
                  <Checkbox
                    aria-label="Select all entered"
                    checked={allEnteredSelected ? true : someSelected ? 'indeterminate' : false}
                    onCheckedChange={toggleAll}
                    disabled={enteredOnPage.length === 0}
                  />
                </TH>
              )}
              <TH sortable sortDirection={sortDir('sale_code')} onSort={() => list.toggleSort('sale_code')}>
                Sale ID
              </TH>
              <TH sortable sortDirection={sortDir('customer_name')} onSort={() => list.toggleSort('customer_name')}>
                Customer
              </TH>
              {canViewClients && <TH>Client</TH>}
              <TH>Products</TH>
              <TH sortable sortDirection={sortDir('sale_date')} onSort={() => list.toggleSort('sale_date')}>
                Sale date
              </TH>
              <TH>Greenfield</TH>
              <TH sortable sortDirection={sortDir('status')} onSort={() => list.toggleSort('status')}>
                Status
              </TH>
              <TH align="right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {list.rows.map((sale) => (
              <TR key={sale.id} selected={selected.has(sale.id)}>
                {canApprove && (
                  <TD>
                    {sale.status === 'entered' ? (
                      <Checkbox
                        aria-label={`Select ${sale.sale_code}`}
                        checked={selected.has(sale.id)}
                        onCheckedChange={() => toggleRow(sale.id)}
                      />
                    ) : null}
                  </TD>
                )}
                <TD numeric>
                  <Link to={`/sales/${sale.id}`} className={styles.idLink}>
                    {sale.sale_code}
                  </Link>
                </TD>
                <TD>{sale.customer_name}</TD>
                {canViewClients && <TD>{clientName(sale.client_id)}</TD>}
                <TD>
                  <ProductSummary items={sale.sale_items} />
                </TD>
                <TD numeric>{displayDate(sale.sale_date)}</TD>
                <TD>
                  <GreenfieldBadge on={sale.is_greenfield} />
                </TD>
                <TD>
                  <StatusPill status={sale.status} />
                </TD>
                <TD align="right">
                  <SaleRowActions sale={sale} />
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </DataState>

      {list.total > list.pageSize && (
        <div className={styles.pager}>
          <span className={styles.pageInfo}>
            <span className="mono">{list.total}</span> sale(s) · page{' '}
            <span className="mono">{list.page + 1}</span> of <span className="mono">{list.pageCount}</span>
          </span>
          <div className={styles.pagerBtns}>
            <IconButton label="Previous page" icon={<ChevronLeft size={16} />} variant="outline" size="sm" disabled={list.page === 0} onClick={() => list.setPage(list.page - 1)} />
            <IconButton label="Next page" icon={<ChevronRight size={16} />} variant="outline" size="sm" disabled={list.page >= list.pageCount - 1} onClick={() => list.setPage(list.page + 1)} />
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className={styles.empty}>
      <p className={styles.emptyMsg}>No sales match these filters.</p>
    </div>
  );
}
