/**
 * SignerStatusBadge — a per-signer status (pending/signed/declined) and, via RequestStatusBadge, a request
 * status (adds completed/cancelled). All SERVER-derived; display only. Tokens only.
 */
import { Badge, type BadgeTone } from '../../../components/ui';
import type { SignatureRequestStatus, SignatureStatus } from '../documents.types';

const SIGNER: Record<SignatureStatus, { tone: BadgeTone; label: string }> = {
  pending: { tone: 'warning', label: 'Pending' },
  signed: { tone: 'success', label: 'Signed' },
  declined: { tone: 'danger', label: 'Declined' },
};

const REQUEST: Record<SignatureRequestStatus, { tone: BadgeTone; label: string }> = {
  pending: { tone: 'warning', label: 'Pending' },
  completed: { tone: 'success', label: 'Completed' },
  declined: { tone: 'danger', label: 'Declined' },
  cancelled: { tone: 'muted', label: 'Cancelled' },
};

export function SignerStatusBadge({ status }: { status: SignatureStatus }) {
  const { tone, label } = SIGNER[status];
  return <Badge tone={tone}>{label}</Badge>;
}

export function RequestStatusBadge({ status }: { status: SignatureRequestStatus }) {
  const { tone, label } = REQUEST[status];
  return <Badge tone={tone}>{label}</Badge>;
}
