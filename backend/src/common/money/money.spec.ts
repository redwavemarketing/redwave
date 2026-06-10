import { Decimal } from 'decimal.js';
import { CURRENCY, formatMoney, roundMoneyHalfUp, sumMoney } from './money';

describe('central money policy — 2dp HALF_UP, CAD (BRD §8.2)', () => {
  it('rounds HALF_UP to 2 dp', () => {
    expect(roundMoneyHalfUp('1.005').toString()).toBe('1.01'); // .005 rounds up
    expect(roundMoneyHalfUp('1.004').toString()).toBe('1');
    expect(roundMoneyHalfUp('2.675').toString()).toBe('2.68');
    expect(roundMoneyHalfUp(new Decimal('10.125')).toString()).toBe('10.13');
  });

  it('formatMoney always yields a fixed 2-dp string', () => {
    expect(formatMoney('1234.5')).toBe('1234.50');
    expect(formatMoney('0')).toBe('0.00');
    expect(formatMoney('1234.567')).toBe('1234.57'); // HALF_UP
    expect(formatMoney(new Decimal('-0.005'))).toBe('-0.01');
  });

  it('sumMoney is exact (no float drift) and empty → 0', () => {
    expect(sumMoney([]).toString()).toBe('0');
    // 0.1 + 0.2 would drift in float; exact decimal gives 0.30
    expect(formatMoney(sumMoney(['0.1', '0.2']))).toBe('0.30');
    expect(formatMoney(sumMoney(['50.00', '40.00', '0.01']))).toBe('90.01');
  });

  it('currency is CAD (single-currency)', () => {
    expect(CURRENCY).toBe('CAD');
  });
});
