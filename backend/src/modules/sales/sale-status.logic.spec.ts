import { ConflictException } from '@nestjs/common';
import { assertTransition, canTransition } from './sale-status.logic';

describe('sale-status.logic (§16 state machine)', () => {
  it('allows the valid transitions', () => {
    expect(canTransition('entered', 'validated')).toBe(true);
    expect(canTransition('entered', 'deleted')).toBe(true);
    expect(canTransition('validated', 'in_pay_run')).toBe(true);
    expect(canTransition('validated', 'deleted')).toBe(true);
    expect(canTransition('in_pay_run', 'paid')).toBe(true);
    expect(canTransition('paid', 'clawed_back')).toBe(true);
  });

  it('rejects invalid transitions', () => {
    expect(canTransition('entered', 'paid')).toBe(false); // skips validation/pay run
    expect(canTransition('validated', 'entered')).toBe(false); // no going back
    expect(canTransition('paid', 'deleted')).toBe(false); // cannot delete a paid sale
    expect(canTransition('in_pay_run', 'deleted')).toBe(false);
    expect(canTransition('clawed_back', 'paid')).toBe(false); // terminal
    expect(canTransition('deleted', 'entered')).toBe(false); // terminal
  });

  it('assertTransition throws 409 on an invalid move and is silent on a valid one', () => {
    expect(() => assertTransition('entered', 'paid')).toThrow(ConflictException);
    expect(() => assertTransition('entered', 'validated')).not.toThrow();
  });
});
