import { describe, expect, it } from 'vitest';
import { businessWeek } from './businessWeek';

describe('businessWeek (Monday–Sunday)', () => {
  it('a mid-week date → its Monday..Sunday', () => {
    // 2026-07-08 is a Wednesday → week Mon 2026-07-06 .. Sun 2026-07-12
    expect(businessWeek('2026-07-08')).toEqual({ week_start: '2026-07-06', week_end: '2026-07-12' });
  });

  it('a Monday maps to itself', () => {
    expect(businessWeek('2026-07-06')).toEqual({ week_start: '2026-07-06', week_end: '2026-07-12' });
  });

  it('a Sunday belongs to the week that STARTED the prior Monday', () => {
    // 2026-07-12 is a Sunday → still week Mon 2026-07-06 .. Sun 2026-07-12
    expect(businessWeek('2026-07-12')).toEqual({ week_start: '2026-07-06', week_end: '2026-07-12' });
  });
});
