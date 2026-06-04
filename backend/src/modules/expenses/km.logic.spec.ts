import { Decimal } from 'decimal.js';
import { computeKm, DEFAULT_RATE_PER_KM } from './km.logic';

describe('computeKm (pure km-allowance logic) — SRS §11.2', () => {
  it('round trip 130 km → 70 billable → $31.50 (worked example)', () => {
    const r = computeKm(new Decimal('130'), 'round');
    expect(r.deductionKm.toString()).toBe('60');
    expect(r.billableKm.toString()).toBe('70');
    expect(r.computedAmount.toFixed(2)).toBe('31.50');
  });

  it('single trip 130 km → 100 billable → $45.00 (worked example)', () => {
    const r = computeKm(new Decimal('130'), 'single');
    expect(r.deductionKm.toString()).toBe('30');
    expect(r.billableKm.toString()).toBe('100');
    expect(r.computedAmount.toFixed(2)).toBe('45.00');
  });

  it('floors billable distance at 0 when the trip is shorter than the deduction', () => {
    expect(computeKm(new Decimal('40'), 'round').billableKm.toString()).toBe('0');
    expect(computeKm(new Decimal('40'), 'round').computedAmount.toFixed(2)).toBe('0.00');
    expect(computeKm(new Decimal('10'), 'single').billableKm.toString()).toBe('0');
  });

  it('exactly at the deduction → 0 billable', () => {
    expect(computeKm(new Decimal('60'), 'round').computedAmount.toFixed(2)).toBe('0.00');
    expect(computeKm(new Decimal('30'), 'single').computedAmount.toFixed(2)).toBe('0.00');
  });

  it('uses the default rate of 0.450 $/km', () => {
    expect(DEFAULT_RATE_PER_KM.toString()).toBe('0.45');
    // 200 single → 170 billable × 0.45 = 76.50
    expect(computeKm(new Decimal('200'), 'single').computedAmount.toFixed(2)).toBe('76.50');
  });

  it('rounds half-up to cents and never mutates global decimal config', () => {
    // 31 single → 1 billable × 0.45 = 0.45
    expect(computeKm(new Decimal('31'), 'single').computedAmount.toFixed(2)).toBe('0.45');
    // custom rate exercising half-up: 61 round → 1 billable × 0.455 = 0.455 → 0.46
    expect(
      computeKm(new Decimal('61'), 'round', new Decimal('0.455')).computedAmount.toFixed(2),
    ).toBe('0.46');
    // decimal.js global precision untouched (sanity)
    expect(new Decimal('1').dividedBy('3').toString().length).toBeGreaterThan(5);
  });
});
