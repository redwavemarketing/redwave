/**
 * Tier-progress display — PURE & deterministic (no I/O, NO money). Given the effective tier-schedule
 * brackets (count boundaries only) and a rep's gross internet activation count, report the current
 * tier and how many more activations reach the next bracket. This is a COUNT→bracket lookup for the
 * rep dashboard (RPT-001) — it reads zero rates and recomputes zero commission (#5 untouched). The
 * ENGINE, not this, determines pay-affecting tiers. — SRS RPT-001, CLAUDE §3 #5
 */
export interface TierBracket {
  tier_number: number;
  min_count: number;
  max_count: number | null; // null = open-ended top bracket
}

export interface TierProgress {
  tier_number: number;
  count: number;
  next_tier_min: number | null; // activation count where the next bracket begins (null if top)
  to_next: number | null; // activations remaining to reach it (null if already top)
}

/** Classify `count` into its bracket and compute the distance to the next-higher count bracket. */
export function countToTier(brackets: TierBracket[], count: number): TierProgress | null {
  if (brackets.length === 0) {
    return null;
  }
  const sorted = [...brackets].sort((a, b) => a.min_count - b.min_count);
  const current =
    sorted.find((b) => count >= b.min_count && (b.max_count === null || count <= b.max_count)) ??
    sorted[sorted.length - 1];
  const next = sorted.find((b) => b.min_count > count) ?? null;
  return {
    tier_number: current.tier_number,
    count,
    next_tier_min: next?.min_count ?? null,
    to_next: next ? next.min_count - count : null,
  };
}
