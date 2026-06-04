/**
 * StatementDetailPage — /billing/statements/:id. Renders the persisted statement (ONE LINE PER CUSTOMER, the
 * server total, NO GST) and the paired one-line commission invoice (billing-stream total). The UI prices
 * nothing and shows NO commission data (#3) — `total_commission` IS the billing-stream statement total.
 * Regenerate is explicit (it replaces). Export is a stub. `billing:view`; create/export gate the actions.
 */
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileDown, RefreshCw } from 'lucide-react';
import { Button, Card, PageHeader, StatCard, TableError, TableSkeleton, useToast } from '../../../components/ui';
import { useCan } from '../../../auth/useCan';
import { isForbidden, useApiErrorToast } from '../../../lib/api/apiError';
import { money } from '../../../lib/format/money';
import { displayDate } from '../../../lib/format/date';
import { AccessDenied } from '../../dashboards/components/AccessDenied';
import { useClients } from '../../clients/api/useClients';
import { usePayPeriods } from '../../payrun/api/usePayRun';
import { useInvoiceFor, useStatement } from '../api/useBilling';
import { useExportInvoice, useExportStatement } from '../api/useBillingMutations';
import { StatementLinesTable } from '../components/StatementLinesTable';
import { InvoiceCard } from '../components/InvoiceCard';
import { BillingExportModal } from '../components/BillingExportModal';
import { GenerateBillingModal } from '../components/GenerateBillingModal';
import styles from '../components/billing.module.css';

type ExportTarget = 'statement' | 'invoice' | null;

export default function StatementDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const onError = useApiErrorToast();
  const canView = useCan('billing:view');
  const canCreate = useCan('billing:create');
  const canExport = useCan('billing:export');

  const stmtQ = useStatement(id, canView);
  const statement = stmtQ.data;
  const clientsQ = useClients('all', canView);
  const periodsQ = usePayPeriods(canView);
  const { invoice } = useInvoiceFor(statement?.client_id, statement?.pay_period_id, canView);
  const exportStmt = useExportStatement();
  const exportInv = useExportInvoice();

  const [exportTarget, setExportTarget] = useState<ExportTarget>(null);
  const [regenOpen, setRegenOpen] = useState(false);

  if (!canView || isForbidden(stmtQ.error)) {
    return <AccessDenied message="Viewing billing requires the billing view permission." />;
  }
  if (stmtQ.isLoading) {
    return (
      <div className={styles.page}>
        <PageHeader title="Statement" />
        <TableSkeleton rows={5} columns={3} />
      </div>
    );
  }
  if (stmtQ.isError || !statement) {
    return (
      <div className={styles.page}>
        <PageHeader title="Statement" />
        <TableError message="Couldn't load this statement." onRetry={() => stmtQ.refetch()} />
      </div>
    );
  }

  const client = (clientsQ.data ?? []).find((c) => c.id === statement.client_id);
  const period = (periodsQ.data ?? []).find((p) => p.id === statement.pay_period_id);
  const clientName = client ? `${client.name} (${client.client_code})` : '—';
  const lines = statement.lines ?? [];

  const onExportStatement = (format: 'pdf' | 'excel') =>
    exportStmt.mutate(
      { id: statement.id, body: { format } },
      { onSuccess: (res) => { toast({ title: 'Statement export generated', description: res.file_url, tone: 'success' }); setExportTarget(null); }, onError },
    );
  const onExportInvoice = (format: 'pdf' | 'excel') => {
    if (!invoice) return;
    exportInv.mutate(
      { id: invoice.id, body: { format } },
      { onSuccess: (res) => { toast({ title: 'Invoice export generated', description: res.file_url, tone: 'success' }); setExportTarget(null); }, onError },
    );
  };

  return (
    <div className={styles.page}>
      <PageHeader
        title={<span className={styles.detailHead}>Statement · {clientName}</span>}
        subtitle={period ? `#${period.period_number} · ${displayDate(period.start_date)}–${displayDate(period.end_date)} · generated ${displayDate(statement.generated_at)}` : `generated ${displayDate(statement.generated_at)}`}
        actions={
          <>
            <Button variant="tertiary" leftIcon={<ArrowLeft size={16} />} onClick={() => navigate('/billing')}>
              Billing
            </Button>
            {canCreate && (
              <Button variant="secondary" leftIcon={<RefreshCw size={16} />} onClick={() => setRegenOpen(true)}>
                Regenerate
              </Button>
            )}
            {canExport && (
              <Button variant="primary" leftIcon={<FileDown size={16} />} onClick={() => setExportTarget('statement')}>
                Export
              </Button>
            )}
          </>
        }
      />

      <div className={styles.summary}>
        <StatCard label="Total billed" value={money(statement.total_amount)} />
        <StatCard label="Customers" value={String(lines.length)} />
      </div>

      <Card title="Statement — one line per customer">
        {lines.length === 0 ? (
          <p className="mono">This statement has no billable customers for the period.</p>
        ) : (
          <StatementLinesTable lines={lines} />
        )}
        <p className={styles.note}>No GST — tax is handled in QuickBooks. Every amount is priced by the server from client billing rates.</p>
      </Card>

      <InvoiceCard
        invoice={invoice}
        canExport={canExport}
        onExport={() => setExportTarget('invoice')}
        onGenerate={() => setRegenOpen(true)}
        canGenerate={canCreate}
      />

      <BillingExportModal open={exportTarget === 'statement'} onClose={() => setExportTarget(null)} title="Export statement" onExport={onExportStatement} isPending={exportStmt.isPending} />
      <BillingExportModal open={exportTarget === 'invoice'} onClose={() => setExportTarget(null)} title="Export invoice" onExport={onExportInvoice} isPending={exportInv.isPending} />
      <GenerateBillingModal
        open={regenOpen}
        onClose={() => setRegenOpen(false)}
        clients={clientsQ.data ?? []}
        periods={periodsQ.data ?? []}
        presetClientId={statement.client_id}
        presetPeriodId={statement.pay_period_id}
      />
    </div>
  );
}
