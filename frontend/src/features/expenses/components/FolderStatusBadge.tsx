/**
 * FolderStatusBadge — the DERIVED folder (report) status → a semantic Badge (EXP-001a). The status is the
 * server-computed aggregate of the folder's items; the UI only displays it. Tokens only (via Badge).
 */
import { Badge, type BadgeTone } from '../../../components/ui';
import type { FolderStatus } from '../expenses.types';

const MAP: Record<FolderStatus, { tone: BadgeTone; label: string }> = {
  empty: { tone: 'muted', label: 'Empty' },
  draft: { tone: 'neutral', label: 'Draft' },
  pending: { tone: 'info', label: 'Pending' },
  needs_attention: { tone: 'warning', label: 'Needs attention' },
  approved: { tone: 'success', label: 'Approved' },
  rejected: { tone: 'danger', label: 'Rejected' },
};

export function FolderStatusBadge({ status }: { status: FolderStatus }) {
  const { tone, label } = MAP[status];
  return <Badge tone={tone}>{label}</Badge>;
}
