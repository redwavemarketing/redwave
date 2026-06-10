-- Billing: gapless sequential numbering + immutable versioning + export records (BRD §8, arch §6.9).
-- Additive — applies with `prisma migrate deploy` (no shadow DB):
--   • client_statements / client_invoices gain a gapless number, a status (issued|superseded), a
--     superseded_by pointer; file_url becomes nullable (artifacts render on demand). Invoices gain generated_by.
--   • document_sequences: the per-type gapless counter (incremented atomically inside the issue transaction).
--   • billing_exports: a recorded export artifact (Excel/PDF/QuickBooks CSV/summary), like expense_exports.

CREATE TYPE "BillingDocStatus" AS ENUM ('issued', 'superseded');

-- ── client_statements ───────────────────────────────────────────────────────────────────────────────────
ALTER TABLE "client_statements" ADD COLUMN "statement_number" INTEGER;
ALTER TABLE "client_statements" ADD COLUMN "status" "BillingDocStatus" NOT NULL DEFAULT 'issued';
ALTER TABLE "client_statements" ADD COLUMN "superseded_by_id" UUID;
ALTER TABLE "client_statements" ALTER COLUMN "file_url" DROP NOT NULL;
CREATE UNIQUE INDEX "client_statements_statement_number_key" ON "client_statements"("statement_number");
CREATE INDEX "client_statements_client_id_pay_period_id_status_idx" ON "client_statements"("client_id", "pay_period_id", "status");
ALTER TABLE "client_statements"
  ADD CONSTRAINT "client_statements_superseded_by_id_fkey"
  FOREIGN KEY ("superseded_by_id") REFERENCES "client_statements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ── client_invoices ─────────────────────────────────────────────────────────────────────────────────────
ALTER TABLE "client_invoices" ADD COLUMN "invoice_number" INTEGER;
ALTER TABLE "client_invoices" ADD COLUMN "status" "BillingDocStatus" NOT NULL DEFAULT 'issued';
ALTER TABLE "client_invoices" ADD COLUMN "superseded_by_id" UUID;
ALTER TABLE "client_invoices" ADD COLUMN "generated_by" UUID;
ALTER TABLE "client_invoices" ALTER COLUMN "file_url" DROP NOT NULL;
CREATE UNIQUE INDEX "client_invoices_invoice_number_key" ON "client_invoices"("invoice_number");
CREATE INDEX "client_invoices_client_id_pay_period_id_status_idx" ON "client_invoices"("client_id", "pay_period_id", "status");
ALTER TABLE "client_invoices"
  ADD CONSTRAINT "client_invoices_superseded_by_id_fkey"
  FOREIGN KEY ("superseded_by_id") REFERENCES "client_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "client_invoices"
  ADD CONSTRAINT "client_invoices_generated_by_fkey"
  FOREIGN KEY ("generated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ── document_sequences (gapless counter) ────────────────────────────────────────────────────────────────
CREATE TABLE "document_sequences" (
    "key" TEXT NOT NULL,
    "current_value" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "document_sequences_pkey" PRIMARY KEY ("key")
);
-- Seed the two counters so the sequence service never hits an empty table (idempotent).
INSERT INTO "document_sequences" ("key", "current_value") VALUES ('statement', 0), ('invoice', 0)
  ON CONFLICT ("key") DO NOTHING;

-- ── billing_exports (recorded artifacts) ────────────────────────────────────────────────────────────────
CREATE TABLE "billing_exports" (
    "id" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "statement_id" UUID,
    "invoice_id" UUID,
    "client_id" UUID,
    "pay_period_id" UUID,
    "file_path" TEXT NOT NULL,
    "generated_by" UUID NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "billing_exports_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "billing_exports_statement_id_idx" ON "billing_exports"("statement_id");
CREATE INDEX "billing_exports_invoice_id_idx" ON "billing_exports"("invoice_id");
ALTER TABLE "billing_exports"
  ADD CONSTRAINT "billing_exports_statement_id_fkey"
  FOREIGN KEY ("statement_id") REFERENCES "client_statements"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "billing_exports"
  ADD CONSTRAINT "billing_exports_invoice_id_fkey"
  FOREIGN KEY ("invoice_id") REFERENCES "client_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "billing_exports"
  ADD CONSTRAINT "billing_exports_generated_by_fkey"
  FOREIGN KEY ("generated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
