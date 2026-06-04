/**
 * GenerateBillingModal — select a client + period and generate the statement AND the paired commission
 * invoice (billing stream). The UI PRICES NOTHING (#1/#3) — both are backend calls. Generation PERSISTS and
 * REPLACES any prior statement/invoice for the client+period (there is no preview), so when one already
 * exists we show an explicit regenerate-confirm. An unpriced product → 422 → a helpful UnpricedBanner (the
 * detail comes from ApiError.details). On success → the statement detail page. billing:create-gated; the
 * server is the real gate (§5).
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Banner, Button, Modal, useToast } from '../../../components/ui';
import { useApiErrorToast } from '../../../lib/api/apiError';
import { useStatements } from '../api/useBilling';
import { useGenerateInvoice, useGenerateStatement } from '../api/useBillingMutations';
import { extractUnpriced } from '../billing.logic';
import { ClientPeriodPicker } from './ClientPeriodPicker';
import { UnpricedBanner } from './UnpricedBanner';
import styles from './billing.module.css';
import type { Client } from '../../clients/clients.types';
import type { PayPeriod } from '../../payrun/payrun.types';
import type { UnpricedDetail } from '../billing.types';

interface Props {
  open: boolean;
  onClose: () => void;
  clients: Client[];
  periods: PayPeriod[];
  presetClientId?: string;
  presetPeriodId?: string;
}

export function GenerateBillingModal({ open, onClose, clients, periods, presetClientId, presetPeriodId }: Props) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const onError = useApiErrorToast();
  const [clientId, setClientId] = useState<string | undefined>(presetClientId);
  const [periodId, setPeriodId] = useState<string | undefined>(presetPeriodId);
  const [unpriced, setUnpriced] = useState<UnpricedDetail[] | null>(null);
  const genStmt = useGenerateStatement();
  const genInv = useGenerateInvoice();

  useEffect(() => {
    if (open) {
      setClientId(presetClientId);
      setPeriodId(presetPeriodId);
      setUnpriced(null);
    }
  }, [open, presetClientId, presetPeriodId]);

  const existing = useStatements({ client_id: clientId, pay_period_id: periodId }, open && !!clientId && !!periodId);
  const alreadyExists = (existing.data ?? []).length > 0;
  const busy = genStmt.isPending || genInv.isPending;

  const onGenerate = () => {
    if (!clientId || !periodId) return;
    setUnpriced(null);
    genStmt.mutate(
      { clientId, body: { pay_period_id: periodId } },
      {
        onSuccess: (statement) => {
          // Pair the invoice (= the billing-stream statement total). Non-fatal if it lags.
          genInv.mutate(
            { clientId, body: { pay_period_id: periodId } },
            {
              onSuccess: () => {
                toast({ title: 'Statement & invoice generated', tone: 'success' });
                onClose();
                navigate(`/billing/statements/${statement.id}`);
              },
              onError: () => {
                toast({ title: 'Statement generated — regenerate to refresh the invoice', tone: 'warning' });
                onClose();
                navigate(`/billing/statements/${statement.id}`);
              },
            },
          );
        },
        onError: (err) => {
          const u = extractUnpriced(err);
          if (u) setUnpriced(u);
          else onError(err);
        },
      },
    );
  };

  return (
    <Modal
      open={open}
      onOpenChange={(o) => !o && !busy && onClose()}
      title="Generate statement & invoice"
      footer={
        <div className={styles.footer}>
          <Button variant="secondary" type="button" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" type="button" onClick={onGenerate} loading={busy} disabled={busy || !clientId || !periodId}>
            {alreadyExists ? 'Regenerate' : 'Generate'}
          </Button>
        </div>
      }
    >
      <div className={styles.form}>
        <ClientPeriodPicker
          clients={clients}
          periods={periods}
          clientId={clientId}
          periodId={periodId}
          onClient={(v) => { setClientId(v); setUnpriced(null); }}
          onPeriod={(v) => { setPeriodId(v); setUnpriced(null); }}
          disabled={busy}
        />
        {alreadyExists && (
          <Banner tone="warning" title="This replaces the existing statement">
            A statement for this client and period already exists. Regenerating <strong>replaces</strong> it and the invoice (there is no preview).
          </Banner>
        )}
        {unpriced && <UnpricedBanner unpriced={unpriced} clientId={clientId} />}
        <p className={styles.note}>The server prices the statement from client billing rates (effective by each sale’s date). This screen computes nothing.</p>
      </div>
    </Modal>
  );
}
