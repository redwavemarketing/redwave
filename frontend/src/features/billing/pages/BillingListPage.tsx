/**
 * BillingListPage — /billing. The BILLING-stream surface: list generated client statements (filter by client
 * + period) and trigger generation. The UI prices nothing and shows NO commission data (#3); every amount is
 * the server's `total_amount` via money(). `billing:view` to see; `billing:create` to generate. 403 →
 * AccessDenied; the server is the real gate (§5).
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { Button, PageHeader, Table, TBody, TD, TH, THead, TR } from '../../../components/ui';
import { useCan } from '../../../auth/useCan';
import { DataState } from '../../../components/data/DataState';
import { isForbidden } from '../../../lib/api/apiError';
import { money } from '../../../lib/format/money';
import { displayDate } from '../../../lib/format/date';
import { AccessDenied } from '../../dashboards/components/AccessDenied';
import { useClients } from '../../clients/api/useClients';
import { usePayPeriods } from '../../payrun/api/usePayRun';
import { useStatements } from '../api/useBilling';
import { ClientPeriodPicker } from '../components/ClientPeriodPicker';
import { GenerateBillingModal } from '../components/GenerateBillingModal';
import styles from '../components/billing.module.css';

export default function BillingListPage() {
  const canView = useCan('billing:view');
  const canCreate = useCan('billing:create');
  const [clientId, setClientId] = useState<string | undefined>();
  const [periodId, setPeriodId] = useState<string | undefined>();
  const [generateOpen, setGenerateOpen] = useState(false);

  const clientsQ = useClients('all', canView);
  const periodsQ = usePayPeriods(canView);
  const q = useStatements({ client_id: clientId, pay_period_id: periodId }, canView);

  const clientName = useMemo(() => {
    const m = new Map((clientsQ.data ?? []).map((c) => [c.id, `${c.name} (${c.client_code})`]));
    return (id: string) => m.get(id) ?? '—';
  }, [clientsQ.data]);
  const periodLabel = useMemo(() => {
    const m = new Map((periodsQ.data ?? []).map((p) => [p.id, `#${p.period_number}`]));
    return (id: string) => m.get(id) ?? '—';
  }, [periodsQ.data]);

  if (!canView || isForbidden(q.error)) {
    return <AccessDenied message="Viewing billing requires the billing view permission." />;
  }

  const rows = q.data ?? [];

  return (
    <div className={styles.page}>
      <PageHeader
        title="Billing & Statements"
        subtitle="Generate and view what Redwave bills each program partner. Priced by the server from client billing rates — this screen computes nothing."
        actions={
          canCreate ? (
            <Button variant="primary" leftIcon={<FileText size={16} />} onClick={() => setGenerateOpen(true)}>
              Generate statement
            </Button>
          ) : undefined
        }
      />

      <ClientPeriodPicker
        clients={clientsQ.data ?? []}
        periods={periodsQ.data ?? []}
        clientId={clientId}
        periodId={periodId}
        onClient={setClientId}
        onPeriod={setPeriodId}
        allowAll
      />

      <DataState
        isLoading={q.isLoading}
        isError={q.isError}
        isEmpty={rows.length === 0}
        onRetry={() => q.refetch()}
        emptyNode={<p className="mono">No statements generated for this filter.</p>}
      >
        <Table>
          <THead>
            <TR>
              <TH>Client</TH>
              <TH>Period</TH>
              <TH align="right">Total</TH>
              <TH>Generated</TH>
              <TH align="right" aria-label="View" />
            </TR>
          </THead>
          <TBody>
            {rows.map((s) => (
              <TR key={s.id}>
                <TD>{clientName(s.client_id)}</TD>
                <TD>
                  <span className="mono">{periodLabel(s.pay_period_id)}</span>
                </TD>
                <TD numeric>{money(s.total_amount)}</TD>
                <TD>
                  <span className="mono">{displayDate(s.generated_at)}</span>
                </TD>
                <TD align="right">
                  <Link to={`/billing/statements/${s.id}`}>View</Link>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </DataState>

      <GenerateBillingModal
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
        clients={clientsQ.data ?? []}
        periods={periodsQ.data ?? []}
        presetClientId={clientId}
        presetPeriodId={periodId}
      />
    </div>
  );
}
