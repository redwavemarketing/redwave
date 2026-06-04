/**
 * km.ts — the INDICATIVE billable-km preview for the entry form (SRS EXP-004). Single trip deducts 30 km,
 * round trip 60 km, billable floored at 0, × $0.45. This is DISPLAY ONLY for UX — the server computes the
 * authoritative `computed_amount` (#1: never trust a client-computed money value). String→Number is used
 * only to render the preview, never to build the submitted payload. (130 round → $31.50; single → $45.00.)
 */
import type { TripType } from './expenses.types';

export const KM_DEDUCTION: Record<TripType, number> = { single: 30, round: 60 };
export const KM_RATE = 0.45;

export interface KmPreview {
  /** Whether total_km parsed to a usable number (drives whether to show the preview). */
  valid: boolean;
  billableKm: number;
  /** Indicative amount as a 2-decimal string (e.g. "31.50"); pass through money() to display. */
  amount: string;
}

export function kmPreview(totalKm: string | undefined, trip: TripType): KmPreview {
  const total = Number(totalKm);
  if (!totalKm || Number.isNaN(total) || total < 0) {
    return { valid: false, billableKm: 0, amount: '0.00' };
  }
  const billableKm = Math.max(0, total - KM_DEDUCTION[trip]);
  const amount = (Math.round(billableKm * KM_RATE * 100) / 100).toFixed(2);
  return { valid: true, billableKm, amount };
}
