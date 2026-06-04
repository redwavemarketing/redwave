import { ConflictException } from '@nestjs/common';
import { RolesService } from './roles.service';

function makeService() {
  const prisma = {
    role: { findUnique: jest.fn(), delete: jest.fn() },
    rolePermission: { deleteMany: jest.fn() },
    userRole: { deleteMany: jest.fn() },
    $transaction: jest.fn().mockResolvedValue([]),
  };
  const audit = { log: jest.fn().mockResolvedValue(undefined) };
  const service = new RolesService(prisma as never, audit as never);
  return { service, prisma, audit };
}

describe('RolesService.remove (AUTH-003)', () => {
  it('refuses to delete a built-in (is_system) role', async () => {
    const { service, prisma } = makeService();
    prisma.role.findUnique.mockResolvedValue({ id: 'r1', is_system: true, name: 'Super Admin' });

    await expect(service.remove('r1', 'actor')).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('deletes a custom role (and audits the deletion)', async () => {
    const { service, prisma, audit } = makeService();
    prisma.role.findUnique.mockResolvedValue({
      id: 'r2',
      is_system: false,
      name: 'General Manager',
    });

    await service.remove('r2', 'actor');

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'delete', entityId: 'r2' }),
    );
  });
});
