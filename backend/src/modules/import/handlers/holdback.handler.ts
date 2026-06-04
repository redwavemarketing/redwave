/**
 * Opening-holdback commit handler (balance_migration + holdback). Loads each rep's outstanding 30%
 * as a `holdback_ledger` opening entry, scheduled to release in the normal way (release_status
 * 'scheduled', target resolved by the SAME pure rule Pay Run uses). The origin period is a CLOSED
 * pre-go-live period Pay Run never re-finalizes, so its per-origin freeze-once guard never recreates
 * the hold → no double-count (validated at stage: open origins are rejected). Money is exact decimal
 * string → Prisma Decimal (#1). — SRS §15 (IMP-007)
 */
import { Prisma } from '@prisma/client';
import { RawRow } from '../mapping.logic';
import { ReleasePeriod, resolveScheduledReleasePeriod } from '../../payrun/holdback-release.logic';

export async function applyHoldback(
  tx: Prisma.TransactionClient,
  mapped: RawRow,
  ctx: { originPeriod: ReleasePeriod; allPeriods: ReleasePeriod[]; releaseRule: string },
): Promise<string> {
  const scheduled = resolveScheduledReleasePeriod(ctx.originPeriod, ctx.allPeriods, ctx.releaseRule);
  const row = await tx.holdbackLedger.create({
    data: {
      rep_id: String(mapped.rep_id),
      origin_pay_period_id: String(mapped.origin_pay_period_id),
      amount_held: String(mapped.amount_held), // decimal string → Prisma Decimal (#1)
      scheduled_release_period_id: scheduled?.id ?? null,
      release_status: 'scheduled',
    },
  });
  return row.id;
}
