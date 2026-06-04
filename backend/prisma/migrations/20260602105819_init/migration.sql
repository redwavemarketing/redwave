-- CreateEnum
CREATE TYPE "ThemePreference" AS ENUM ('light', 'dark', 'system');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "PermissionAction" AS ENUM ('view', 'create', 'edit', 'approve', 'delete', 'export');

-- CreateEnum
CREATE TYPE "ProfileChangeStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "RepStatus" AS ENUM ('active', 'terminated');

-- CreateEnum
CREATE TYPE "EquipmentStatus" AS ENUM ('assigned', 'returned', 'withheld');

-- CreateEnum
CREATE TYPE "Market" AS ENUM ('CA', 'US');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('internet', 'greenfield_internet', 'tv', 'home_phone');

-- CreateEnum
CREATE TYPE "RateKind" AS ENUM ('product', 'tv_addon', 'hp_addon', 'bundle_bonus', 'spiff');

-- CreateEnum
CREATE TYPE "IncentiveTargetType" AS ENUM ('per_activation', 'target_based');

-- CreateEnum
CREATE TYPE "IncentiveStatus" AS ENUM ('active', 'ended');

-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('entered', 'validated', 'in_pay_run', 'paid', 'clawed_back', 'deleted');

-- CreateEnum
CREATE TYPE "SaleItemStatus" AS ENUM ('active', 'cancelled', 'clawed_back');

-- CreateEnum
CREATE TYPE "PayPeriodStatus" AS ENUM ('open', 'closed', 'paid');

-- CreateEnum
CREATE TYPE "PayRunStatus" AS ENUM ('draft', 'finalized', 'exported');

-- CreateEnum
CREATE TYPE "HoldbackReleaseStatus" AS ENUM ('held', 'scheduled', 'released');

-- CreateEnum
CREATE TYPE "ClawbackStatus" AS ENUM ('pending', 'applied');

-- CreateEnum
CREATE TYPE "ExpenseReportStatus" AS ENUM ('draft', 'submitted', 'approved', 'rejected', 'sent_back');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('km', 'meals', 'hotel', 'flight', 'rental', 'gas', 'other');

-- CreateEnum
CREATE TYPE "TripType" AS ENUM ('single', 'round');

-- CreateEnum
CREATE TYPE "ExportFormat" AS ENUM ('pdf', 'excel');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('compensation_agreement', 'rate_notice', 'equipment', 'other');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('draft', 'shared', 'partially_signed', 'completed', 'declined');

-- CreateEnum
CREATE TYPE "SignatureRequestStatus" AS ENUM ('pending', 'completed', 'declined', 'cancelled');

-- CreateEnum
CREATE TYPE "SignatureStatus" AS ENUM ('pending', 'signed', 'declined');

-- CreateEnum
CREATE TYPE "TargetType" AS ENUM ('daily', 'weekly', 'monthly');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('in_app', 'email');

-- CreateEnum
CREATE TYPE "ChatbotRole" AS ENUM ('user', 'assistant');

-- CreateEnum
CREATE TYPE "ImportSourceType" AS ENUM ('client_report', 'master_migration', 'balance_migration');

-- CreateEnum
CREATE TYPE "ImportType" AS ENUM ('reps', 'clients', 'products', 'sales', 'holdback', 'clawback', 'mixed');

