/**
 * Clients & Products types — RESPONSE shapes ALIASED to the generated OpenAPI schema (the backend ships
 * `@ApiResponse` DTOs as of Batch A #2). Mirrors `backend/src/modules/clients/dto/client.response.ts`.
 * Money/amounts are decimal STRINGS. This feature touches ONLY /v1/clients* — it NEVER reads `commission_*`
 * (CLAUDE #3: the two rate streams never mix). REQUEST bodies are likewise typed from the generated schema.
 */
import type { components } from '../../api/generated/schema';
// Effective-dating status comes from the shared foundation component (used by Clients + Commission).
import type { RateStatus } from '../../components/ui';

export type { RateStatus };
// Enums derived from the contract.
export type Market = components['schemas']['ClientResponse']['market'];
export type ProductType = components['schemas']['ProductResponse']['product_type'];
export type RateKind = components['schemas']['BillingRateResponse']['rate_kind'];
export type StatusFilter = 'active' | 'inactive' | 'all';

export type Client = components['schemas']['ClientResponse'];

/** The paginated /v1/clients envelope ({ data, meta }) the server now returns (arch §5.1). */
export type ClientPage = components['schemas']['ClientPageResponse'];

export interface ClientsFilters {
  status?: StatusFilter;
  search?: string;
}

/** Server-side list params: filters + pagination/sort (page is 1-based). */
export interface ClientsListParams extends ClientsFilters {
  page: number;
  limit: number;
  sort?: string;
}

export type Product = components['schemas']['ProductResponse'];

/** A client billing rate (what we charge the partner). The server annotates each row with `status`. */
export type BillingRate = components['schemas']['BillingRateResponse'];

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
export type UpdateBillingRateBody = components['schemas']['UpdateBillingRateDto'];
/** A name/value custom field on a client (sent on create/edit; returned on the detail). */
export type ClientCustomFieldInput = components['schemas']['ClientCustomFieldInput'];
export type ClientCustomField = components['schemas']['ClientCustomFieldResponse'];
