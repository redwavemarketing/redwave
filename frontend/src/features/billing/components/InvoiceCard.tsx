/**
 * InvoiceCard — the one-line commission invoice for a client+period. `total_commission` is the BILLING-STREAM
 * statement total (server-computed; #3) — NOT the rep payout. If no invoice exists yet, offer to generate it
 * (the generate flow normally creates it alongside the statement). Export is billing:export-gated. Tokens only.
 */
import { FileDown, Receipt } from 'lucide-react';
import { Button, Card } from '../../../components/ui';
import { money } from '../../../lib/format/money';
import styles from './billing.module.css';
import type { ClientInvoice } from '../billing.types';

interface Props {
  invoice: ClientInvoice | null;
  canExport: boolean;
  onExport: () => void;
  onGenerate?: () => void;
  canGenerate?: boolean;
}

export function InvoiceCard({ invoice, canExport, onExport, onGenerate, canGenerate }: Props) {
  return (
    <Card
      title="Commission invoice"
      actions={
        invoice && canExport ? (
          <Button variant="secondary" size="sm" leftIcon={<FileDown size={15} />} onClick={onExport}>
            Export
          </Button>
        ) : undefined
      }
    >
      {invoice ? (
        <div className={styles.invoiceTotal}>
          <span className={styles.invoiceAmount}>{money(invoice.total_commission)}</span>
          <span className={styles.note}>One-line total — the billing-stream statement total (not the rep payout).</span>
        </div>
      ) : (
        <div className={styles.invoiceTotal}>
          <span className={styles.note}>No invoice has been generated for this period yet.</span>
          {canGenerate && onGenerate && (
            <Button variant="secondary" size="sm" leftIcon={<Receipt size={15} />} onClick={onGenerate}>
              Generate
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
