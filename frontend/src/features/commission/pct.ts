/**
 * pct — exact percentage helpers for the holdback split (advance/holdback fractions 0..1). Uses INTEGER
 * basis points (×10000) so the "must total 100%" check never does float arithmetic on the values (#1).
 * The server is the real gate (Decimal sum === 1 → else 422); this just blocks an obviously-wrong submit
 * and shows a live total.
 */
const PCT = /^[01](\.\d{1,4})?$/;

export function isPctString(v: string): boolean {
  return PCT.test(v);
}

/** Parse a 0..1 decimal string ("0.7000") to integer basis points (7000), or null if malformed. */
export function toBasisPoints(v: string): number | null {
  if (!PCT.test(v)) return null;
  const [intPart, decRaw = ''] = v.split('.');
  const dec = (decRaw + '0000').slice(0, 4);
  return Number(intPart) * 10000 + Number(dec);
}

/** True when the two fractions total exactly 100% (10000 bp). */
export function totalsToHundred(advance: string, holdback: string): boolean {
  const a = toBasisPoints(advance);
  const h = toBasisPoints(holdback);
  return a !== null && h !== null && a + h === 10000;
}

/** Display a 0..1 fraction string as a percent label ("0.70" → "70%"). Display-only. */
export function pctLabel(v: string): string {
  const bp = toBasisPoints(v);
  if (bp === null) return '—';
  const whole = Math.floor(bp / 100);
  const frac = bp % 100;
  return frac === 0 ? `${whole}%` : `${whole}.${String(frac).padStart(2, '0')}%`;
}
