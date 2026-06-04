/**
 * RowStatusBadge — maps a staged row's match status to a semantic Badge. unmatched/duplicate/error are the
 * "outstanding" set that blocks commit; ignored rows are skipped at commit. Tokens only.
 */
import { Badge, type BadgeTone } from '../../../components/ui';
import type { MatchStatus } from '../import.types';

const MAP: Record<MatchStatus, { tone: BadgeTone; label: string }> = {
  matched: { tone: 'success', label: 'Matched' },
  unmatched: { tone: 'warning', label: 'Unmatched' },
  duplicate: { tone: 'warning', label: 'Duplicate' },
  error: { tone: 'danger', label: 'Error' },
  ignored: { tone: 'muted', label: 'Ignored' },
};

export function RowStatusBadge({ status }: { status: MatchStatus }) {
  const { tone, label } = MAP[status];
  return <Badge tone={tone}>{label}</Badge>;
}
