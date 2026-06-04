/**
 * Pure per-item tally-eligibility rule. — CLAUDE §3 #9, SRS §17.2
 *
 * Only NON-greenfield internet counts toward the tier tally. Greenfield internet, TV, and home
 * phone never count. This module records the flag; Pay Run consumes it at period close (it maps a
 * greenfield internet activation to the flat $100 rate when building engine inputs).
 */
import { ProductType } from '@prisma/client';

export function countsTowardTally(productType: ProductType, isGreenfield: boolean): boolean {
  return productType === ProductType.internet && !isGreenfield;
}
