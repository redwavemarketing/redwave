import { deriveFolderStatus } from './folder-status.logic';

describe('deriveFolderStatus (EXP-001a)', () => {
  it('empty folder → empty', () => {
    expect(deriveFolderStatus([])).toBe('empty');
  });

  it('any sent_back → needs_attention (highest priority)', () => {
    expect(deriveFolderStatus(['approved', 'sent_back', 'submitted'])).toBe('needs_attention');
    expect(deriveFolderStatus(['draft', 'sent_back'])).toBe('needs_attention');
  });

  it('any draft (no sent_back) → draft', () => {
    expect(deriveFolderStatus(['draft', 'submitted', 'approved'])).toBe('draft');
  });

  it('any submitted (no draft/sent_back) → pending, incl. partially approved', () => {
    expect(deriveFolderStatus(['submitted'])).toBe('pending');
    expect(deriveFolderStatus(['approved', 'submitted'])).toBe('pending');
  });

  it('all resolved with ≥1 approved → approved', () => {
    expect(deriveFolderStatus(['approved'])).toBe('approved');
    expect(deriveFolderStatus(['approved', 'approved', 'rejected'])).toBe('approved');
  });

  it('all rejected → rejected', () => {
    expect(deriveFolderStatus(['rejected', 'rejected'])).toBe('rejected');
  });
});
