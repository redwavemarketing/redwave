import { ProductType } from '@prisma/client';
import { countsTowardTally } from './sale-item.logic';

describe('countsTowardTally (§17.2)', () => {
  it('non-greenfield internet counts', () => {
    expect(countsTowardTally(ProductType.internet, false)).toBe(true);
  });
  it('greenfield-flagged internet does NOT count', () => {
    expect(countsTowardTally(ProductType.internet, true)).toBe(false);
  });
  it('greenfield_internet / tv / home_phone never count', () => {
    expect(countsTowardTally(ProductType.greenfield_internet, false)).toBe(false);
    expect(countsTowardTally(ProductType.tv, false)).toBe(false);
    expect(countsTowardTally(ProductType.home_phone, false)).toBe(false);
  });
});
