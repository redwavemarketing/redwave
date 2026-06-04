/**
 * BillingExportModal — a thin format picker (pdf/excel) for exporting a statement or an invoice. The caller
 * wires the actual export mutation via onExport(format); the artifact is recorded server-side (stub file_url —
 * the real render is deferred). Tokens only.
 */
import { useState } from 'react';
import { Button, Modal, Select } from '../../../components/ui';
import styles from './billing.module.css';

type Format = 'pdf' | 'excel';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  onExport: (format: Format) => void;
  isPending: boolean;
}

export function BillingExportModal({ open, onClose, title, onExport, isPending }: Props) {
  const [format, setFormat] = useState<Format>('excel');
  return (
    <Modal
      open={open}
      onOpenChange={(o) => !o && !isPending && onClose()}
      title={title}
      footer={
        <div className={styles.footer}>
          <Button variant="secondary" type="button" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="primary" type="button" onClick={() => onExport(format)} loading={isPending} disabled={isPending}>
            Generate export
          </Button>
        </div>
      }
    >
      <div className={styles.form}>
        <Select
          options={[
            { value: 'excel', label: 'Excel (.xlsx)' },
            { value: 'pdf', label: 'PDF' },
          ]}
          value={format}
          onValueChange={(v) => setFormat(v as Format)}
          aria-label="Export format"
        />
        <p className={styles.note}>The export is recorded server-side (audit trail). The file render is a stub for now.</p>
      </div>
    </Modal>
  );
}
