import { saleCodeBase, withSuffix } from './sale-id.logic';

describe('sale-id.logic (SALE-002/003)', () => {
  describe('saleCodeBase', () => {
    it('composes sale_date + MPU + client when an MPU ID is present', () => {
      expect(saleCodeBase({ saleDate: '2026-01-10', clientCode: 'VF', mpuId: 'MPU123' })).toBe(
        '2026-01-10-MPU123-VF',
      );
    });

    it('composes WITHOUT the MPU when it is absent (null / undefined / blank)', () => {
      expect(saleCodeBase({ saleDate: '2026-01-10', clientCode: 'RF', mpuId: null })).toBe(
        '2026-01-10-RF',
      );
      expect(saleCodeBase({ saleDate: '2026-01-10', clientCode: 'RF' })).toBe('2026-01-10-RF');
      expect(saleCodeBase({ saleDate: '2026-01-10', clientCode: 'RF', mpuId: '  ' })).toBe(
        '2026-01-10-RF',
      );
    });
  });

  describe('withSuffix (duplicates never blocked — just suffixed)', () => {
    const base = '2026-01-10-MPU123-VF';
    it('first sale for a base keeps the base', () => {
      expect(withSuffix(base, 0)).toBe(base);
    });
    it('the Nth duplicate becomes base-N (1st dup → -1, 2nd → -2)', () => {
      expect(withSuffix(base, 1)).toBe(`${base}-1`);
      expect(withSuffix(base, 2)).toBe(`${base}-2`);
    });
  });
});
