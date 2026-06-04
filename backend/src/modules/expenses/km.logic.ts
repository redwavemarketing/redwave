/**
 * Kilometre-allowance calculation — PURE & deterministic (no I/O, no Prisma, no NestJS).
 *
 * One mileage claim per day. A fixed personal-commute deduction is removed before paying:
 * a SINGLE trip deducts 30 km, a ROUND trip deducts 60 km. The remaining (billable) distance
 * is paid at a per-km rate, floored at 0 km (a short trip never produces a negative claim).
 *   billable = max(total_km − deduction, 0);  amount = round_half_up(billable × rate, 2)
 * — SRS EXP-004 / §11.2 (worked example: 130 km round → 70 billable → $31.50; single → 100 → $45.00).
 *
 * Money/distance are exact decimals (decimal.js), never floats (CLAUDE §3 #1). Rounding is
 * ROUND_HALF_UP passed explicitly per call — global decimal.js config is never mutated.
 */
import { Decimal } from 'decimal.js';

export type TripType = 'single' | 'round';

/** Fixed personal-commute deduction (km) removed before the trip is paid. — SRS §11.2 */
export const KM_DEDUCTION: Record<TripType, number> = { single: 30, round: 60 };

/** Default reimbursement rate ($/km). Constant for now — no rate-config table yet (deferred §12). */
export const DEFAULT_RATE_PER_KM = new Decimal('0.450');

export interface KmResult {
  deductionKm: Decimal;
  billableKm: Decimal;
  computedAmount: Decimal;
}

/**
 * Compute the deduction, billable distance, and payable amount for one day's mileage claim.
 * @param totalKm    the route's total driven distance (submitted; maps-route value).
 * @param tripType   'single' (−30 km) or 'round' (−60 km).
 * @param ratePerKm  $/km (defaults to {@link DEFAULT_RATE_PER_KM}).
 */
export function computeKm(
  totalKm: Decimal,
  tripType: TripType,
  ratePerKm: Decimal = DEFAULT_RATE_PER_KM,
): KmResult {
  const deductionKm = new Decimal(KM_DEDUCTION[tripType]);
  const billableKm = Decimal.max(totalKm.minus(deductionKm), 0); // floored at 0 — never negative
  const computedAmount = billableKm.times(ratePerKm).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  return { deductionKm, billableKm, computedAmount };
}
