/**
 * ReceiptField — the receipt control for a non-km item. FileUpload is selection-only, so selecting a file
 * sets `receipt_url` to a STUB object-storage ref (real upload is deferred, like avatar/import). Shows the
 * current ref with a Remove. The "required" marker lives on the parent FormField (config-driven). Tokens only.
 */
import { Button, FileUpload } from '../../../components/ui';
import styles from './expenses.module.css';

export function ReceiptField({ value, onChange }: { value?: string; onChange: (v: string | undefined) => void }) {
  if (value) {
    return (
      <div className={styles.receiptRow}>
        <span className={styles.receiptRef}>{value}</span>
        <Button variant="tertiary" size="sm" type="button" onClick={() => onChange(undefined)}>
          Remove
        </Button>
      </div>
    );
  }
  return (
    <FileUpload
      accept=".pdf,.jpg,.jpeg,.png"
      multiple={false}
      hint="PDF/JPG/PNG — stored as a reference (upload wiring is deferred)"
      onFiles={(files) => {
        const f = files[0];
        if (f) onChange(`s3://redwave-receipts/${f.name}`);
      }}
    />
  );
}
