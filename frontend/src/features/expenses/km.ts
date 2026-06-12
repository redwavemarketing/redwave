/**
 * km.ts — the INDICATIVE billable-km preview for the entry form (SRS EXP-004). Single trip deducts 30 km,
 * round trip 60 km, billable floored at 0, × $0.45. This is DISPLAY ONLY for UX — the server computes the
 * authoritative `computed_amount` (#1: never trust a client-computed money value). String→Number is used
 * only to render the preview, never to build the submitted payload. (130 round → $31.50; single → $45.00.)
 */
import type { TripType } from './expenses.types';

export const KM_DEDUCTION: Record<TripType, number> = { single: 30, round: 60 };
export const KM_RATE = 0.45;

// Labels make the MEASUREMENT rule self-explanatory: a round trip's distance includes the drive back to
// the first stop (appended automatically — the rep enters only the outbound stops). — SRS EXP-004
export const TRIP_OPTIONS = [
  { value: 'single', label: 'Single trip (one way · −30 km)' },
  { value: 'round', label: 'Round trip (returns to first stop · −60 km)' },
];

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

export interface RouteCoord {
  lat: number;
  lng: number;
}

/**
 * The coordinates the route is MEASURED over. A ROUND trip is a closed loop — the first stop is appended
 * as the final destination so the return drive is included (the rep enters only the outbound stops). If
 * the first stop was already re-entered as the literal last stop, nothing is appended (the return leg is
 * never double-counted). Mirrors the server's authoritative derivation (MapsService). — SRS EXP-004
 */
export function routeCoords<T extends RouteCoord>(coords: T[], trip: TripType): T[] {
  if (trip !== 'round' || coords.length < 2) return coords;
  const first = coords[0];
  const last = coords[coords.length - 1];
  if (first.lat === last.lat && first.lng === last.lng) return coords; // already closed
  return [...coords, first];
}
