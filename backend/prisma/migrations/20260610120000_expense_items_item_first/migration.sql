-- Expenses ITEM-FIRST: promote the expense ITEM to the atomic unit. Each item gains its own
-- submitter, status, approver, and a pay_period DERIVED from its expense_date (same-cycle payout,
-- EXP-009); expense_report_id becomes NULLABLE so new items are created report-less (the report
-- wrapper is kept only as optional grouping/history). — SRS §11 / BRD §7
--
-- Hand-authored so it applies with `prisma migrate deploy` without a shadow database. The backfill
-- copies lifecycle from the parent report and derives each item's pay_period_id from its expense_date
-- (falling back to the report's period when no seeded period matches). Existing approved items stay
-- payable in the same cycle (asserted by the Pay Run spec). No cascade (the ledger preserves records).

-- 1) Add the item-level lifecycle columns (nullable for now so existing rows accept them).
ALTER TABLE "expense_items"
  ADD COLUMN "rep_id"        UUID,
  ADD COLUMN "submitted_by"  UUID,
  ADD COLUMN "status"        "ExpenseReportStatus",
  ADD COLUMN "approved_by"   UUID,
  ADD COLUMN "approved_at"   TIMESTAMP(3),
  ADD COLUMN "pay_period_id" UUID,
  ADD COLUMN "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 2) The report link is no longer mandatory (item-first items have no report).
ALTER TABLE "expense_items" ALTER COLUMN "expense_report_id" DROP NOT NULL;

-- 3) Backfill the lifecycle from the parent report (every existing item has a non-null report).
UPDATE "expense_items" ei
SET
  "rep_id"       = er."rep_id",
  "submitted_by" = er."submitted_by",
  "status"       = er."status",
  "approved_by"  = er."approved_by",
  "approved_at"  = er."approved_at",
  "created_at"   = er."created_at"
FROM "expense_reports" er
WHERE ei."expense_report_id" = er."id";

-- 4) Derive each item's pay_period_id from its expense_date (the item-first rule, EXP-009); fall back
--    to the report's period when expense_date matches no seeded period (preserves the prior payout cycle).
UPDATE "expense_items" ei
SET "pay_period_id" = COALESCE(
  (SELECT pp."id" FROM "pay_periods" pp
   WHERE ei."expense_date" BETWEEN pp."start_date" AND pp."end_date"
   ORDER BY pp."start_date" LIMIT 1),
  (SELECT er."pay_period_id" FROM "expense_reports" er WHERE er."id" = ei."expense_report_id")
);

-- 5) Now that every row is backfilled, the submitter + status are mandatory going forward.
ALTER TABLE "expense_items" ALTER COLUMN "submitted_by" SET NOT NULL;
ALTER TABLE "expense_items" ALTER COLUMN "status"       SET NOT NULL;

-- 6) Foreign keys (no cascade — the ledger preserves records).
ALTER TABLE "expense_items"
  ADD CONSTRAINT "expense_items_rep_id_fkey"
  FOREIGN KEY ("rep_id") REFERENCES "reps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "expense_items"
  ADD CONSTRAINT "expense_items_submitted_by_fkey"
  FOREIGN KEY ("submitted_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "expense_items"
  ADD CONSTRAINT "expense_items_approved_by_fkey"
  FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "expense_items"
  ADD CONSTRAINT "expense_items_pay_period_id_fkey"
  FOREIGN KEY ("pay_period_id") REFERENCES "pay_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 7) Indexes: the Pay Run aggregation query, the own-scope list, the approval queue, and date grouping.
CREATE INDEX "expense_items_rep_id_pay_period_id_status_idx" ON "expense_items"("rep_id", "pay_period_id", "status");
CREATE INDEX "expense_items_submitted_by_idx" ON "expense_items"("submitted_by");
CREATE INDEX "expense_items_status_idx" ON "expense_items"("status");
CREATE INDEX "expense_items_expense_date_idx" ON "expense_items"("expense_date");
