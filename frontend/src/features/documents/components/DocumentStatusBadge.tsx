/**
 * DocumentStatusBadge — maps a document's SERVER-DERIVED overall status to a semantic Badge (StatusPill is
 * sale-only). The UI only displays this; it never recomputes the truth table (§13). Tokens only.
 */
import { Badge, type BadgeTone } from '../../../components/ui';
import type { DocumentStatus } from '../documents.types';

const MAP: Record<DocumentStatus, { tone: BadgeTone; label: string }> = {
  draft: { tone: 'neutral', label: 'Draft' },
  shared: { tone: 'info', label: 'Shared' },
  partially_signed: { tone: 'warning', label: 'Partially signed' },
  completed: { tone: 'success', label: 'Completed' },
  declined: { tone: 'danger', label: 'Declined' },
};

export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  const { tone, label } = MAP[status];
  return <Badge tone={tone}>{label}</Badge>;
}
