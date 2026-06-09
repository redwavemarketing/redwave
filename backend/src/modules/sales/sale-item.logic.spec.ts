import { countsTowardTally } from './sale-item.logic';

describe('countsTowardTally (§17.2)', () => {
  it('non-greenfield internet counts', () => {
    expect(countsTowardTally('internet', false)).toBe(true);
  });
  it('greenfield-flagged internet does NOT count', () => {
    expect(countsTowardTally('internet', true)).toBe(false);
  });
  it('greenfield_internet / tv / home_phone / new add-ons never count', () => {
    expect(countsTowardTally('greenfield_internet', false)).toBe(false);
    expect(countsTowardTally('tv', false)).toBe(false);
    expect(countsTowardTally('home_phone', false)).toBe(false);
    expect(countsTowardTally('satellite', false)).toBe(false); // a new standard add-on
  });
});
