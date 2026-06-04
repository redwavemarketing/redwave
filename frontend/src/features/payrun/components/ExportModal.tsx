/**
 * ExportModal — generate the ADP export for a FINALIZED run (payrun:export). Pick a format; the server
 * produces the artifact and records it (the audit row is the stored record — no dedicated export table).
 * Re-export is allowed server-side. The button is disabled while in flight. payrun:export-gated in the UI;
 * the server is the real gate (§5).
 */
import { useState } from 'react';
import { Button, Modal, Select, useToast } from '../../../components/ui';
import { useApiErrorToast } from '../../../lib/api/apiError';
import { useExportRun } from '../api/usePayRunMutations';
import styles from './payrun.module.css';
import type { ExportFormat } from '../payrun.types';

export function ExportModal({ runId, open, onClose }: { runId: string; open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const onError = useApiErrorToast();
  const exportRun = useExportRun();
  const [format, setFormat] = useState<ExportFormat>('csv');

  const onExport = () => {
    exportRun.mutate(
      { runId, body: { format } },
      {
        onSuccess: (res) => { toast({ title: 'Export generated', description: `${res.line_count} lines (${res.format.toUpperCase()})`, tone: 'success' }); onClose(); },
        onError,
      },
    );
  };

  return (
    <Modal
      open={open}
      onOpenChange={(o) => !o && !exportRun.isPending && onClose()}
      title="Export pay run (ADP)"
      footer={
        <div className={styles.footer}>
          <Button variant="secondary" type="button" onClick={onClose} disabled={exportRun.isPending}>
            Cancel
          </Button>
          <Button variant="primary" type="button" onClick={onExport} loading={exportRun.isPending} disabled={exportRun.isPending}>
            Generate export
          </Button>
        </div>
      }
    >
      <div className={styles.form}>
        <Select
          options={[
            { value: 'csv', label: 'CSV (ADP)' },
            { value: 'json', label: 'JSON' },
          ]}
          value={format}
          onValueChange={(v) => setFormat(v as ExportFormat)}
          aria-label="Export format"
        />
        <p className={styles.note}>The export is recorded server-side (audit trail). Re-exporting is allowed.</p>
      </div>
    </Modal>
  );
}
