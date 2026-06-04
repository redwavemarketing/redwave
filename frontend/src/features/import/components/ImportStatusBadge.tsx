/**
 * ImportStatusBadge — maps a batch status to a semantic Badge (StatusPill is sale-only). Tokens only.
 */
import { Badge, type BadgeTone } from '../../../components/ui';
import type { ImportBatchStatus } from '../import.types';

const MAP: Record<ImportBatchStatus, { tone: BadgeTone; label: string }> = {
  staged: { tone: 'info', label: 'Staged' },
  committed: { tone: 'success', label: 'Committed' },
  failed: { tone: 'danger', label: 'Failed' },
  cancelled: { tone: 'muted', label: 'Cancelled' },
};

export function ImportStatusBadge({ status }: { status: ImportBatchStatus }) {
  const { tone, label } = MAP[status];
  return <Badge tone={tone}>{label}</Badge>;
}
