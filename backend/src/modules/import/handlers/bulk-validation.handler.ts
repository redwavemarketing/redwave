/**
 * Bulk-validation commit handler (client_report + sales). DRIVES the Sales module's exposed
 * `validateWithinTx` inside the import's transaction — it NEVER reimplements sale-state logic (#9).
 * The matched (or manually matched) `sale_id` is the row's `matched_entity_id`. — SRS SALE-007 / IMP-010
 */
import { Prisma } from '@prisma/client';
import { AuthUser } from '../../../common/rbac/auth-user.type';
import { SalesService } from '../../sales/sales.service';

export async function applyBulkValidation(
  tx: Prisma.TransactionClient,
  saleId: string,
  user: AuthUser,
  sales: SalesService,
): Promise<string> {
  // entered → validated, atomically within the batch transaction. Throws (rolls the batch back)
  // if the sale is not in 'entered' state (409) or not found.
  await sales.validateWithinTx(tx, saleId, {}, user);
  return saleId;
}
