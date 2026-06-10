/**
 * Password strength policy — PURE (no framework). `validatePassword` returns the unmet requirements;
 * `assertPasswordPolicy` throws a framework-free DomainError (→ 422 via the global filter) so it can be
 * reused by change-password / reset / set-password without coupling to Nest. — SRS AUTH-002 (policy)
 */
import { DomainError } from '../../common/errors/domain-error';

export interface PasswordPolicy {
  minLength: number;
  requireUpper: boolean;
  requireLower: boolean;
  requireDigit: boolean;
}

export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 8,
  requireUpper: true,
  requireLower: true,
  requireDigit: true,
};

/** Returns the list of unmet requirements (empty = the password is acceptable). */
export function validatePassword(password: string, policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY): string[] {
  const unmet: string[] = [];
  if (password.length < policy.minLength) unmet.push(`be at least ${policy.minLength} characters`);
  if (policy.requireUpper && !/[A-Z]/.test(password)) unmet.push('include an uppercase letter');
  if (policy.requireLower && !/[a-z]/.test(password)) unmet.push('include a lowercase letter');
  if (policy.requireDigit && !/[0-9]/.test(password)) unmet.push('include a number');
  return unmet;
}

/** Throw a 422 DomainError if the password does not meet the policy. */
export function assertPasswordPolicy(password: string, policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY): void {
  const unmet = validatePassword(password, policy);
  if (unmet.length > 0) {
    throw new DomainError('WEAK_PASSWORD', `Password must ${unmet.join(', ')}.`);
  }
}
