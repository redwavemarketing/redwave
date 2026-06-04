import { ConflictException, ForbiddenException } from '@nestjs/common';
import { SignaturesService } from './signatures.service';
import { AuthUser } from '../../common/rbac/auth-user.type';
import { SignDecision } from './dto/sign.dto';

const user = (over: Partial<AuthUser> = {}): AuthUser => ({
  id: 'u1',
  email: 'u@x.co',
  full_name: 'User',
  status: 'active',
  roleNames: [],
  isSuperAdmin: false,
  permissions: new Set(),
  repId: null,
  ...over,
});

function make() {
  const tx = {
    signatureRequest: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    documentSignature: { findFirst: jest.fn(), update: jest.fn() },
    document: { update: jest.fn() },
  };
  const prisma = {
    signatureRequest: { findUnique: jest.fn() },
    $transaction: jest.fn().mockImplementation(async (cb: (t: typeof tx) => unknown) => cb(tx)),
  };
  const audit = { log: jest.fn().mockResolvedValue(undefined) };
  const emitter = { emit: jest.fn().mockResolvedValue(undefined) };
  const service = new SignaturesService(prisma as never, audit as never, emitter as never);
  return { service, prisma, tx, audit, emitter };
}

describe('SignaturesService.act — sign/decline (DOC-003/004/005)', () => {
  it('sign sets status/signed_at/method/ip + a per-signer signed copy; original untouched; doc completed', async () => {
    const { service, tx, audit } = make();
    tx.signatureRequest.findUnique.mockResolvedValue({ id: 'req1', status: 'pending', document_id: 'd1', document: { owner_user_id: 'owner' } });
    tx.documentSignature.findFirst.mockResolvedValue({ id: 'sig1', status: 'pending' });
    tx.signatureRequest.findUniqueOrThrow.mockResolvedValue({ status: 'pending', document_signatures: [{ status: 'signed' }] });
    tx.signatureRequest.findMany.mockResolvedValue([{ status: 'completed', document_signatures: [{ status: 'signed' }] }]);

    await service.act('req1', { decision: SignDecision.sign, method: 'typed' }, user(), '1.2.3.4');

    const data = (tx.documentSignature.update.mock.calls[0][0] as { data: Record<string, unknown> }).data;
    expect(data.status).toBe('signed');
    expect(data.signed_at).toBeInstanceOf(Date);
    expect(data.ip_address).toBe('1.2.3.4');
    expect(data.method).toBe('typed');
    expect(data.signed_file_url).toBe('s3://redwave-docs/signed/sig1.pdf');
    // The document row is only ever status-updated here — the original_file_url is never touched. (DOC-004)
    const docUpdate = (tx.document.update.mock.calls[0][0] as { data: Record<string, unknown> }).data;
    expect(Object.keys(docUpdate)).toEqual(['status']);
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'sign' }));
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'complete' }));
  });

  it('decline → signer declined, request + document declined (terminal)', async () => {
    const { service, tx, audit } = make();
    tx.signatureRequest.findUnique.mockResolvedValue({ id: 'req1', status: 'pending', document_id: 'd1', document: { owner_user_id: 'owner' } });
    tx.documentSignature.findFirst.mockResolvedValue({ id: 'sig1', status: 'pending' });
    tx.signatureRequest.findUniqueOrThrow.mockResolvedValue({ status: 'pending', document_signatures: [{ status: 'declined' }, { status: 'pending' }] });
    tx.signatureRequest.findMany.mockResolvedValue([{ status: 'declined', document_signatures: [{ status: 'declined' }, { status: 'pending' }] }]);

    const result = await service.act('req1', { decision: SignDecision.decline }, user(), '1.2.3.4');

    expect((tx.documentSignature.update.mock.calls[0][0] as { data: { status: string } }).data.status).toBe('declined');
    expect(result.documentStatus).toBe('declined');
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'decline' }));
    expect(audit.log).not.toHaveBeenCalledWith(expect.objectContaining({ action: 'complete' }));
  });

  it('a non-recipient → 403', async () => {
    const { service, tx } = make();
    tx.signatureRequest.findUnique.mockResolvedValue({ id: 'req1', status: 'pending', document_id: 'd1', document: { owner_user_id: 'owner' } });
    tx.documentSignature.findFirst.mockResolvedValue(null);
    await expect(service.act('req1', { decision: SignDecision.sign }, user(), undefined)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('re-signing an already-acted signature → 409', async () => {
    const { service, tx } = make();
    tx.signatureRequest.findUnique.mockResolvedValue({ id: 'req1', status: 'pending', document_id: 'd1', document: { owner_user_id: 'owner' } });
    tx.documentSignature.findFirst.mockResolvedValue({ id: 'sig1', status: 'signed' });
    await expect(service.act('req1', { decision: SignDecision.sign }, user(), undefined)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('acting on a closed (non-pending) request → 409', async () => {
    const { service, tx } = make();
    tx.signatureRequest.findUnique.mockResolvedValue({ id: 'req1', status: 'completed', document_id: 'd1' });
    tx.documentSignature.findFirst.mockResolvedValue({ id: 'sig1', status: 'pending' });
    await expect(service.act('req1', { decision: SignDecision.sign }, user(), undefined)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});

describe('SignaturesService.cancel', () => {
  it('the requester cancels a pending request → cancelled', async () => {
    const { service, prisma, tx, audit } = make();
    prisma.signatureRequest.findUnique.mockResolvedValue({
      id: 'req1', status: 'pending', requested_by: 'u1', document_id: 'd1', document: { owner_user_id: 'owner' },
    });
    tx.signatureRequest.findMany.mockResolvedValue([{ status: 'cancelled', document_signatures: [{ status: 'pending' }] }]);
    const result = await service.cancel('req1', user());
    expect((tx.signatureRequest.update.mock.calls[0][0] as { data: { status: string } }).data.status).toBe('cancelled');
    expect(result.status).toBe('cancelled');
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'cancel' }));
  });

  it('a non-requester non-owner non-admin → 403', async () => {
    const { service, prisma } = make();
    prisma.signatureRequest.findUnique.mockResolvedValue({
      id: 'req1', status: 'pending', requested_by: 'someone', document_id: 'd1', document: { owner_user_id: 'owner' },
    });
    await expect(service.cancel('req1', user())).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('cancelling a non-pending request → 409', async () => {
    const { service, prisma } = make();
    prisma.signatureRequest.findUnique.mockResolvedValue({
      id: 'req1', status: 'completed', requested_by: 'u1', document_id: 'd1', document: { owner_user_id: 'u1' },
    });
    await expect(service.cancel('req1', user())).rejects.toBeInstanceOf(ConflictException);
  });
});
