/**
 * Status recompute helpers — read the live signature rows and re-derive + persist the request and
 * document statuses (via the pure `document-status.logic`). Run INSIDE the caller's transaction so
 * a signer-update + recompute are atomic. Shared by documents.service (share) and signatures.service
 * (sign/decline/cancel). — SRS DOC-005
 */
import { Prisma, SignatureRequestStatus, DocumentStatus } from '@prisma/client';
import { deriveDocumentStatus, deriveRequestStatus } from './document-status.logic';

/** Re-derive + persist a request's status from its signers (a cancelled request is left untouched). */
export async function recomputeRequestStatus(
  tx: Prisma.TransactionClient,
  requestId: string,
): Promise<SignatureRequestStatus> {
  const request = await tx.signatureRequest.findUniqueOrThrow({
    where: { id: requestId },
    select: { status: true, document_signatures: { select: { status: true } } },
  });
  if (request.status === 'cancelled') {
    return 'cancelled'; // cancellation is terminal and explicit — never re-derived
  }
  const status = deriveRequestStatus(request.document_signatures.map((s) => s.status));
  await tx.signatureRequest.update({ where: { id: requestId }, data: { status } });
  return status;
}

/** Re-derive + persist a document's status from the union of its non-cancelled requests' signers. */
export async function recomputeDocumentStatus(
  tx: Prisma.TransactionClient,
  documentId: string,
): Promise<DocumentStatus> {
  const requests = await tx.signatureRequest.findMany({
    where: { document_id: documentId },
    select: { status: true, document_signatures: { select: { status: true } } },
  });
  const status = deriveDocumentStatus(
    requests.map((r) => ({ status: r.status, signers: r.document_signatures.map((s) => s.status) })),
  );
  await tx.document.update({ where: { id: documentId }, data: { status } });
  return status;
}
