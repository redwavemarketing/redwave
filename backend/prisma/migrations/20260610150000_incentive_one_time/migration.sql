-- Incentives: rename the `target_based` mode to `one_time` (the CONFIRMED dual-mode rule — per_activation +
-- one_time, both applied by the engine, threshold-relative). A value RENAME preserves every existing row
-- (no data migration). — SRS COMM-005
--
-- Hand-authored so it applies with `prisma migrate deploy` without a shadow database. PostgreSQL 10+.
ALTER TYPE "IncentiveTargetType" RENAME VALUE 'target_based' TO 'one_time';
