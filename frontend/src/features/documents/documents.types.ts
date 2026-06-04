/**
 * Documents & E-Signature types — RESPONSE shapes hand-written (the backend declares no response schema, so
 * generated types are `never`). Mirrors `backend/src/modules/documents/`. The overall status + each request/
 * signature status are SERVER-DERIVED — the UI only DISPLAYS them, never recomputes. The detail returns raw
 * user IDs (no names) — names come from the users list (`useUsers`). REQUEST bodies typed from the schema.
 */
import type { components } from '../../api/generated/schema';

export type DocType = 'compensation_agreement' | 'rate_notice' | 'equipment' | 'other';
export type DocumentStatus = 'draft' | 'shared' | 'partially_signed' | 'completed' | 'declined';
export type SignatureRequestStatus = 'pending' | 'completed' | 'declined' | 'cancelled';
export type SignatureStatus = 'pending' | 'signed' | 'declined';
export type SignDecision = 'sign' | 'decline';

/** One signer's row within a request. Per-signer signed copy; the original is never mutated (DOC-004). */
export interface DocumentSignature {
  id: string;
  recipient_user_id: string;
  status: SignatureStatus;
  signed_file_url: string | null;
  signed_at: string | null;
  method: string | null;
}

export interface SignatureRequest {
  id: string;
  document_id: string;
  requested_by: string;
  message: string | null;
  due_date: string | null;
  status: SignatureRequestStatus;
  created_at: string;
  document_signatures: DocumentSignature[];
}

export interface Document {
  id: string;
  title: string;
  doc_type: DocType;
  owner_user_id: string;
  original_file_url: string;
  status: DocumentStatus;
  created_at: string;
  signature_requests?: SignatureRequest[]; // present on detail; absent on the list
}

export interface DocumentFilters {
  status?: DocumentStatus;
  doc_type?: DocType;
}

// Request bodies — typed from the generated schema.
export type CreateDocumentBody = components['schemas']['CreateDocumentDto'];
export type CreateSignatureRequestBody = components['schemas']['CreateSignatureRequestDto'];
export type SignBody = components['schemas']['SignDto'];

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  compensation_agreement: 'Compensation agreement',
  rate_notice: 'Rate notice',
  equipment: 'Equipment',
  other: 'Other',
};
