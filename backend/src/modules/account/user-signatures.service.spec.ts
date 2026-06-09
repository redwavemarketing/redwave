import { NotFoundException } from '@nestjs/common';
import { UserSignaturesService } from './user-signatures.service';
import { AuthUser } from '../../common/rbac/auth-user.type';

const user = (id = 'u1'): AuthUser => ({
  id,
  email: 'u@x.co',
  full_name: 'User',
  status: 'active',
  roleNames: [],
  isSuperAdmin: false,
  permissions: new Set(),
  repId: null,
});

const pngFile = { buffer: Buffer.from('img'), originalname: 'sig.png', mimetype: 'image/png', size: 3 };

function make() {
  const prisma = {
    userSignature: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockResolvedValue({ id: 's1', label: 'Mine', method: 'drawn', is_default: true, created_at: new Date() }),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation(async (arg: unknown) =>
      Array.isArray(arg) ? Promise.all(arg) : (arg as (t: unknown) => unknown)(prisma),
    ),
  };
  const audit = { log: jest.fn().mockResolvedValue(undefined) };
  const storage = {
    upload: jest.fn().mockResolvedValue({ path: 'signatures/u1/2026/abc-sig.png', stored: true }),
    signedUrl: jest.fn().mockResolvedValue('https://signed/sig.png'),
  };
  const service = new UserSignaturesService(prisma as never, audit as never, storage as never);
  return { service, prisma, audit, storage };
}

describe('UserSignaturesService (own-scoped)', () => {
  it('list is scoped to the caller', async () => {
    const { service, prisma } = make();
    await service.list(user());
    expect(prisma.userSignature.findMany.mock.calls[0][0]).toMatchObject({ where: { user_id: 'u1' } });
  });

  it('uploads to a per-user path; the FIRST saved signature is the default', async () => {
    const { service, prisma, storage } = make();
    prisma.userSignature.count.mockResolvedValue(0);
    await service.create({ label: 'Mine', method: 'drawn' }, pngFile, user());
    expect(storage.upload).toHaveBeenCalledWith('signatures/u1', pngFile);
    expect((prisma.userSignature.create.mock.calls[0][0] as { data: { is_default: boolean } }).data.is_default).toBe(true);
  });

  it('a later signature is NOT default', async () => {
    const { service, prisma } = make();
    prisma.userSignature.count.mockResolvedValue(2);
    await service.create({ label: 'Another', method: 'typed' }, pngFile, user());
    expect((prisma.userSignature.create.mock.calls[0][0] as { data: { is_default: boolean } }).data.is_default).toBe(false);
  });

  it('setDefault unsets the others then sets this one (atomic)', async () => {
    const { service, prisma } = make();
    prisma.userSignature.findFirst.mockResolvedValue({ id: 's2', label: 'X', method: 'drawn', is_default: false, created_at: new Date() });
    await service.setDefault('s2', user());
    expect(prisma.userSignature.updateMany).toHaveBeenCalledWith({ where: { user_id: 'u1' }, data: { is_default: false } });
    expect(prisma.userSignature.update).toHaveBeenCalledWith({ where: { id: 's2' }, data: { is_default: true } });
  });

  it('setDefault on someone else’s signature → 404 (own-scoped)', async () => {
    const { service, prisma } = make();
    prisma.userSignature.findFirst.mockResolvedValue(null);
    await expect(service.setDefault('s9', user())).rejects.toBeInstanceOf(NotFoundException);
  });

  it('fileUrl returns a signed URL only for the caller’s own signature', async () => {
    const { service, prisma, storage } = make();
    prisma.userSignature.findFirst.mockResolvedValue({ file_path: 'signatures/u1/2026/abc-sig.png' });
    const res = await service.fileUrl('s1', user());
    expect(prisma.userSignature.findFirst.mock.calls[0][0]).toMatchObject({ where: { id: 's1', user_id: 'u1' } });
    expect(res.url).toBe('https://signed/sig.png');
    expect(storage.signedUrl).toHaveBeenCalledWith('signatures/u1/2026/abc-sig.png');
  });
});
