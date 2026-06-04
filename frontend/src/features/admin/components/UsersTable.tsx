/**
 * UsersTable — the user list with row actions (edit, soft-deactivate/reactivate). Deactivation is a status
 * PATCH (immediate revoke; the record is kept — never a hard delete). Self-guardrail: you can't deactivate
 * your OWN account (the server has no self-protection, so the UI doesn't offer it). Tokens only.
 */
import { MoreHorizontal, Pencil, UserCheck, UserX } from 'lucide-react';
import { useState } from 'react';
import {
  Avatar,
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
import { useAuth } from '../../../auth/useAuth';
import { useApiErrorToast } from '../../../lib/api/apiError';
import { displayDate } from '../../../lib/format/date';
import { useUpdateUser } from '../api/useUsers';
import type { AdminUser } from '../users.types';
import styles from './users.module.css';

export function UsersTable({ users, onEdit }: { users: AdminUser[]; onEdit: (u: AdminUser) => void }) {
  const { user: me } = useAuth();
  const { toast } = useToast();
  const onError = useApiErrorToast();
  const update = useUpdateUser();
  const [confirm, setConfirm] = useState<AdminUser | null>(null);

  const setStatus = (u: AdminUser, status: 'active' | 'inactive') =>
    update.mutate(
      { id: u.id, body: { status } },
      {
        onSuccess: () => {
          toast({ title: status === 'inactive' ? 'User deactivated' : 'User reactivated', tone: 'success' });
          setConfirm(null);
        },
        onError,
      },
    );

  const rowMenu = (u: AdminUser): MenuEntry[] => {
    const isSelf = me?.id === u.id;
    const items: MenuEntry[] = [{ label: 'Edit', icon: <Pencil size={15} />, onSelect: () => onEdit(u) }];
    if (u.status === 'active') {
      items.push('separator', {
        label: 'Deactivate',
        icon: <UserX size={15} />,
        danger: true,
        disabled: isSelf,
        onSelect: () => setConfirm(u),
      });
    } else {
      items.push('separator', {
        label: 'Reactivate',
        icon: <UserCheck size={15} />,
        onSelect: () => setStatus(u, 'active'),
      });
    }
    return items;
  };

  return (
    <>
      <Table density="comfortable">
        <THead>
          <TR>
            <TH>User</TH>
            <TH>Email</TH>
            <TH>Roles</TH>
            <TH>Status</TH>
            <TH>Joined</TH>
            <TH align="right">Actions</TH>
          </TR>
        </THead>
        <TBody>
          {users.map((u) => (
            <TR key={u.id}>
              <TD>
                <span className={styles.userCell}>
                  <Avatar name={u.full_name} src={u.avatar_url} size="sm" />
                  <span className={styles.userName}>
                    {u.full_name}
                    {me?.id === u.id && <span className={styles.youTag}>you</span>}
                  </span>
                </span>
              </TD>
              <TD>{u.email}</TD>
              <TD>
                {u.user_roles.length === 0 ? (
                  '—'
                ) : (
                  <span className={styles.roleBadges}>
                    {u.user_roles.map((r) => (
                      <Badge key={r.role.id} tone="neutral">
                        {r.role.name}
                      </Badge>
                    ))}
                  </span>
                )}
              </TD>
              <TD>
                <Badge tone={u.status === 'active' ? 'success' : 'muted'}>
                  {u.status === 'active' ? 'Active' : 'Inactive'}
                </Badge>
              </TD>
              <TD>{displayDate(u.created_at)}</TD>
              <TD align="right">
                <DropdownMenu
                  trigger={<IconButton label="User actions" icon={<MoreHorizontal size={16} />} size="sm" />}
                  items={rowMenu(u)}
                />
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>

      <Modal
        open={confirm !== null}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Deactivate this user?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button variant="destructive" loading={update.isPending} onClick={() => confirm && setStatus(confirm, 'inactive')}>
              Deactivate
            </Button>
          </>
        }
      >
        <strong>{confirm?.full_name}</strong> will lose access <strong>immediately</strong>. Their record is
        kept (this is a soft deactivation, not a delete) and you can reactivate them later.
      </Modal>
    </>
  );
}
