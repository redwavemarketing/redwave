/**
 * NewImportPage — /import/new. The STAGE step: pick one of the 3 supported kinds, supply its rows (JSON
 * editor + template; real parse stubbed), and stage. The backend classifies the rows (matched/unmatched/
 * error) — the UI does NO matching. On success → the batch detail (review + reconcile + commit).
 * `import:create`; 403 → AccessDenied; the server is the real gate (§5).
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Banner, Button, Card, FormField, MoneyInput, PageHeader, Select } from '../../../components/ui';
import { useCan } from '../../../auth/useCan';
import { useApiErrorToast } from '../../../lib/api/apiError';
import { AccessDenied } from '../../dashboards/components/AccessDenied';
import { useClients } from '../../clients/api/useClients';
import { useStageImport } from '../api/useImportMutations';
import { RowsEditor } from '../components/RowsEditor';
import { StepIndicator } from '../components/StepIndicator';
import { parseRows } from '../import.logic';
import { KINDS } from '../import.types';
import styles from '../components/import.module.css';
import type { CreateImportBody, ImportKind } from '../import.types';

export default function NewImportPage() {
  const canCreate = useCan('import:create');
  const canViewClients = useCan('clients:view');
  const navigate = useNavigate();
  const onError = useApiErrorToast();
  const stage = useStageImport();

  const [kind, setKind] = useState<ImportKind>('bulk_validation');
  const [clientId, setClientId] = useState<string | undefined>();
  const [reconcileTotal, setReconcileTotal] = useState('');
  const [rowsText, setRowsText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const kindDef = useMemo(() => KINDS.find((k) => k.kind === kind)!, [kind]);
  const clientsQ = useClients('active', canCreate && canViewClients && kindDef.needsClient);

  if (!canCreate) {
    return <AccessDenied message="Starting an import requires the import create permission." />;
  }

  const onStage = () => {
    const parsed = parseRows(rowsText);
    if ('error' in parsed) { setError(parsed.error); return; }
    if (kindDef.needsClient && !clientId) { setError('Select a client for this import.'); return; }
    if (kindDef.needsReconcileTotal && !reconcileTotal.trim()) { setError('A reconcile total is required for a balance migration.'); return; }
    setError(null);
    const body: CreateImportBody = {
      source_type: kindDef.source_type,
      import_type: kindDef.import_type,
      ...(kindDef.needsClient ? { client_id: clientId } : {}),
      ...(kindDef.needsReconcileTotal ? { reconcile_total: reconcileTotal.trim() } : {}),
      rows: parsed.rows,
    };
    stage.mutate(body, { onSuccess: (batch) => navigate(`/import/${batch.id}`), onError });
  };

  return (
    <div className={styles.page}>
      <PageHeader
        title="New import"
        subtitle="Stage rows, then review → reconcile → commit. The server classifies and applies; this screen never matches or commits rows itself."
        actions={<Button variant="tertiary" onClick={() => navigate('/import')}>Cancel</Button>}
      />
      <StepIndicator steps={[{ label: 'Stage', state: 'current' }, { label: 'Reconcile', state: 'upcoming' }, { label: 'Commit', state: 'upcoming' }]} />

      <Card title="What to import">
        <div className={styles.form}>
          <FormField label="Import type" help={kindDef.description}>
            <Select options={KINDS.map((k) => ({ value: k.kind, label: k.label }))} value={kind} onValueChange={(v) => { setKind(v as ImportKind); setError(null); }} />
          </FormField>
          {kindDef.needsClient && (
            <FormField label="Client" required help="The client whose report you're importing — its entered sales are matched by MPU ID.">
              {canViewClients ? (
                <Select placeholder="Select a client" options={(clientsQ.data ?? []).map((c) => ({ value: c.id, label: `${c.name} (${c.client_code})` }))} value={clientId} onValueChange={setClientId} />
              ) : (
                <Banner tone="warning" title="Clients view required">Picking a client needs the clients view permission.</Banner>
              )}
            </FormField>
          )}
          {kindDef.needsReconcileTotal && (
            <FormField label="Reconcile total" required help="The source's total — the server verifies it matches the staged sum at commit (IMP-007).">
              <MoneyInput value={reconcileTotal} onChange={(e) => setReconcileTotal(e.target.value)} placeholder="0.00" />
            </FormField>
          )}
        </div>
      </Card>

      <Card title="Rows">
        <RowsEditor value={rowsText} onChange={(v) => { setRowsText(v); setError(null); }} template={kindDef.template} error={error} />
      </Card>

      <div className={styles.footer}>
        <Button variant="primary" loading={stage.isPending} disabled={stage.isPending} onClick={onStage}>
          Stage import
        </Button>
      </div>
    </div>
  );
}
