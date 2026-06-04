/** Compact products summary for a sale row/detail — distinct product-type labels (no extra fetch). */
import { productTypeLabel } from '../../../lib/format/productType';
import type { SaleItem } from '../sales.types';

export function ProductSummary({ items }: { items: SaleItem[] }) {
  const types = [...new Set(items.map((i) => i.product_type))];
  return <span>{types.map(productTypeLabel).join(', ') || '—'}</span>;
}
