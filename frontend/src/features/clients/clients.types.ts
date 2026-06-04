/**
 * Clients & Products types — RESPONSE shapes hand-written (the backend declares no response schema, so
 * generated types are `never`). Mirrors `backend/src/modules/clients/`. REQUEST bodies are typed from the
 * generated schema (re-exported). Money/amounts are decimal STRINGS. This feature touches ONLY /v1/clients*
 * — it NEVER reads `commission_*` (CLAUDE #3: the two rate streams never mix). Keep in sync with the backend.
 */
import type { components } from '../../api/generated/schema';
// Effective-dating status comes from the shared foundation component (used by Clients + Commission).
import type { RateStatus } from '../../components/ui';

export type { RateStatus };
export type Market = 'CA' | 'US';
export type ProductType = 'internet' | 'greenfield_internet' | 'tv' | 'home_phone';
export type RateKind = 'product' | 'tv_addon' | 'hp_addon' | 'bundle_bonus' | 'spiff';
export type StatusFilter = 'active' | 'inactive' | 'all';

export interface Client {
  id: string;
  client_code: string;
  name: string;
  market: Market;
  supplies_mpu_id: boolean;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  client_id: string;
  name: string;
  product_type: ProductType;
  is_active: boolean;
  created_at: string;
}

/** A client billing rate (what we charge the partner). The server annotates each row with `status`. */
export interface BillingRate {
  id: string;
  client_id: string;
  product_id: string | null;
  rate_kind: RateKind;
  amount: string;
  effective_from: string;
  effective_to: string | null;
  status: RateStatus;
}

export interface BillingRateFilters {
  effectiveOn?: string;
  productId?: string;
  rateKind?: RateKind;
  status?: RateStatus | 'all';
}

// Request bodies — typed from the generated schema.
export type CreateClientBody = components['schemas']['CreateClientDto'];
export type UpdateClientBody = components['schemas']['UpdateClientDto'];
export type CreateProductBody = components['schemas']['CreateProductDto'];
export type UpdateProductBody = components['schemas']['UpdateProductDto'];
export type CreateBillingRateBody = components['schemas']['CreateBillingRateDto'];
