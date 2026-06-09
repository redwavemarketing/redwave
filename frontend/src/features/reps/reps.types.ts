/**
 * Rep types — RESPONSE shapes ALIASED to the generated OpenAPI schema (the backend ships `@ApiResponse`
 * DTOs + the paginated /v1/reps envelope as of this batch). `payment_details` is NULLED unless the caller
 * has hrm:edit (server-side redaction). The list is server-paginated ({ data, meta }).
 */
import type { components } from '../../api/generated/schema';

export type Rep = components['schemas']['RepResponse'];
export type RepStatus = Rep['status'];

/** The paginated /v1/reps envelope ({ data, meta }). */
export type RepPage = components['schemas']['RepPageResponse'];

/** Server sort allowlist (mirrors reps.service findAll): rep_code/full_name/status/hire_date/created_at. */
export type RepSortKey = 'rep_code' | 'full_name' | 'status' | 'hire_date' | 'created_at';

/** UI status filter — adds 'all' over the two real statuses. */
export type RepStatusFilter = 'active' | 'terminated' | 'all';

export interface RepsFilters {
  status?: RepStatusFilter;
  fieldManagerId?: string;
  search?: string;
}

/** Server-side list params: filters + pagination/sort (page is 1-based). */
export interface RepsListParams extends RepsFilters {
  page: number;
  limit: number;
  sort?: string;
}
