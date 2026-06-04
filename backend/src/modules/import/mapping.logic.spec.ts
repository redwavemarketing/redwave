import { applyMapping } from './mapping.logic';

describe('applyMapping (pure field mapping) — IMP-002', () => {
  it('identity when there is no mapping', () => {
    expect(applyMapping({ a: 1, b: 2 }, null)).toEqual({ a: 1, b: 2 });
    expect(applyMapping({ a: 1 }, {})).toEqual({ a: 1 });
  });

  it('renames source columns to system fields per mapping_json', () => {
    const raw = { 'MPU #': 'X9', Bal: '100.00', Other: 'ignored' };
    const mapping = { mpu_id: 'MPU #', amount_held: 'Bal' };
    expect(applyMapping(raw, mapping)).toEqual({ mpu_id: 'X9', amount_held: '100.00' });
  });

  it('maps a missing source column to undefined (surfaced as a validation error downstream)', () => {
    expect(applyMapping({ a: 1 }, { mpu_id: 'MPU #' })).toEqual({ mpu_id: undefined });
  });
});
