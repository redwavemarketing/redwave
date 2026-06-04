/**
 * Shared pure effective-dated config helpers — no I/O, deterministic, fully unit-testable.
 *
 * A "scope" (e.g. a billing-rate scope, a flat-rate product_type, a tier-schedule stream) has at most
 * one row "in force" on any date. Adding a future-dated row supersedes a pending one and bounds the
 * current one; closed periods are never altered. Reused by Clients & Products and Commission Config.
 * — CLAUDE §3 #10, SRS CLNT-004 / COMM-006
 *
 * Dates are handled as UTC date-only (midnight Z) so comparisons never drift by timezone.
 */
export type RateStatus = 'past' | 'current' | 'pending';

export interface RateRow {
  id: string;
  effective_from: Date;
  effective_to: Date | null;
}

/** Parse a 'YYYY-MM-DD' string to a UTC midnight Date (date-only). */
export function dateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

/** `now` reduced to a UTC date-only Date. */
export function toUtcDateOnly(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/** The day before `date` (UTC date-only). */
export function previousDay(date: Date): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() - 1);
  return result;
}

/** Status of a row relative to `today`: ended → past; not yet started → pending; else current. */
export function deriveStatus(row: RateRow, today: Date): RateStatus {
  if (row.effective_to !== null && row.effective_to.getTime() < today.getTime()) {
    return 'past';
  }
  if (row.effective_from.getTime() > today.getTime()) {
    return 'pending';
  }
  return 'current';
}

/**
 * The row in force on `date` for a single scope: the row with the latest effective_from ≤ date
 * whose effective_to is null or ≥ date. Returns null if none applies. — CLAUDE #10
 */
export function selectEffectiveRate<T extends RateRow>(scopeRows: T[], date: Date): T | null {
  const candidates = scopeRows.filter(
    (r) =>
      r.effective_from.getTime() <= date.getTime() &&
      (r.effective_to === null || r.effective_to.getTime() >= date.getTime()),
  );
  if (candidates.length === 0) {
    return null;
  }
  return candidates.reduce((latest, r) =>
    r.effective_from.getTime() > latest.effective_from.getTime() ? r : latest,
  );
}

export interface SupersessionPlan {
  /** Pending rows for the scope that the new row supersedes (deleted — they never took effect). */
  deletePendingIds: string[];
  /** The current active row to bound, so the new row takes over cleanly. Null if none/no overlap. */
  boundCurrent: { id: string; effectiveTo: Date } | null;
}

/**
 * Decide what changes when inserting a new row at `newEffectiveFrom` for ONE scope:
 *  • every existing PENDING row is superseded (deleted),
 *  • the current active row is bounded to newEffectiveFrom − 1 day (only if it would overlap),
 *  • past/closed rows are never touched.
 * — SRS CLNT-004 / COMM-006, CLAUDE #10
 */
export function planSupersession(
  existingScopeRows: RateRow[],
  newEffectiveFrom: Date,
  today: Date,
): SupersessionPlan {
  const deletePendingIds: string[] = [];
  let boundCurrent: { id: string; effectiveTo: Date } | null = null;
  const newBound = previousDay(newEffectiveFrom);

  for (const row of existingScopeRows) {
    const status = deriveStatus(row, today);
    if (status === 'pending') {
      deletePendingIds.push(row.id);
    } else if (status === 'current') {
      const overlaps =
        row.effective_to === null || row.effective_to.getTime() >= newEffectiveFrom.getTime();
      if (overlaps) {
        boundCurrent = { id: row.id, effectiveTo: newBound };
      }
    }
    // past → untouched
  }

  return { deletePendingIds, boundCurrent };
}
