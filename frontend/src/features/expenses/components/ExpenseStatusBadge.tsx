/**
 * ExpenseStatusBadge — maps an expense report status to a semantic Badge (StatusPill covers sale statuses,
 * not these). Colour always pairs with text. Tokens only (via Badge).
 */
import { Badge, type BadgeTone } from '../../../components/ui';
import type { ExpenseStatus } from '../expenses.types';

const MAP: Record<ExpenseStatus, { tone: BadgeTone; label: string }> = {
  draft: { tone: 'neutral', label: 'Draft' },
  submitted: { tone: 'info', label: 'Submitted' },
  approved: { tone: 'success', label: 'Approved' },
  rejected: { tone: 'danger', label: 'Rejected' },
  sent_back: { tone: 'warning', label: 'Sent back' },
};

export function ExpenseStatusBadge({ status }: { status: ExpenseStatus }) {
  const { tone, label } = MAP[status];
  return <Badge tone={tone}>{label}</Badge>;
}
