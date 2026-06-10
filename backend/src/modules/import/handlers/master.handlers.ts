/**
 * Commit handlers for the go-live MASTER imports — clients, products (+ optional inline billing rate),
 * reps, and HISTORICAL sales. Each runs inside the batch's `prisma.$transaction` (atomic, #8) and resolves
 * friendly codes → ids within the tx. Money is an exact decimal STRING → Prisma Decimal (never float, #1).
 *
 * HISTORICAL sales (DOC of the §17 confirmed rule): inserted `status='historical'` — reference-only. They
 * NEVER enter the pay pipeline (snapshots stay NULL, `counts_toward_tally=false`), and the only financial
 * figure stored is `sale_items.historical_billed_amount` (a billing-stream reference, not commission, #3).
 */
import { Prisma } from '@prisma/client';
import { DomainError } from '../../../common/errors/domain-error';
import { dateOnly } from '../../../common/effective-dating';
import { saleCodeBase, withSuffix } from '../../sales/sale-id.logic';
import { normCode } from '../clean.logic';
import { RawRow } from '../mapping.logic';

const text = (row: RawRow, key: string): string | null => {
  const v = row[key];
  return v === undefined || v === null || v === '' ? null : String(v);
};
const market = (v: unknown): 'CA' | 'US' => (String(v ?? '').toUpperCase() === 'US' ? 'US' : 'CA');
const bool = (v: unknown): boolean => /^(true|yes|y|1)$/i.test(String(v ?? '').trim());

// ── Clients (upsert by code) ──────────────────────────────────────────────────────
export async function applyClient(tx: Prisma.TransactionClient, mapped: RawRow): Promise<string> {
  const code = normCode(mapped.client_code)!;
  const data = { name: String(mapped.name), market: market(mapped.market), supplies_mpu_id: bool(mapped.supplies_mpu_id) };
  const existing = await tx.client.findUnique({ where: { client_code: code }, select: { id: true } });
  if (existing) {
    await tx.client.update({ where: { id: existing.id }, data });
    return existing.id;
  }
  const created = await tx.client.create({ data: { client_code: code, is_active: true, ...data } });
  return created.id;
}

// ── Products (+ optional inline CLIENT billing rate) ──────────────────────────────
export async function applyProduct(tx: Prisma.TransactionClient, mapped: RawRow, createdBy: string): Promise<string> {
  const code = normCode(mapped.client_code)!;
  const client = await tx.client.findUnique({ where: { client_code: code }, select: { id: true } });
  if (!client) throw new DomainError('IMPORT_CLIENT_NOT_FOUND', `client ${code} not found`);
  const product = await tx.product.create({
    data: { client_id: client.id, name: String(mapped.name), product_type: String(mapped.product_type), is_active: true },
  });
  const amount = text(mapped, 'billing_amount');
  if (amount) {
    await tx.clientBillingRate.create({
      data: {
        client_id: client.id,
        product_id: product.id,
        rate_kind: 'product',
        amount, // decimal string → Prisma Decimal (#1)
        effective_from: dateOnly(String(mapped.effective_from)),
        effective_to: null,
        created_by: createdBy,
      },
    });
  }
  return product.id;
}

// ── Reps (created; rep_code never reused, #11 — the classifier rejects an existing code) ──
export async function applyRep(tx: Prisma.TransactionClient, mapped: RawRow, importerUserId: string): Promise<string> {
  const code = normCode(mapped.rep_code)!;
  const rep = await tx.rep.create({
    data: {
      rep_code: code,
      full_name: String(mapped.full_name),
      hire_date: dateOnly(String(mapped.hire_date)),
      // The importing admin is the default field manager; reassign in HRM after go-live.
      field_manager_id: importerUserId,
      status: text(mapped, 'status') === 'terminated' ? 'terminated' : 'active',
    },
  });
  return rep.id;
}

// ── Historical sales (reference-only — NEVER paid; business aggregation only) ──────
export async function applyHistoricalSale(tx: Prisma.TransactionClient, mapped: RawRow, batchId: string): Promise<string> {
  const clientCode = normCode(mapped.client_code)!;
  const client = await tx.client.findUnique({ where: { client_code: clientCode }, select: { id: true, client_code: true } });
  if (!client) throw new DomainError('IMPORT_CLIENT_NOT_FOUND', `client ${clientCode} not found`);
  const repCode = normCode(mapped.rep_code)!;
  const rep = await tx.rep.findUnique({ where: { rep_code: repCode }, select: { id: true } });
  if (!rep) throw new DomainError('IMPORT_REP_NOT_FOUND', `rep ${repCode} not found`);
  const productType = String(mapped.product_type);
  const product = await tx.product.findFirst({
    where: { client_id: client.id, product_type: productType, is_active: true },
    select: { id: true },
  });
  if (!product) throw new DomainError('IMPORT_PRODUCT_NOT_FOUND', `no ${productType} product for client ${clientCode}`);

  const saleDate = String(mapped.sale_date);
  const mpuId = text(mapped, 'mpu_id');
  const base = saleCodeBase({ saleDate, clientCode: client.client_code, mpuId });
  const existingCount = await tx.sale.count({ where: { sale_code: { startsWith: base } } });
  const sale = await tx.sale.create({
    data: {
      sale_code: withSuffix(base, existingCount),
      sale_date: dateOnly(saleDate),
      activation_date: mapped.activation_date ? dateOnly(String(mapped.activation_date)) : null,
      rep_id: rep.id,
      client_id: client.id,
      customer_name: text(mapped, 'customer_name') ?? 'Migrated',
      street: '—',
      city: '—',
      province_state: '—',
      postal_code: '—',
      mpu_id: mpuId,
      is_greenfield: bool(mapped.is_greenfield),
      status: 'historical', // reference-only — never validated/paid (#2/#5 preserved: engine never sees it)
      import_batch_id: batchId,
      sale_items: {
        create: [
          {
            product_id: product.id,
            product_type: productType, // snapshot
            counts_toward_tally: false, // historical never counts toward a tier tally (#5/#9)
            // commission snapshots stay NULL — historical is NOT a commission record (#2)
            historical_billed_amount: String(mapped.billed_amount), // billing-stream reference (#3)
            item_status: 'active',
          },
        ],
      },
    },
  });
  return sale.id;
}
