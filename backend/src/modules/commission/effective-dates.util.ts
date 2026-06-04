/**
 * Shared validation for effective-dated commission config writes. Back-dating is rejected to protect
 * closed periods (a change applies prospectively only). — SRS COMM-006, CLAUDE §3 #10
 */
import { UnprocessableEntityException } from '@nestjs/common';
import { dateOnly, toUtcDateOnly } from '../../common/effective-dating';

export function parseEffectiveWindow(
  effectiveFrom: string,
  effectiveTo?: string,
): { from: Date; to: Date | null; today: Date } {
  const from = dateOnly(effectiveFrom);
  const to = effectiveTo ? dateOnly(effectiveTo) : null;
  const today = toUtcDateOnly(new Date());
  if (from.getTime() < today.getTime()) {
    throw new UnprocessableEntityException('effective_from cannot be in the past');
  }
  if (to && to.getTime() < from.getTime()) {
    throw new UnprocessableEntityException('effective_to cannot be before effective_from');
  }
  return { from, to, today };
}
