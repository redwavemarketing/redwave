/**
 * Pure validation of a tier-bracket set — no I/O, deterministic.
 *
 * Guards that a submitted tier schedule maps EVERY possible gross internet tally to exactly one tier
 * (no gaps, no overlaps), so the engine's tier selection is always well-defined. The engine — not
 * this module — performs tier determination at runtime (#5); this only validates the stored schedule.
 * — SRS COMM-001
 */
export interface TierBracketInput {
  tier_number: number;
  min_count: number;
  max_count: number | null; // null = open-ended top bracket (e.g. 36+)
}

/**
 * Throws an Error (callers translate to 422) if the brackets are not a valid contiguous schedule:
 *  • at least one bracket; first (lowest) starts at 0;
 *  • sorted by min_count, each min_count === previous max_count + 1 (contiguous, no gaps/overlaps);
 *  • exactly one open bracket (max_count null) and it is the last (highest tally);
 *  • every closed bracket has max_count >= min_count.
 */
export function validateTierBrackets(brackets: TierBracketInput[]): void {
  if (brackets.length === 0) {
    throw new Error('a tier schedule must have at least one bracket');
  }

  const openBrackets = brackets.filter((b) => b.max_count === null);
  if (openBrackets.length !== 1) {
    throw new Error('a tier schedule must have exactly one open-ended (max_count=null) bracket');
  }

  const sorted = [...brackets].sort((a, b) => a.min_count - b.min_count);

  if (sorted[0].min_count !== 0) {
    throw new Error('the lowest tier bracket must start at min_count 0');
  }
  // The open bracket must be the highest (last after sorting by min_count).
  if (sorted[sorted.length - 1].max_count !== null) {
    throw new Error('the open-ended bracket must be the highest (largest min_count)');
  }

  for (let i = 0; i < sorted.length; i += 1) {
    const bracket = sorted[i];
    if (bracket.max_count !== null && bracket.max_count < bracket.min_count) {
      throw new Error(`bracket ${bracket.tier_number}: max_count must be >= min_count`);
    }
    if (i > 0) {
      const prev = sorted[i - 1];
      // prev is closed here (only the last may be open); enforce contiguity.
      if (prev.max_count === null || bracket.min_count !== prev.max_count + 1) {
        throw new Error(
          'tier brackets must be contiguous (each min_count = previous max_count + 1)',
        );
      }
    }
  }
}