-- CreateEnum
CREATE TYPE "ImportBatchStatus" AS ENUM ('staged', 'committed', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('matched', 'unmatched', 'duplicate', 'error', 'ignored');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT,
    "avatar_url" TEXT,
    "theme_preference" "ThemePreference" NOT NULL,
    "status" "UserStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modules" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL,
    "module_id" UUID NOT NULL,
    "action" "PermissionAction" NOT NULL,
    "description" TEXT,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "before_json" JSONB,
    "after_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_change_requests" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "requested_by" UUID NOT NULL,
    "proposed_changes" JSONB NOT NULL,
    "status" "ProfileChangeStatus" NOT NULL,
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_change_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reps" (
    "id" UUID NOT NULL,
    "rep_code" TEXT NOT NULL,
    "user_id" UUID,
    "full_name" TEXT NOT NULL,
    "field_manager_id" UUID NOT NULL,
    "status" "RepStatus" NOT NULL,
    "hire_date" DATE NOT NULL,
    "termination_date" DATE,
    "payment_details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rep_documents" (
    "id" UUID NOT NULL,
    "rep_id" UUID NOT NULL,
    "doc_type" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rep_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rep_equipment" (
    "id" UUID NOT NULL,
    "rep_id" UUID NOT NULL,
    "equipment_type" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "deposit_amount" DECIMAL(12,2) NOT NULL,
    "assigned_date" DATE NOT NULL,
    "returned_date" DATE,
    "status" "EquipmentStatus" NOT NULL,

    CONSTRAINT "rep_equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" UUID NOT NULL,
    "client_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "market" "Market" NOT NULL,
    "supplies_mpu_id" BOOLEAN NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "product_type" "ProductType" NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_billing_rates" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "product_id" UUID,
    "rate_kind" "RateKind" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,
    "created_by" UUID NOT NULL,

    CONSTRAINT "client_billing_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_tier_configs" (
    "id" UUID NOT NULL,
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,
    "created_by" UUID NOT NULL,

    CONSTRAINT "commission_tier_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_tiers" (
    "id" UUID NOT NULL,
    "tier_config_id" UUID NOT NULL,
    "tier_number" INTEGER NOT NULL,
    "min_count" INTEGER NOT NULL,
    "max_count" INTEGER,
    "rate_per_activation" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "commission_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_flat_rates" (
    "id" UUID NOT NULL,
    "product_type" "ProductType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,
    "created_by" UUID NOT NULL,

    CONSTRAINT "commission_flat_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "holdback_config" (
    "id" UUID NOT NULL,
    "advance_pct" DECIMAL(5,4) NOT NULL,
    "holdback_pct" DECIMAL(5,4) NOT NULL,
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,

    CONSTRAINT "holdback_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "holdback_release_settings" (
    "id" UUID NOT NULL,
    "release_rule" TEXT NOT NULL,
    "set_by" UUID NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "holdback_release_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incentives" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "scope_client_id" UUID,
    "scope_product_type" "ProductType",
    "target_type" "IncentiveTargetType" NOT NULL,
    "target_count" INTEGER,
    "window_start" DATE NOT NULL,
    "window_end" DATE NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "IncentiveStatus" NOT NULL,
    "created_by" UUID NOT NULL,

    CONSTRAINT "incentives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales" (
    "id" UUID NOT NULL,
    "sale_code" TEXT NOT NULL,
    "sale_date" DATE NOT NULL,
    "activation_date" DATE,
    "rep_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "customer_name" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "province_state" TEXT NOT NULL,
    "postal_code" TEXT NOT NULL,
    "mpu_id" TEXT,
    "is_greenfield" BOOLEAN NOT NULL,
    "status" "SaleStatus" NOT NULL,
    "validated_by" UUID,
    "validated_at" TIMESTAMP(3),
    "pay_run_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_items" (
    "id" UUID NOT NULL,
    "sale_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "product_type" "ProductType" NOT NULL,
    "counts_toward_tally" BOOLEAN NOT NULL,
    "tier_at_payment" INTEGER,
    "rate_applied" DECIMAL(12,2),
    "commission_paid" DECIMAL(12,2),
    "incentive_id" UUID,
    "incentive_amount" DECIMAL(12,2),
    "item_status" "SaleItemStatus" NOT NULL,

    CONSTRAINT "sale_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pay_periods" (
    "id" UUID NOT NULL,
    "period_number" INTEGER NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "payday" DATE NOT NULL,
    "status" "PayPeriodStatus" NOT NULL,

    CONSTRAINT "pay_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pay_runs" (
    "id" UUID NOT NULL,
    "pay_period_id" UUID NOT NULL,
    "run_date" DATE NOT NULL,
    "status" "PayRunStatus" NOT NULL,
    "executed_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pay_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pay_run_lines" (
    "id" UUID NOT NULL,
    "pay_run_id" UUID NOT NULL,
    "rep_id" UUID NOT NULL,
    "commission_70" DECIMAL(12,2) NOT NULL,
    "holdback_release_30" DECIMAL(12,2) NOT NULL,
    "expense_total" DECIMAL(12,2) NOT NULL,
    "incentive_total" DECIMAL(12,2) NOT NULL,
    "bonus_amount" DECIMAL(12,2) NOT NULL,
    "bonus_note" TEXT,
    "clawback_total" DECIMAL(12,2) NOT NULL,
    "net_payout" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "pay_run_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "holdback_ledger" (
    "id" UUID NOT NULL,
    "rep_id" UUID NOT NULL,
    "origin_pay_period_id" UUID NOT NULL,
    "amount_held" DECIMAL(12,2) NOT NULL,
    "scheduled_release_period_id" UUID,
    "release_status" "HoldbackReleaseStatus" NOT NULL,
    "released_in_pay_run_id" UUID,
    "amount_released" DECIMAL(12,2),
    "clawback_applied" DECIMAL(12,2),

    CONSTRAINT "holdback_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clawbacks" (
    "id" UUID NOT NULL,
    "sale_item_id" UUID NOT NULL,
    "sale_id" UUID NOT NULL,
    "rep_id" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "reported_date" DATE NOT NULL,
    "entered_by" UUID NOT NULL,
    "applied_in_pay_run_id" UUID,
    "status" "ClawbackStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clawbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_reports" (
    "id" UUID NOT NULL,
    "submitted_by" UUID NOT NULL,
    "rep_id" UUID,
    "week_start" DATE NOT NULL,
    "week_end" DATE NOT NULL,
    "status" "ExpenseReportStatus" NOT NULL,
    "approved_by" UUID,
    "approved_at" TIMESTAMP(3),
    "pay_period_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expense_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_items" (
    "id" UUID NOT NULL,
    "expense_report_id" UUID NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "client_id" UUID,
    "expense_date" DATE NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "description" TEXT NOT NULL,
    "receipt_url" TEXT,

    CONSTRAINT "expense_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_km_logs" (
    "id" UUID NOT NULL,
    "expense_item_id" UUID NOT NULL,
    "trip_type" "TripType" NOT NULL,
    "total_km" DECIMAL(10,2) NOT NULL,
    "deduction_km" DECIMAL(10,2) NOT NULL,
    "billable_km" DECIMAL(10,2) NOT NULL,
    "rate_per_km" DECIMAL(6,3) NOT NULL,
    "computed_amount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "expense_km_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_km_stops" (
    "id" UUID NOT NULL,
    "km_log_id" UUID NOT NULL,
    "stop_order" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "lat" DECIMAL(9,6) NOT NULL,
    "lng" DECIMAL(9,6) NOT NULL,

    CONSTRAINT "expense_km_stops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_field_configs" (
    "id" UUID NOT NULL,
    "category_key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "requires_receipt" BOOLEAN NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "created_by" UUID NOT NULL,

    CONSTRAINT "expense_field_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_exports" (
    "id" UUID NOT NULL,
    "generated_by" UUID NOT NULL,
    "client_id" UUID,
    "pay_period_id" UUID,
    "scope_filters" JSONB NOT NULL,
    "format" "ExportFormat" NOT NULL,
    "file_url" TEXT NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expense_exports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_statements" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "pay_period_id" UUID NOT NULL,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "file_url" TEXT NOT NULL,
    "generated_by" UUID NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_statements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_statement_lines" (
    "id" UUID NOT NULL,
    "statement_id" UUID NOT NULL,
    "sale_id" UUID NOT NULL,
    "customer_name" TEXT NOT NULL,
    "products_summary" TEXT NOT NULL,
    "line_total" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "client_statement_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_invoices" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "pay_period_id" UUID NOT NULL,
    "total_commission" DECIMAL(12,2) NOT NULL,
    "file_url" TEXT NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "doc_type" "DocumentType" NOT NULL,
    "owner_user_id" UUID NOT NULL,
    "original_file_url" TEXT NOT NULL,
    "status" "DocumentStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signature_requests" (
    "id" UUID NOT NULL,
    "document_id" UUID NOT NULL,
    "requested_by" UUID NOT NULL,
    "message" TEXT,
    "due_date" DATE,
    "status" "SignatureRequestStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "signature_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_signatures" (
    "id" UUID NOT NULL,
    "signature_request_id" UUID NOT NULL,
    "recipient_user_id" UUID NOT NULL,
    "status" "SignatureStatus" NOT NULL,
    "signed_file_url" TEXT,
    "signed_at" TIMESTAMP(3),
    "method" TEXT,
    "ip_address" TEXT,

    CONSTRAINT "document_signatures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_targets" (
    "id" UUID NOT NULL,
    "rep_id" UUID,
    "target_type" "TargetType" NOT NULL,
    "target_count" INTEGER NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "set_by" UUID NOT NULL,

    CONSTRAINT "sales_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "related_entity_type" TEXT,
    "related_entity_id" UUID,
    "is_read" BOOLEAN NOT NULL,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_event_settings" (
    "id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "in_app_enabled" BOOLEAN NOT NULL,
    "email_enabled" BOOLEAN NOT NULL,
    "updated_by" UUID NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_event_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chatbot_config" (
    "id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "config_json" JSONB NOT NULL,
    "updated_by" UUID NOT NULL,

    CONSTRAINT "chatbot_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chatbot_conversations" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chatbot_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chatbot_messages" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "role" "ChatbotRole" NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chatbot_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_batches" (
    "id" UUID NOT NULL,
    "source_file_url" TEXT NOT NULL,
    "source_type" "ImportSourceType" NOT NULL,
    "import_type" "ImportType" NOT NULL,
    "client_id" UUID,
    "field_mapping_id" UUID,
    "status" "ImportBatchStatus" NOT NULL,
    "total_rows" INTEGER NOT NULL,
    "matched_rows" INTEGER NOT NULL,
    "error_rows" INTEGER NOT NULL,
    "reconcile_total" DECIMAL(12,2),
    "error_summary" JSONB,
    "run_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "committed_at" TIMESTAMP(3),

    CONSTRAINT "import_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_field_mappings" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "client_id" UUID,
    "source_type" "ImportSourceType" NOT NULL,
    "mapping_json" JSONB NOT NULL,
    "created_by" UUID NOT NULL,

    CONSTRAINT "import_field_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_rows" (
    "id" UUID NOT NULL,
    "import_batch_id" UUID NOT NULL,
    "row_number" INTEGER NOT NULL,
    "raw_data" JSONB NOT NULL,
    "mapped_data" JSONB,
    "match_status" "MatchStatus" NOT NULL,
    "matched_entity_id" UUID,
    "issue" TEXT,
    "resolved_by" UUID,

    CONSTRAINT "import_rows_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "modules_key_key" ON "modules"("key");

-- CreateIndex
CREATE INDEX "audit_log_entity_type_entity_id_idx" ON "audit_log"("entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "reps_rep_code_key" ON "reps"("rep_code");

-- CreateIndex
CREATE UNIQUE INDEX "reps_user_id_key" ON "reps"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "clients_client_code_key" ON "clients"("client_code");

-- CreateIndex
CREATE UNIQUE INDEX "sales_sale_code_key" ON "sales"("sale_code");

-- CreateIndex
CREATE INDEX "sales_rep_id_sale_date_idx" ON "sales"("rep_id", "sale_date");

-- CreateIndex
CREATE INDEX "sales_client_id_mpu_id_idx" ON "sales"("client_id", "mpu_id");

-- CreateIndex
CREATE UNIQUE INDEX "pay_periods_period_number_key" ON "pay_periods"("period_number");

-- CreateIndex
CREATE INDEX "holdback_ledger_rep_id_release_status_idx" ON "holdback_ledger"("rep_id", "release_status");

-- CreateIndex
CREATE UNIQUE INDEX "expense_km_logs_expense_item_id_key" ON "expense_km_logs"("expense_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "expense_field_configs_category_key_key" ON "expense_field_configs"("category_key");

-- CreateIndex
CREATE UNIQUE INDEX "notification_event_settings_event_type_key" ON "notification_event_settings"("event_type");

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_change_requests" ADD CONSTRAINT "profile_change_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_change_requests" ADD CONSTRAINT "profile_change_requests_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_change_requests" ADD CONSTRAINT "profile_change_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reps" ADD CONSTRAINT "reps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reps" ADD CONSTRAINT "reps_field_manager_id_fkey" FOREIGN KEY ("field_manager_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rep_documents" ADD CONSTRAINT "rep_documents_rep_id_fkey" FOREIGN KEY ("rep_id") REFERENCES "reps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rep_equipment" ADD CONSTRAINT "rep_equipment_rep_id_fkey" FOREIGN KEY ("rep_id") REFERENCES "reps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_billing_rates" ADD CONSTRAINT "client_billing_rates_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_billing_rates" ADD CONSTRAINT "client_billing_rates_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_billing_rates" ADD CONSTRAINT "client_billing_rates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_tier_configs" ADD CONSTRAINT "commission_tier_configs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_tiers" ADD CONSTRAINT "commission_tiers_tier_config_id_fkey" FOREIGN KEY ("tier_config_id") REFERENCES "commission_tier_configs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_flat_rates" ADD CONSTRAINT "commission_flat_rates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holdback_release_settings" ADD CONSTRAINT "holdback_release_settings_set_by_fkey" FOREIGN KEY ("set_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incentives" ADD CONSTRAINT "incentives_scope_client_id_fkey" FOREIGN KEY ("scope_client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incentives" ADD CONSTRAINT "incentives_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_rep_id_fkey" FOREIGN KEY ("rep_id") REFERENCES "reps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_validated_by_fkey" FOREIGN KEY ("validated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_pay_run_id_fkey" FOREIGN KEY ("pay_run_id") REFERENCES "pay_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_incentive_id_fkey" FOREIGN KEY ("incentive_id") REFERENCES "incentives"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pay_runs" ADD CONSTRAINT "pay_runs_pay_period_id_fkey" FOREIGN KEY ("pay_period_id") REFERENCES "pay_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pay_runs" ADD CONSTRAINT "pay_runs_executed_by_fkey" FOREIGN KEY ("executed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pay_run_lines" ADD CONSTRAINT "pay_run_lines_pay_run_id_fkey" FOREIGN KEY ("pay_run_id") REFERENCES "pay_runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pay_run_lines" ADD CONSTRAINT "pay_run_lines_rep_id_fkey" FOREIGN KEY ("rep_id") REFERENCES "reps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holdback_ledger" ADD CONSTRAINT "holdback_ledger_rep_id_fkey" FOREIGN KEY ("rep_id") REFERENCES "reps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holdback_ledger" ADD CONSTRAINT "holdback_ledger_origin_pay_period_id_fkey" FOREIGN KEY ("origin_pay_period_id") REFERENCES "pay_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holdback_ledger" ADD CONSTRAINT "holdback_ledger_scheduled_release_period_id_fkey" FOREIGN KEY ("scheduled_release_period_id") REFERENCES "pay_periods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holdback_ledger" ADD CONSTRAINT "holdback_ledger_released_in_pay_run_id_fkey" FOREIGN KEY ("released_in_pay_run_id") REFERENCES "pay_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clawbacks" ADD CONSTRAINT "clawbacks_sale_item_id_fkey" FOREIGN KEY ("sale_item_id") REFERENCES "sale_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clawbacks" ADD CONSTRAINT "clawbacks_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clawbacks" ADD CONSTRAINT "clawbacks_rep_id_fkey" FOREIGN KEY ("rep_id") REFERENCES "reps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clawbacks" ADD CONSTRAINT "clawbacks_entered_by_fkey" FOREIGN KEY ("entered_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clawbacks" ADD CONSTRAINT "clawbacks_applied_in_pay_run_id_fkey" FOREIGN KEY ("applied_in_pay_run_id") REFERENCES "pay_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_reports" ADD CONSTRAINT "expense_reports_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_reports" ADD CONSTRAINT "expense_reports_rep_id_fkey" FOREIGN KEY ("rep_id") REFERENCES "reps"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_reports" ADD CONSTRAINT "expense_reports_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_reports" ADD CONSTRAINT "expense_reports_pay_period_id_fkey" FOREIGN KEY ("pay_period_id") REFERENCES "pay_periods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_items" ADD CONSTRAINT "expense_items_expense_report_id_fkey" FOREIGN KEY ("expense_report_id") REFERENCES "expense_reports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_items" ADD CONSTRAINT "expense_items_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_km_logs" ADD CONSTRAINT "expense_km_logs_expense_item_id_fkey" FOREIGN KEY ("expense_item_id") REFERENCES "expense_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_km_stops" ADD CONSTRAINT "expense_km_stops_km_log_id_fkey" FOREIGN KEY ("km_log_id") REFERENCES "expense_km_logs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_field_configs" ADD CONSTRAINT "expense_field_configs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_exports" ADD CONSTRAINT "expense_exports_generated_by_fkey" FOREIGN KEY ("generated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_exports" ADD CONSTRAINT "expense_exports_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_exports" ADD CONSTRAINT "expense_exports_pay_period_id_fkey" FOREIGN KEY ("pay_period_id") REFERENCES "pay_periods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_statements" ADD CONSTRAINT "client_statements_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_statements" ADD CONSTRAINT "client_statements_pay_period_id_fkey" FOREIGN KEY ("pay_period_id") REFERENCES "pay_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_statements" ADD CONSTRAINT "client_statements_generated_by_fkey" FOREIGN KEY ("generated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_statement_lines" ADD CONSTRAINT "client_statement_lines_statement_id_fkey" FOREIGN KEY ("statement_id") REFERENCES "client_statements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_statement_lines" ADD CONSTRAINT "client_statement_lines_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_invoices" ADD CONSTRAINT "client_invoices_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_invoices" ADD CONSTRAINT "client_invoices_pay_period_id_fkey" FOREIGN KEY ("pay_period_id") REFERENCES "pay_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signature_requests" ADD CONSTRAINT "signature_requests_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signature_requests" ADD CONSTRAINT "signature_requests_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_signatures" ADD CONSTRAINT "document_signatures_signature_request_id_fkey" FOREIGN KEY ("signature_request_id") REFERENCES "signature_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_signatures" ADD CONSTRAINT "document_signatures_recipient_user_id_fkey" FOREIGN KEY ("recipient_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_targets" ADD CONSTRAINT "sales_targets_rep_id_fkey" FOREIGN KEY ("rep_id") REFERENCES "reps"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_targets" ADD CONSTRAINT "sales_targets_set_by_fkey" FOREIGN KEY ("set_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_event_settings" ADD CONSTRAINT "notification_event_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatbot_config" ADD CONSTRAINT "chatbot_config_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatbot_conversations" ADD CONSTRAINT "chatbot_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatbot_messages" ADD CONSTRAINT "chatbot_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "chatbot_conversations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_field_mapping_id_fkey" FOREIGN KEY ("field_mapping_id") REFERENCES "import_field_mappings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_run_by_fkey" FOREIGN KEY ("run_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_field_mappings" ADD CONSTRAINT "import_field_mappings_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_field_mappings" ADD CONSTRAINT "import_field_mappings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_rows" ADD CONSTRAINT "import_rows_import_batch_id_fkey" FOREIGN KEY ("import_batch_id") REFERENCES "import_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_rows" ADD CONSTRAINT "import_rows_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
