/**
 * Pure per-item tally-eligibility rule. — CLAUDE §3 #9, SRS §17.2
 *
 * Only NON-greenfield internet counts toward the tier tally. Greenfield internet, TV, and home
 * phone never count. This module records the flag; Pay Run consumes it at period close (it maps a
 * greenfield internet activation to the flat $100 rate when building engine inputs).
 */
// product_type is a catalogue key (string). Only the tiered type 'internet' can count; greenfield
// internet, TV, home phone, and any new standard add-on never count. — CLAUDE §3 #5/#9
export function countsTowardTally(productType: string, isGreenfield: boolean): boolean {
  return productType === 'internet' && !isGreenfield;
}
