/**
 * PeriodStatusBadge — maps a pay-period status to a semantic Badge. open = available to run, closed = no
 * longer accepting new sales, paid = a run was finalized for it. Tokens only (via Badge).
 */
import { Badge, type BadgeTone } from '../../../components/ui';
import type { PayPeriodStatus } from '../payrun.types';

const MAP: Record<PayPeriodStatus, { tone: BadgeTone; label: string }> = {
  open: { tone: 'neutral', label: 'Open' },
  closed: { tone: 'info', label: 'Closed' },
  paid: { tone: 'success', label: 'Paid' },
};

export function PeriodStatusBadge({ status }: { status: PayPeriodStatus }) {
  const { tone, label } = MAP[status];
  return <Badge tone={tone}>{label}</Badge>;
}
