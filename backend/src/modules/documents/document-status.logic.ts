/**
 * Document / signature-request status derivation — PURE & deterministic (no I/O, no Prisma).
 *
 * A document's overall status is a function of its signers' states across its NON-cancelled
 * signature requests. A request's status is a function of its own signers' states. Both are
 * recomputed from the live signature rows after every sign/decline/cancel — never hand-set
 * (except `cancelled`, which is an explicit action, not a derived value). — SRS DOC-005
 *
 * Business rules (confirmed): a single decline is TERMINAL — it makes the request `declined` and
 * the document `declined` (remaining signers can no longer complete it). All requests cancelled →
 * the document falls back to `draft`. — DOC-002/005
 */
import { DocumentStatus, SignatureRequestStatus, SignatureStatus } from '@prisma/client';

/**
 * Overall status of one signature request from its signers' states. Returns only
 * pending / completed / declined — `cancelled` is set solely by the cancel action, never derived.
 */
export function deriveRequestStatus(
  signers: SignatureStatus[],
): Exclude<SignatureRequestStatus, 'cancelled'> {
  if (signers.some((s) => s === 'declined')) {
    return 'declined'; // one decline is terminal — DOC-005
  }
  if (signers.length > 0 && signers.every((s) => s === 'signed')) {
    return 'completed';
  }
  return 'pending';
}

export interface RequestForDerivation {
  status: SignatureRequestStatus;
  signers: SignatureStatus[];
}

/**
 * Overall document status from the union of signers across its non-cancelled requests.
 *   no active requests → draft ;  any declined → declined ;  all signed (≥1) → completed ;
 *   some signed (not all) → partially_signed ;  else (shared, none acted) → shared. — DOC-005
 */
export function deriveDocumentStatus(requests: RequestForDerivation[]): DocumentStatus {
  const active = requests.filter((r) => r.status !== 'cancelled');
  const signers = active.flatMap((r) => r.signers);

  if (active.length === 0) {
    return 'draft'; // never shared, or every share was cancelled — back to draft
  }
  if (signers.some((s) => s === 'declined')) {
    return 'declined'; // a decline anywhere is terminal for the document
  }
  if (signers.length > 0 && signers.every((s) => s === 'signed')) {
    return 'completed';
  }
  if (signers.some((s) => s === 'signed')) {
    return 'partially_signed';
  }
  return 'shared';
}
