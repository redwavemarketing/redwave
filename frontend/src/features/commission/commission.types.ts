/**
 * Commission Config types (the REP-commission stream — SEPARATE from client billing rates, CLAUDE #3).
 * RESPONSE shapes hand-written (the backend declares no response schema). Mirrors
 * `backend/src/modules/commission/`. Money/rates are decimal STRINGS (#1). This feature's RATE reads are
 * ONLY /v1/commission/* + /v1/incentives — never client_billing_rates. (The incentive scope picker reads
 * /v1/clients as a client REFERENCE only.) Keep in sync with the backend.
 */
import type { components } from '../../api/generated/schema';
import type { RateStatus } from '../../components/ui';

export type ProductType = 'internet' | 'greenfield_internet' | 'tv' | 'home_phone';
/** Flat rates exclude internet (it's tiered). */
export type FlatProductType = 'greenfield_internet' | 'tv' | 'home_phone';
export type IncentiveTargetType = 'per_activation' | 'target_based';
export type IncentiveStatus = 'active' | 'ended';

// ── Tier schedule ────────────────────────────────────────────────────────────────
export interface TierBracket {
  id: string;
  tier_number: number;
  min_count: number;
  max_count: number | null;
  rate_per_activation: string;
}
export interface TierConfig {
  id: string;
  effective_from: string;
  effective_to: string | null;
  status: RateStatus;
  tiers: TierBracket[];
}

// ── Flat rates ───────────────────────────────────────────────────────────────────
export interface FlatRate {
  id: string;
  product_type: ProductType;
  amount: string;
  effective_from: string;
  effective_to: string | null;
  status: RateStatus;
}

// ── Holdback split ───────────────────────────────────────────────────────────────
export interface HoldbackConfig {
  id: string;
  advance_pct: string;
  holdback_pct: string;
  effective_from: string;
  effective_to: string | null;
  status: RateStatus;
}

// ── Holdback-release setting (PROPOSED §17 — sticky, store-only) ───────────────────
export interface HoldbackReleaseSetting {
  id: string;
  release_rule: string;
  set_by: string;
  effective_from: string;
}

// ── Incentives ───────────────────────────────────────────────────────────────────
export interface Incentive {
  id: string;
  name: string;
  scope_client_id: string | null;
  scope_product_type: ProductType | null;
  target_type: IncentiveTargetType;
  target_count: number | null;
  window_start: string;
  window_end: string;
  amount: string;
  status: IncentiveStatus;
  created_by: string;
}

// ── Request bodies ───────────────────────────────────────────────────────────────
/** Hand-written: the generated TierBracketDto.max_count is `Record<string,never>` (a swagger nullable
 *  quirk), so we type it as `number | null` here and cast at the api boundary. */
export interface TierBracketBody {
  tier_number: number;
  min_count: number;
  max_count: number | null;
  rate_per_activation: string;
}
export interface CreateTierScheduleBody {
  effective_from: string;
  effective_to?: string;
  tiers: TierBracketBody[];
}

// The rest are typed from the generated schema (clean).
export type CreateFlatRateBody = components['schemas']['CreateFlatRateDto'];
export type SetHoldbackConfigBody = components['schemas']['SetHoldbackConfigDto'];
export type SetHoldbackReleaseBody = components['schemas']['SetHoldbackReleaseSettingDto'];
export type CreateIncentiveBody = components['schemas']['CreateIncentiveDto'];
export type UpdateIncentiveBody = components['schemas']['UpdateIncentiveDto'];
