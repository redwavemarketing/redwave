/**
 * Canonical timezone — America/Winnipeg (CLAUDE §11).
 *
 * EVERY date-boundary decision (which pay period a sale_date falls in, "today" defaults, period start/end)
 * is made against the Winnipeg calendar day — NOT UTC and NOT the server locale — so a late-night Winnipeg
 * sale never rolls into the next day/period. All dates are stored & rendered as 'YYYY-MM-DD' representing
 * the WINNIPEG day, and parsed UTC-midnight on both sides for comparison (common/effective-dating#dateOnly),
 * so resolvePayPeriod / selectEffectiveRate stay timezone-consistent. Intl handles DST (CDT/CST) for us.
 */
import { dateOnly } from './effective-dating';

export const WINNIPEG_TZ = 'America/Winnipeg';

// en-CA + an explicit timeZone yields the Winnipeg calendar Y/M/D for any instant. We assemble from parts
// (instead of trusting a locale's separator) so the output is always exactly 'YYYY-MM-DD'.
const WINNIPEG_PARTS = new Intl.DateTimeFormat('en-CA', {
  timeZone: WINNIPEG_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** The current date in America/Winnipeg as 'YYYY-MM-DD' — the canonical "today". */
export function todayInWinnipeg(now: Date = new Date()): string {
  const parts = WINNIPEG_PARTS.formatToParts(now);
  const get = (type: 'year' | 'month' | 'day'): string =>
    parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** `now` reduced to the Winnipeg calendar day, as a UTC-midnight Date (for date-only comparisons). */
export function winnipegDateOnly(now: Date = new Date()): Date {
  return dateOnly(todayInWinnipeg(now));
}
