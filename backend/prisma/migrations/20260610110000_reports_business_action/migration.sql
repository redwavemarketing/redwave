-- The `reports:business` RBAC action — gates the business/executive dashboard + the cross-period trends
-- endpoint (Super Admin only). Hand-authored so it applies with `prisma migrate deploy` without a shadow DB.
-- Same safe pattern as `broadcast`: the new enum value is NOT used in this migration (the (reports, business)
-- permission row is seeded by bootstrap, separately), so PostgreSQL 12+/Supabase applies it cleanly.

ALTER TYPE "PermissionAction" ADD VALUE 'business';
