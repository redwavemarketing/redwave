/**
 * ClientsTable — the clients list with row actions (edit, soft-deactivate/reactivate). Deactivation is an
 * is_active PATCH that PRESERVES history (never a delete), behind a confirm. Row → client detail. Tokens only.
 */
import { MoreHorizontal, Pencil, Power, PowerOff } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Badge,
  Button,
  DropdownMenu,
  IconButton,
  Modal,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
  useToast,
  type MenuEntry,
} from '../../../components/ui';
import { useApiErrorToast } from '../../../lib/api/apiError';
import { useUpdateClient } from '../api/useClientMutations';
import { ClientStatusBadge } from './ClientStatusBadge';
import type { Client } from '../clients.types';
import styles from './clients.module.css';

export function ClientsTable({ clients, onEdit }: { clients: Client[]; onEdit: (c: Client) => void }) {
  const { toast } = useToast();
  const onError = useApiErrorToast();
  const update = useUpdateClient();
  const [confirm, setConfirm] = useState<Client | null>(null);

  const setActive = (c: Client, is_active: boolean) =>
    update.mutate(
      { id: c.id, body: { is_active } },
      {
        onSuccess: () => {
          toast({ title: is_active ? 'Client reactivated' : 'Client deactivated', tone: 'success' });
          setConfirm(null);
        },
        onError,
      },
    );

  const rowMenu = (c: Client): MenuEntry[] => [
    { label: 'Edit', icon: <Pencil size={15} />, onSelect: () => onEdit(c) },
    'separator',
    c.is_active
      ? { label: 'Deactivate', icon: <PowerOff size={15} />, danger: true, onSelect: () => setConfirm(c) }
      : { label: 'Reactivate', icon: <Power size={15} />, onSelect: () => setActive(c, true) },
  ];

  return (
    <>
      <Table density="comfortable">
        <THead>
          <TR>
            <TH>Code</TH>
            <TH>Name</TH>
            <TH>Market</TH>
            <TH>MPU IDs</TH>
            <TH>Status</TH>
            <TH align="right">Actions</TH>
          </TR>
        </THead>
        <TBody>
          {clients.map((c) => (
            <TR key={c.id}>
              <TD>
                <span className={styles.codeCell}>{c.client_code}</span>
              </TD>
              <TD>
                <Link to={`/admin/clients/${c.id}`} className={styles.nameLink}>
                  {c.name}
                </Link>
              </TD>
              <TD>
                <Badge tone="neutral">{c.market}</Badge>
              </TD>
              <TD>{c.supplies_mpu_id ? 'Yes' : 'No'}</TD>
              <TD>
                <ClientStatusBadge active={c.is_active} />
              </TD>
              <TD align="right">
                <DropdownMenu
                  trigger={<IconButton label="Client actions" icon={<MoreHorizontal size={16} />} size="sm" />}
                  items={rowMenu(c)}
                />
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>

      <Modal
        open={confirm !== null}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Deactivate this client?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button variant="destructive" loading={update.isPending} onClick={() => confirm && setActive(confirm, false)}>
              Deactivate
            </Button>
          </>
        }
      >
        <strong>{confirm?.name}</strong> will be marked inactive. Its history (products, billing rates, sales)
        is <strong>preserved</strong> — you can reactivate it later.
      </Modal>
    </>
  );
}
