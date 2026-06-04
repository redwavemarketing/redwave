/**
 * Pure documents helpers (no I/O). Drive ROW-LEVEL showability + a COMPOSED activity timeline from the
 * detail's nested data. None of this re-derives the overall status (that is the server's) — it only decides
 * which actions to OFFER (the server is the real gate) and presents events. #5/§13.
 */
import { ApiError } from '../../lib/api/apiError';
import type { Document, SignatureRequest } from './documents.types';

/**
 * The current user's row-level signability: find a PENDING signature for this user inside a PENDING request.
 * If present, the user is the asked signer and may Sign/Decline THAT request. Being the signer — not a
 * permission — is what authorizes signing (the server enforces).
 */
export function findMyPendingSignature(doc: Document, userId: string | undefined): { requestId: string; signatureId: string } | null {
  if (!userId) return null;
  for (const request of doc.signature_requests ?? []) {
    if (request.status !== 'pending') continue;
    const sig = request.document_signatures.find((s) => s.recipient_user_id === userId && s.status === 'pending');
    if (sig) return { requestId: request.id, signatureId: sig.id };
  }
  return null;
}

/** Cancel is requester / document-owner / admin, and only on a pending request (server-enforced). */
export function canCancel(request: SignatureRequest, doc: Document, userId: string | undefined, isAdmin: boolean): boolean {
  if (request.status !== 'pending') return false;
  return isAdmin || request.requested_by === userId || doc.owner_user_id === userId;
}

export type TimelineEvent = {
  key: string;
  at: string | null;
  actorId: string;
  kind: 'requested' | 'signed' | 'declined';
};

/**
 * Compose an activity timeline from the detail's requests + signatures (request created, each sign with its
 * `signed_at`, each decline). There is no audit-log endpoint and declines carry no timestamp in the response,
 * so a decline is listed without a time. DISPLAY only — not status derivation.
 */
export function buildTimeline(doc: Document): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  for (const request of doc.signature_requests ?? []) {
    events.push({ key: `req-${request.id}`, at: request.created_at, actorId: request.requested_by, kind: 'requested' });
    for (const sig of request.document_signatures) {
      if (sig.status === 'signed') events.push({ key: `sig-${sig.id}`, at: sig.signed_at, actorId: sig.recipient_user_id, kind: 'signed' });
      else if (sig.status === 'declined') events.push({ key: `sig-${sig.id}`, at: null, actorId: sig.recipient_user_id, kind: 'declined' });
    }
  }
  // Newest first; events without a timestamp (declines / unstamped) sort last within their group.
  return events.sort((a, b) => (b.at ?? '').localeCompare(a.at ?? ''));
}

/** True when a thrown query/mutation error is a server 404 (a non-visible doc → graceful not-found). */
export function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}
