-- Security hardening (arch §security). Additive only — applies with `prisma migrate deploy` (no shadow DB):
--   • refresh_sessions  — persisted, rotating, revocable refresh-token sessions (one per device/login).
--   • user_mfa + mfa_recovery_codes — per-user TOTP MFA + one-time recovery codes (hashed).
--   • security_settings — singleton MFA-enforcement policy row.
--   • roles.mfa_required — per-role MFA policy flag (SA seeded true by bootstrap).
--   • audit_log.ip_address — capture the actor's request IP on every audit row.

-- ── Refresh sessions ────────────────────────────────────────────────────────────────────────────────────
CREATE TABLE "refresh_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "user_agent" TEXT,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    CONSTRAINT "refresh_sessions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "refresh_sessions_token_hash_key" ON "refresh_sessions"("token_hash");
CREATE INDEX "refresh_sessions_user_id_idx" ON "refresh_sessions"("user_id");
ALTER TABLE "refresh_sessions"
  ADD CONSTRAINT "refresh_sessions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ── MFA ─────────────────────────────────────────────────────────────────────────────────────────────────
CREATE TABLE "user_mfa" (
    "user_id" UUID NOT NULL,
    "secret" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "confirmed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "user_mfa_pkey" PRIMARY KEY ("user_id")
);
ALTER TABLE "user_mfa"
  ADD CONSTRAINT "user_mfa_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "mfa_recovery_codes" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "code_hash" TEXT NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "mfa_recovery_codes_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "mfa_recovery_codes_user_id_idx" ON "mfa_recovery_codes"("user_id");
ALTER TABLE "mfa_recovery_codes"
  ADD CONSTRAINT "mfa_recovery_codes_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ── Security settings singleton ─────────────────────────────────────────────────────────────────────────
CREATE TABLE "security_settings" (
    "id" UUID NOT NULL,
    "mfa_enforced" BOOLEAN NOT NULL DEFAULT false,
    "updated_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "security_settings_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "security_settings"
  ADD CONSTRAINT "security_settings_updated_by_fkey"
  FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ── Per-role MFA policy + audit IP ──────────────────────────────────────────────────────────────────────
ALTER TABLE "roles" ADD COLUMN "mfa_required" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "audit_log" ADD COLUMN "ip_address" TEXT;
