/**
 * ClawbackStatusBadge — maps a clawback status to a semantic Badge (StatusPill is sale-only). pending = a
 * deduction waiting for the next pay run; applied = deducted in a finalized run. Tokens only (via Badge).
 */
import { Badge, type BadgeTone } from '../../../components/ui';
import type { ClawbackStatus } from '../clawback.types';

const MAP: Record<ClawbackStatus, { tone: BadgeTone; label: string }> = {
  pending: { tone: 'warning', label: 'Pending' },
  applied: { tone: 'success', label: 'Applied' },
};

export function ClawbackStatusBadge({ status }: { status: ClawbackStatus }) {
  const { tone, label } = MAP[status];
  return <Badge tone={tone}>{label}</Badge>;
}
