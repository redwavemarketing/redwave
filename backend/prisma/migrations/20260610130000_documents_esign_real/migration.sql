-- Documents & E-Signature, made real: sender-placed signature FIELDS (where/what each recipient signs),
-- per-user saved reusable SIGNATURES, and the request's final all-signatures copy. The existing
-- documents/signature_requests/document_signatures *_file_url columns now hold object PATHS (re-signed on
-- read via a short-TTL signed URL); the original is never mutated (DOC-001/004). — SRS §13
--
-- Hand-authored so it applies with `prisma migrate deploy` without a shadow database. Additive only
-- (CREATE TYPE/TABLE, ADD COLUMN, indexes, FKs). No cascade (the ledger/audit preserves records).

-- 1) Enums.
CREATE TYPE "SignatureFieldType" AS ENUM ('signature', 'initial', 'date', 'text');
CREATE TYPE "SignatureMethod" AS ENUM ('drawn', 'typed', 'uploaded');

-- 2) The final all-signatures copy on a completed request.
ALTER TABLE "signature_requests" ADD COLUMN "completed_file_path" TEXT;

-- 3) Signature fields — where/what each recipient signs (normalized fractions, top-left origin).
CREATE TABLE "signature_fields" (
    "id" UUID NOT NULL,
    "signature_request_id" UUID NOT NULL,
    "recipient_user_id" UUID NOT NULL,
    "type" "SignatureFieldType" NOT NULL,
    "page" INTEGER NOT NULL,
    "x" DECIMAL(6,5) NOT NULL,
    "y" DECIMAL(6,5) NOT NULL,
    "w" DECIMAL(6,5) NOT NULL,
    "h" DECIMAL(6,5) NOT NULL,
    "value_text" TEXT,
    "value_image_path" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "signature_fields_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "signature_fields_signature_request_id_idx" ON "signature_fields"("signature_request_id");

-- 4) Per-user saved reusable signatures (private + own-scoped; one default).
CREATE TABLE "user_signatures" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "method" "SignatureMethod" NOT NULL,
    "is_default" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_signatures_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "user_signatures_user_id_idx" ON "user_signatures"("user_id");

-- 5) Foreign keys (no cascade).
ALTER TABLE "signature_fields"
  ADD CONSTRAINT "signature_fields_signature_request_id_fkey"
  FOREIGN KEY ("signature_request_id") REFERENCES "signature_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "signature_fields"
  ADD CONSTRAINT "signature_fields_recipient_user_id_fkey"
  FOREIGN KEY ("recipient_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "user_signatures"
  ADD CONSTRAINT "user_signatures_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
