/**
 * Back-dated billing-rate commit handler (master_migration + billing_rates). Writes `client_billing_rate`
 * rows DIRECTLY via the transaction — the sanctioned #10 migration path, which deliberately bypasses the
 * Clients service's back-date rejection (422). Resolves friendly client_code/product_name → ids within the
 * tx. Migration rates are inserted VERBATIM (the import is the authoritative historical record). Money is an
 * exact decimal string → Prisma Decimal (#1). — SRS §15, CLAUDE §3 #10
 */
import { Prisma, RateKind } from '@prisma/client';
import { DomainError } from '../../../common/errors/domain-error';
import { dateOnly } from '../../../common/effective-dating';
import { normCode } from '../clean.logic';
import { RawRow } from '../mapping.logic';

export async function applyBillingRate(
  tx: Prisma.TransactionClient,
  mapped: RawRow,
  createdBy: string,
): Promise<string> {
  const code = normCode(mapped.client_code)!;
  const client = await tx.client.findUnique({ where: { client_code: code }, select: { id: true } });
  if (!client) throw new DomainError('IMPORT_CLIENT_NOT_FOUND', `client ${code} not found`);

  const rateKind = String(mapped.rate_kind) as RateKind;
  let productId: string | null = null;
  if (rateKind === 'product') {
    const name = mapped.product_name ? String(mapped.product_name) : null;
    const product = name
      ? await tx.product.findFirst({ where: { client_id: client.id, name }, select: { id: true } })
      : null;
    if (!product) throw new DomainError('IMPORT_PRODUCT_NOT_FOUND', `product "${name}" not found for client ${code}`);
    productId = product.id;
  }

  const row = await tx.clientBillingRate.create({
    data: {
      client_id: client.id,
      product_id: productId,
      rate_kind: rateKind,
      amount: String(mapped.amount), // decimal string → Prisma Decimal (never float, #1)
      effective_from: dateOnly(String(mapped.effective_from)), // back-dated allowed here (#10)
      effective_to: mapped.effective_to ? dateOnly(String(mapped.effective_to)) : null,
      created_by: createdBy,
    },
  });
  return row.id;
}
