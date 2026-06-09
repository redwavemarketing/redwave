/**
 * Products feature types — the CROSS-CLIENT product list (GET /v1/products). Aliased to the generated
 * schema. Reuses the clients-domain ProductFormModal/mutations for edit + soft-deactivate (a product is
 * always client-scoped; this screen finds + manages them across clients). Touches ONLY /v1/products* /
 * /v1/clients (names) — never commission (#3).
 */
import type { components } from '../../api/generated/schema';

export type Product = components['schemas']['ProductResponse'];
export type ProductPage = components['schemas']['ProductPageResponse'];
export type ProductType = components['schemas']['ProductResponse']['product_type'];
export type ProductStatusFilter = 'active' | 'inactive' | 'all';

export interface ProductsFilters {
  client_id?: string;
  product_type?: ProductType;
  status?: ProductStatusFilter;
  search?: string;
}

/** Server-side list params: filters + pagination/sort (page is 1-based). */
export interface ProductsListParams extends ProductsFilters {
  page: number;
  limit: number;
  sort?: string;
}

export type ProductSortKey = 'name' | 'product_type' | 'is_active' | 'created_at';
