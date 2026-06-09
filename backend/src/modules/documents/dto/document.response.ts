/**
 * Documents & E-Signature response DTOs — a document → its signature requests → per-signer statuses,
 * plus the recompute-result wrappers the sign/cancel actions return. — Batch A #2
 *
 * The overall status is SERVER-DERIVED. `signature_requests` is present only on the detail endpoint
 * (optional). `ip_address` is intentionally NOT exposed (DOC-007). Sign/cancel return small wrappers
 * carrying the recomputed request + document status (not the full document).
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  DocumentStatus,
  DocumentType,
  SignatureFieldType,
  SignatureRequestStatus,
  SignatureStatus,
} from '@prisma/client';

export class DocumentSignatureResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  recipient_user_id!: string;

  @ApiProperty({ enum: SignatureStatus })
  status!: SignatureStatus;

  @ApiProperty({ type: String, nullable: true, description: 'Per-signer signed copy (object path; served via a signed URL).' })
  signed_file_url!: string | null;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  signed_at!: string | null;

  @ApiProperty({ type: String, nullable: true, description: 'drawn / typed / uploaded / click_to_sign.' })
  method!: string | null;
}

/** A placed signature field (where/what a recipient signs). Coordinates are fractions 0..1 (top-left). */
export class SignatureFieldResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  recipient_user_id!: string;

  @ApiProperty({ enum: SignatureFieldType })
  type!: SignatureFieldType;

  @ApiProperty({ example: 0 })
  page!: number;

  @ApiProperty({ type: String, example: '0.10000', description: 'Left fraction (decimal string).' })
  x!: string;

  @ApiProperty({ type: String, example: '0.80000', description: 'Top fraction (decimal string).' })
  y!: string;

  @ApiProperty({ type: String, example: '0.25000', description: 'Width fraction (decimal string).' })
  w!: string;

  @ApiProperty({ type: String, example: '0.06000', description: 'Height fraction (decimal string).' })
  h!: string;
}

export class SignatureRequestResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  document_id!: string;

  @ApiProperty()
  requested_by!: string;

  @ApiProperty({ type: String, nullable: true })
  message!: string | null;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  due_date!: string | null;

  @ApiProperty({ enum: SignatureRequestStatus })
  status!: SignatureRequestStatus;

  @ApiProperty({ type: String, nullable: true, description: 'The final all-signatures copy (object path) once completed.' })
  completed_file_path!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  created_at!: string;

  @ApiProperty({ type: () => [DocumentSignatureResponse] })
  document_signatures!: DocumentSignatureResponse[];

  @ApiProperty({ type: () => [SignatureFieldResponse] })
  signature_fields!: SignatureFieldResponse[];
}

export class DocumentResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ enum: DocumentType })
  doc_type!: DocumentType;

  @ApiProperty()
  owner_user_id!: string;

  @ApiProperty({ description: 'Object path of the unsigned original; never mutated (DOC-001/004). Fetch bytes via /file-url.' })
  original_file_url!: string;

  @ApiProperty({ enum: DocumentStatus })
  status!: DocumentStatus;

  @ApiProperty({ type: String, format: 'date-time' })
  created_at!: string;

  @ApiPropertyOptional({
    type: () => [SignatureRequestResponse],
    description: 'Present on the detail endpoint; absent on the list.',
  })
  signature_requests?: SignatureRequestResponse[];
}

/** The result of signing/declining — the recomputed request + document status. */
export class SignActionResultResponse {
  @ApiProperty()
  signatureId!: string;

  @ApiProperty()
  documentId!: string;

  @ApiProperty()
  ownerId!: string;

  @ApiProperty({ enum: SignatureRequestStatus })
  requestStatus!: SignatureRequestStatus;

  @ApiProperty({ enum: DocumentStatus })
  documentStatus!: DocumentStatus;
}

/** An access-controlled short-TTL signed URL for a stored file + a suggested download filename. */
export class FileUrlResponse {
  @ApiProperty({ description: 'A short-TTL signed URL (preview/download); never the raw object path.' })
  url!: string;

  @ApiProperty({ example: 'Compensation-Agreement-2026.pdf' })
  filename!: string;
}

/** The result of cancelling a request. */
export class CancelSignatureResultResponse {
  @ApiProperty()
  request_id!: string;

  @ApiProperty({ enum: SignatureRequestStatus, example: 'cancelled' })
  status!: SignatureRequestStatus;

  @ApiProperty({ enum: DocumentStatus })
  document_status!: DocumentStatus;
}
