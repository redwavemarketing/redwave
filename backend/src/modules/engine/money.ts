/**
 * Money helpers for the Commission Engine — thin wrappers over decimal.js.
 *
 * All money is exact decimal, never float (CLAUDE §3 #1). Rounding to cents uses ROUND_HALF_UP
 * and is passed explicitly per call — we never mutate decimal.js global config, so the engine
 * stays pure and deterministic regardless of surrounding code.
 */
import { Decimal } from 'decimal.js';

/** Construct a Decimal from a string/number/Decimal. Prefer string literals for money. */
export const d = (value: Decimal.Value): Decimal => new Decimal(value);

export const ZERO = new Decimal(0);

/** Sum a list of Decimals (empty → 0). */
export const sum = (values: Decimal[]): Decimal => values.reduce((acc, v) => acc.plus(v), ZERO);

/** Round to 2 decimal places, half-up — the cent-rounding rule used at the 70/30 split. */
export const roundMoneyHalfUp = (value: Decimal): Decimal =>
  value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
