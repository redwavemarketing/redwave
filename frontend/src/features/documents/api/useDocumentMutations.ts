/**
 * Documents mutations — upload, the unified share/request-signature, row-level sign/decline, and cancel. The
 * upload binary + e-sign provider are STUBBED (the body carries no file; the server mints the ref). Sign/
 * cancel carry NO permission — they are gated row-level server-side (a non-signer → 403; non-pending → 409).
 * All invalidate the documents cache. Toasts at the call site. Responses `never`-typed → cast.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../api/client';
import { unwrap } from '../../../lib/query/unwrap';
import { documentKeys } from './keys';
import type { CreateDocumentBody, CreateSignatureRequestBody, Document, SignBody, SignatureRequest } from '../documents.types';

export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateDocumentBody) => unwrap<Document>(api.POST('/v1/documents', { body })),
    onSuccess: () => qc.invalidateQueries({ queryKey: documentKeys.all }),
  });
}

/** Share == request a signature (DOC-002): recipients become the shared-with set AND the asked signers. */
export function useRequestSignature() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ documentId, body }: { documentId: string; body: CreateSignatureRequestBody }) =>
      unwrap<SignatureRequest>(api.POST('/v1/documents/{id}/signature-requests', { params: { path: { id: documentId } }, body })),
    onSuccess: () => qc.invalidateQueries({ queryKey: documentKeys.all }),
  });
}

/** Sign or decline — row-level (must be the asked pending recipient; the server is the real gate). */
export function useSignRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, body }: { requestId: string; body: SignBody }) =>
      unwrap<unknown>(api.POST('/v1/signature-requests/{id}/sign', { params: { path: { id: requestId } }, body })),
    onSuccess: () => qc.invalidateQueries({ queryKey: documentKeys.all }),
  });
}

/** Cancel a pending request — requester / owner / admin (row-level). All-cancelled → doc back to draft. */
export function useCancelRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => unwrap<unknown>(api.POST('/v1/signature-requests/{id}/cancel', { params: { path: { id: requestId } } })),
    onSuccess: () => qc.invalidateQueries({ queryKey: documentKeys.all }),
  });
}
