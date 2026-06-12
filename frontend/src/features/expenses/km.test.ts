import { describe, expect, it } from 'vitest';
import { kmPreview, routeCoords, TRIP_OPTIONS } from './km';

describe('routeCoords — ROUND trips measure the closed loop (mirrors the server rule, SRS EXP-004)', () => {
  const A = { lat: 49.8951, lng: -97.1384 };
  const B = { lat: 49.8339, lng: -97.1526 };
  const C = { lat: 49.9, lng: -97.2 };

  it('round: appends the first stop as the final destination (A,B → A,B,A)', () => {
    expect(routeCoords([A, B], 'round')).toEqual([A, B, A]);
    expect(routeCoords([A, B, C], 'round')).toEqual([A, B, C, A]);
  });

  it('single: the route is exactly the stops as entered', () => {
    expect(routeCoords([A, B], 'single')).toEqual([A, B]);
    expect(routeCoords([A, B, C], 'single')).toEqual([A, B, C]);
  });

  it('EDGE: first stop already re-entered as the literal last stop → no double-append', () => {
    expect(routeCoords([A, B, { ...A }], 'round')).toEqual([A, B, A]);
  });

  it('fewer than two picked stops → unchanged (no loop to close yet)', () => {
    expect(routeCoords([A], 'round')).toEqual([A]);
    expect(routeCoords([], 'round')).toEqual([]);
  });
});

describe('trip-type labels — the measurement rule is self-explanatory', () => {
  it('round trip says it returns to the first stop and keeps the −60 km deduction', () => {
    const round = TRIP_OPTIONS.find((o) => o.value === 'round')!;
    expect(round.label).toContain('returns to first stop');
    expect(round.label).toContain('−60 km');
  });

  it('single trip stays one-way with the −30 km deduction', () => {
    const single = TRIP_OPTIONS.find((o) => o.value === 'single')!;
    expect(single.label).toContain('one way');
    expect(single.label).toContain('−30 km');
  });
});

describe('kmPreview — the indicative preview math is UNCHANGED (deduction only; SRS §11.2)', () => {
  it('130 km round → 70 billable → $31.50; 130 single → 100 → $45.00 (the SRS worked example)', () => {
    expect(kmPreview('130', 'round')).toEqual({ valid: true, billableKm: 70, amount: '31.50' });
    expect(kmPreview('130', 'single')).toEqual({ valid: true, billableKm: 100, amount: '45.00' });
  });

  it('short trips floor at 0 (never negative)', () => {
    expect(kmPreview('20', 'round').billableKm).toBe(0);
  });
});
