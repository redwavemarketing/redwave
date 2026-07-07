-- Report-as-folder expense rework (EXP-001, Meeting 3). The dormant expense_reports wrapper becomes the live
-- FOLDER: a rep creates + names it and adds items into it. The folder has NO independent approval state (its
-- status is the DERIVED aggregate of its items), so the vestigial status/approval/pay_period columns are
-- dropped. Every item now belongs to a folder (expense_report_id NOT NULL) — existing report-less items are
-- backfilled into (submitter, rep, business-week Mon–Sun) folders. Money reads are unchanged (item-level).

-- ── 1. expense_reports: add the folder name, drop the vestigial columns ──────────────────────────────────
ALTER TABLE "expense_reports" ADD COLUMN "name" TEXT;

-- The folder's status/approval/pay_period were never written (dormant table) and are meaningless in the
-- folder model (status is derived). Drop them + their FK constraints.
ALTER TABLE "expense_reports" DROP CONSTRAINT IF EXISTS "expense_reports_approved_by_fkey";
ALTER TABLE "expense_reports" DROP CONSTRAINT IF EXISTS "expense_reports_pay_period_id_fkey";
ALTER TABLE "expense_reports" DROP COLUMN IF EXISTS "status";
ALTER TABLE "expense_reports" DROP COLUMN IF EXISTS "approved_by";
ALTER TABLE "expense_reports" DROP COLUMN IF EXISTS "approved_at";
ALTER TABLE "expense_reports" DROP COLUMN IF EXISTS "pay_period_id";

CREATE INDEX IF NOT EXISTS "expense_reports_submitted_by_idx" ON "expense_reports"("submitted_by");

-- ── 2. Backfill: wrap every report-less item into a (submitter, rep, business-week) folder ───────────────
--    Postgres date_trunc('week', d) returns the MONDAY of that week (business week Mon–Sun). rep_id is
--    grouped with IS NOT DISTINCT FROM so nulls group together. gen_random_uuid() is built-in (pg13+).
INSERT INTO "expense_reports" ("id", "name", "submitted_by", "rep_id", "week_start", "week_end", "created_at")
SELECT
  gen_random_uuid(),
  'Week of ' || to_char(date_trunc('week', "expense_date"), 'YYYY-MM-DD'),
  "submitted_by",
  "rep_id",
  date_trunc('week', "expense_date")::date,
  (date_trunc('week', "expense_date") + INTERVAL '6 days')::date,
  now()
FROM "expense_items"
WHERE "expense_report_id" IS NULL
GROUP BY "submitted_by", "rep_id", date_trunc('week', "expense_date");

UPDATE "expense_items" i
SET "expense_report_id" = r."id"
FROM "expense_reports" r
WHERE i."expense_report_id" IS NULL
  AND r."submitted_by" = i."submitted_by"
  AND r."rep_id" IS NOT DISTINCT FROM i."rep_id"
  AND r."week_start" = date_trunc('week', i."expense_date")::date;

-- ── 3. Enforce the folder invariants (after the backfill leaves zero nulls) ──────────────────────────────
UPDATE "expense_reports" SET "name" = 'Expense report' WHERE "name" IS NULL;
ALTER TABLE "expense_reports" ALTER COLUMN "name" SET NOT NULL;
ALTER TABLE "expense_items" ALTER COLUMN "expense_report_id" SET NOT NULL;
