/**
 * StatementDetailPage — /billing/statements/:id. Renders the immutable, gapless-numbered statement (ONE LINE
 * PER CUSTOMER, the server total, NO GST, CAD) + the paired one-line commission invoice. The UI prices
 * nothing and shows NO commission data (#3). Download re-renders the file from the frozen record; QuickBooks
 * export records an artifact. "Issue new version" creates a NEW numbered statement (the current one is kept,
 * superseded). `billing:view`; create/export gate the actions.
 */
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileDown, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { Badge, Button, Card, PageHeader, StatCard, TableError, TableSkeleton, useToast } from '../../../components/ui';
import { useCan } from '../../../auth/useCan';
import { isForbidden, useApiErrorToast } from '../../../lib/api/apiError';
import { money } from '../../../lib/format/money';
import { displayDate } from '../../../lib/format/date';
import { AccessDenied } from '../../dashboards/components/AccessDenied';
import { useClients } from '../../clients/api/useClients';
import { usePayPeriods } from '../../payrun/api/usePayRun';
import { useInvoiceFor, useStatement } from '../api/useBilling';
import { downloadInvoicePdf, downloadStatementExcel, exportStatementQuickbooks } from '../billing.download';
import { statementNo } from '../billing.logic';
import { StatementLinesTable } from '../components/StatementLinesTable';
import { InvoiceCard } from '../components/InvoiceCard';
import { GenerateBillingModal } from '../components/GenerateBillingModal';
import styles from '../components/billing.module.css';

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
  const [regenOpen, setRegenOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

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

  const run = (fn: () => Promise<void>, okTitle: string) => {
    setDownloading(true);
    fn()
      .then(() => toast({ title: okTitle, tone: 'success' }))
      .catch(onError)
      .finally(() => setDownloading(false));
  };

  return (
    <div className={styles.page}>
      <PageHeader
        title={
          <span className={styles.detailHead}>
            <span className="mono">{statementNo(statement.statement_number)}</span> · {clientName}{' '}
            <Badge tone={statement.status === 'issued' ? 'success' : 'neutral'}>{statement.status}</Badge>
          </span>
        }
        subtitle={period ? `#${period.period_number} · ${displayDate(period.start_date)}–${displayDate(period.end_date)} · generated ${displayDate(statement.generated_at)} · CAD` : `generated ${displayDate(statement.generated_at)}`}
        actions={
          <>
            <Button variant="tertiary" leftIcon={<ArrowLeft size={16} />} onClick={() => navigate('/billing')}>
              Billing
            </Button>
            {canCreate && (
              <Button variant="secondary" leftIcon={<RefreshCw size={16} />} onClick={() => setRegenOpen(true)}>
                Issue new version
              </Button>
            )}
            <Button variant="primary" leftIcon={<FileSpreadsheet size={16} />} loading={downloading} onClick={() => run(() => downloadStatementExcel(statement.id), 'Statement downloaded')}>
              Download Excel
            </Button>
            {canExport && (
              <Button variant="secondary" leftIcon={<FileDown size={16} />} loading={downloading} onClick={() => run(() => exportStatementQuickbooks(statement.id), 'QuickBooks CSV exported')}>
                QuickBooks CSV
              </Button>
            )}
          </>
        }
      />

      {statement.status === 'superseded' && (
        <Card>
          <p className="mono" style={{ color: 'var(--text-secondary)' }}>
            This is a superseded version, kept for the audit trail. A newer statement has replaced it as the current one.
          </p>
        </Card>
      )}

      <div className={styles.summary}>
        <StatCard label="Total billed (CAD)" value={money(statement.total_amount)} />
        <StatCard label="Customers" value={String(lines.length)} />
      </div>

      <Card title="Statement — one line per customer">
        {lines.length === 0 ? (
          <p className="mono">This statement has no billable customers for the period.</p>
        ) : (
          <StatementLinesTable lines={lines} />
        )}
        <p className={styles.note}>No GST — tax is handled in QuickBooks. Every amount is priced by the server from client billing rates (CAD).</p>
      </Card>

      <InvoiceCard
        invoice={invoice}
        canView={canView}
        onDownload={() => invoice && run(() => downloadInvoicePdf(invoice.id), 'Invoice downloaded')}
        downloading={downloading}
        onGenerate={() => setRegenOpen(true)}
        canGenerate={canCreate}
      />

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
