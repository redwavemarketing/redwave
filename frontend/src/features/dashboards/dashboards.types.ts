/**
 * Dashboard + leaderboard response types — HAND-WRITTEN. The backend Reporting endpoints declare NO
 * response schema, so the generated types are `never`. These mirror the exact shapes built by
 * `backend/src/modules/reporting/` (dashboards.service.ts / leaderboard.service.ts / tier-progress.logic.ts).
 * Money fields are decimal STRINGS ("X.XX"); counts are numbers. Keep in sync with the backend.
 */
import type { ProductType } from '../sales/sales.types';

export interface DashPeriod {
  id: string;
  period_number: number;
}

// ── Rep dashboard ──────────────────────────────────────────────────────────────────
export interface ProductCount {
  product_type: ProductType;
  count: number;
}

export interface RepTier {
  tier_number: number;
  count: number;
  next_tier_min: number | null;
  to_next: number | null;
}

export interface RepCommission {
  commission_70: string;
  holdback_release_30: string;
  incentive_total: string;
  net_payout: string;
}

export interface RepClawback {
  id: string;
  amount: string;
  reason: string;
  status: 'pending' | 'applied';
  created_at: string;
}

export interface RepDashboard {
  period: DashPeriod | null;
  counts_by_product: ProductCount[];
  internet_activations: number;
  tier: RepTier | null;
  commission: RepCommission;
  holdback_pending_release: string;
  recent_clawbacks: RepClawback[];
}

// ── Manager dashboard ──────────────────────────────────────────────────────────────
export interface ManagerDashboard {
  period: DashPeriod | null;
  roster_size: number | null;
  team_internet_activations: number;
  pending_validations: number;
  pending_expense_approvals: number;
  sales_in_period: number;
}

// ── Business / Executive dashboard (Super Admin only) ───────────────────────────────
export interface BusinessDashboard {
  revenue: string;
  rep_payout: string;
  net_margin: string;
  holdback_liability: string;
  clawback_total: string;
  active_rep_count: number;
  top_sales_in_period: number;
}

export interface BusinessFilters {
  pay_period_id?: string;
}

// ── Admin operational home ──────────────────────────────────────────────────────────
export interface AdminDashboard {
  pending_validations: number;
  pending_expense_approvals: number;
  pending_profile_changes: number;
  pending_signature_requests: number;
  draft_pay_runs: number;
}

// ── Leaderboard (counts only — NO money field exists at the source) ─────────────────
export interface LeaderboardRow {
  rank: number;
  rep_id: string;
  rep_code: string | null;
  rep_name: string | null;
  activation_count: number;
}

export interface Leaderboard {
  period: DashPeriod | null;
  rankings: LeaderboardRow[];
}

// ── Pay periods (for the Business period selector) ──────────────────────────────────
export interface PayPeriod {
  id: string;
  period_number: number;
  start_date: string;
  end_date: string;
}
