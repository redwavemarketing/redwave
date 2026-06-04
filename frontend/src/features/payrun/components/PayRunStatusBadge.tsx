/**
 * PayRunStatusBadge — maps a pay-run status to a semantic Badge (StatusPill covers SALE statuses, not
 * these). draft = work-in-progress, finalized = committed/locked, exported = artifact generated. Tokens
 * only (via Badge).
 */
import { Badge, type BadgeTone } from '../../../components/ui';
import type { PayRunStatus } from '../payrun.types';

const MAP: Record<PayRunStatus, { tone: BadgeTone; label: string }> = {
  draft: { tone: 'info', label: 'Draft' },
  finalized: { tone: 'success', label: 'Finalized' },
  exported: { tone: 'accent', label: 'Exported' },
};

export function PayRunStatusBadge({ status }: { status: PayRunStatus }) {
  const { tone, label } = MAP[status];
  return <Badge tone={tone}>{label}</Badge>;
}
