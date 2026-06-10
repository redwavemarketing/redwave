import { assertPasswordPolicy, validatePassword } from './password-policy';
import { DomainError } from '../../common/errors/domain-error';

describe('validatePassword', () => {
  it('accepts a strong password', () => {
    expect(validatePassword('Redwave1')).toEqual([]);
  });
  it('flags the unmet requirements', () => {
    expect(validatePassword('short')).toContain('be at least 8 characters');
    expect(validatePassword('lowercase1')).toContain('include an uppercase letter');
    expect(validatePassword('UPPERCASE1')).toContain('include a lowercase letter');
    expect(validatePassword('NoDigitsHere')).toContain('include a number');
  });
});

describe('assertPasswordPolicy', () => {
  it('throws a DomainError (→422) for a weak password', () => {
    expect(() => assertPasswordPolicy('weak')).toThrow(DomainError);
  });
  it('does not throw for a strong password', () => {
    expect(() => assertPasswordPolicy('Redwave1')).not.toThrow();
  });
});
