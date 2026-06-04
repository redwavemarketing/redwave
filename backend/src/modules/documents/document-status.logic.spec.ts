import { SignatureStatus } from '@prisma/client';
import {
  deriveDocumentStatus,
  deriveRequestStatus,
  RequestForDerivation,
} from './document-status.logic';

const req = (status: RequestForDerivation['status'], signers: SignatureStatus[]): RequestForDerivation => ({
  status,
  signers,
});

describe('deriveRequestStatus — SRS DOC-005', () => {
  it('all pending → pending', () => {
    expect(deriveRequestStatus(['pending', 'pending'])).toBe('pending');
  });
  it('some signed, some pending → pending (request has no partially_signed state)', () => {
    expect(deriveRequestStatus(['signed', 'pending'])).toBe('pending');
  });
  it('all signed → completed', () => {
    expect(deriveRequestStatus(['signed', 'signed'])).toBe('completed');
  });
  it('any declined → declined (terminal), even alongside a signature', () => {
    expect(deriveRequestStatus(['signed', 'declined'])).toBe('declined');
    expect(deriveRequestStatus(['declined'])).toBe('declined');
  });
  it('no signers → pending (defensive)', () => {
    expect(deriveRequestStatus([])).toBe('pending');
  });
});

describe('deriveDocumentStatus — SRS DOC-005', () => {
  it('no requests → draft', () => {
    expect(deriveDocumentStatus([])).toBe('draft');
  });
  it('all requests cancelled → draft', () => {
    expect(deriveDocumentStatus([req('cancelled', ['signed']), req('cancelled', ['pending'])])).toBe(
      'draft',
    );
  });
  it('shared, nobody acted → shared', () => {
    expect(deriveDocumentStatus([req('pending', ['pending', 'pending'])])).toBe('shared');
  });
  it('some signed, not all → partially_signed', () => {
    expect(deriveDocumentStatus([req('pending', ['signed', 'pending'])])).toBe('partially_signed');
  });
  it('every active signer signed → completed', () => {
    expect(deriveDocumentStatus([req('completed', ['signed', 'signed'])])).toBe('completed');
  });
  it('a decline anywhere → declined (terminal)', () => {
    expect(deriveDocumentStatus([req('declined', ['signed', 'declined'])])).toBe('declined');
  });
  it('union across multiple non-cancelled requests', () => {
    // one request fully signed, another still pending → overall partially_signed
    expect(
      deriveDocumentStatus([req('completed', ['signed']), req('pending', ['pending'])]),
    ).toBe('partially_signed');
  });
  it('cancelled requests are excluded from the rollup', () => {
    // the only non-cancelled request is fully signed → completed (cancelled one ignored)
    expect(
      deriveDocumentStatus([req('cancelled', ['declined']), req('completed', ['signed'])]),
    ).toBe('completed');
  });
});
