/**
 * ClientsPage — the clients list (SRS §6, CLNT-001/006). Status filter (active/inactive/all), create, and
 * row edit/soft-deactivate. `clients:view` to see; create gated by useCan (server enforces). 403 →
 * AccessDenied. Reuses the playbook. This feature touches ONLY /v1/clients* (#3).
 */
import { useState } from 'react';
import { Button, PageHeader, Select } from '../../../components/ui';
import { DataState } from '../../../components/data/DataState';
import { useCan } from '../../../auth/useCan';
import { isForbidden } from '../../../lib/api/apiError';
import { AccessDenied } from '../../dashboards/components/AccessDenied';
import { useClients } from '../api/useClients';
import { ClientsTable } from '../components/ClientsTable';
import { ClientFormModal, type ClientFormState } from '../components/ClientFormModal';
import type { Client, StatusFilter } from '../clients.types';
import styles from '../components/clients.module.css';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'all', label: 'All' },
];

export default function ClientsPage() {
  const canView = useCan('clients:view');
  const canCreate = useCan('clients:create');
  const [status, setStatus] = useState<StatusFilter>('active');
  const [modal, setModal] = useState<ClientFormState>(null);
  const q = useClients(status, canView);

  if (!canView || isForbidden(q.error)) {
    return <AccessDenied message="Viewing clients requires the clients view permission." />;
  }

  const clients = q.data ?? [];
  return (
    <div className={styles.page}>
      <PageHeader
        title="Clients & Products"
        subtitle="Partner programs, their products, and billing rates."
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
            <Select options={STATUS_OPTIONS} value={status} onValueChange={(v) => setStatus(v as StatusFilter)} aria-label="Status filter" />
            {canCreate && (
              <Button variant="primary" onClick={() => setModal({ mode: 'create' })}>
                Create client
              </Button>
            )}
          </div>
        }
      />
      <DataState
        isLoading={q.isLoading}
        isError={q.isError}
        isEmpty={clients.length === 0}
        onRetry={() => q.refetch()}
        emptyNode={<p className="mono">No clients match this filter.</p>}
      >
        <ClientsTable clients={clients} onEdit={(c: Client) => setModal({ mode: 'edit', client: c })} />
      </DataState>
      <ClientFormModal state={modal} onClose={() => setModal(null)} />
    </div>
  );
}
