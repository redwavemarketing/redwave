/**
 * Back-dated billing-rate commit handler (master_migration + clients). Writes `client_billing_rate`
 * rows DIRECTLY via the transaction — the sanctioned #10 migration path, which deliberately bypasses
 * the Clients service's back-date rejection (422). Migration rates are inserted VERBATIM (the import
 * is the authoritative historical record). Money is an exact decimal string → Prisma Decimal (#1).
 * — SRS §15, CLAUDE §3 #10
 */
import { Prisma, RateKind } from '@prisma/client';
import { RawRow } from '../mapping.logic';

const dateOnly = (value: string): Date => new Date(`${value}T00:00:00.000Z`);

export async function applyBillingRate(
  tx: Prisma.TransactionClient,
  mapped: RawRow,
  createdBy: string,
): Promise<string> {
  const productId = mapped.product_id ? String(mapped.product_id) : null;
  const row = await tx.clientBillingRate.create({
    data: {
      client_id: String(mapped.client_id),
      product_id: productId,
      rate_kind: String(mapped.rate_kind) as RateKind,
      amount: String(mapped.amount), // decimal string → Prisma Decimal (never float, #1)
      effective_from: dateOnly(String(mapped.effective_from)), // back-dated allowed here (#10)
      effective_to: mapped.effective_to ? dateOnly(String(mapped.effective_to)) : null,
      created_by: createdBy,
    },
  });
  return row.id;
}
