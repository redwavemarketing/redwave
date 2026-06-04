import { RepEquipmentService } from './rep-equipment.service';

const eq = (overrides: Record<string, unknown> = {}) => ({
  id: 'e1',
  equipment_type: 'iPad',
  identifier: 'SN-1',
  deposit_amount: { toString: () => '250.00' }, // Prisma Decimal-like
  assigned_date: new Date('2026-01-15T00:00:00.000Z'),
  returned_date: null,
  status: 'assigned',
  ...overrides,
});

function make() {
  const prisma = {
    rep: { findUnique: jest.fn().mockResolvedValue({ id: 'r1' }) },
    repEquipment: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };
  const audit = { log: jest.fn().mockResolvedValue(undefined) };
  return { service: new RepEquipmentService(prisma as never, audit as never), prisma, audit };
}

describe('RepEquipmentService (HRM-006)', () => {
  it('assign passes deposit_amount as the exact decimal STRING and sets status assigned', async () => {
    const { service, prisma } = make();
    prisma.repEquipment.create.mockResolvedValue(eq());
    await service.assign(
      'r1',
      {
        equipment_type: 'iPad',
        identifier: 'SN-1',
        deposit_amount: '250.00',
        assigned_date: '2026-01-15',
      },
      'actor',
    );
    const arg = prisma.repEquipment.create.mock.calls[0][0] as { data: Record<string, unknown> };
    expect(arg.data.deposit_amount).toBe('250.00');
    expect(typeof arg.data.deposit_amount).toBe('string'); // exact decimal, not a float
    expect(arg.data.status).toBe('assigned');
  });

  it('transition to returned sets the returned_date', async () => {
    const { service, prisma } = make();
    prisma.repEquipment.findUnique.mockResolvedValue(eq());
    prisma.repEquipment.update.mockResolvedValue(
      eq({ status: 'returned', returned_date: new Date('2026-06-30T00:00:00.000Z') }),
    );
    await service.update('e1', { status: 'returned', returned_date: '2026-06-30' }, 'actor');
    const arg = prisma.repEquipment.update.mock.calls[0][0] as { data: Record<string, unknown> };
    expect(arg.data.status).toBe('returned');
    expect(arg.data.returned_date).toBeInstanceOf(Date);
  });

  it('transition to withheld does not force a returned_date', async () => {
    const { service, prisma } = make();
    prisma.repEquipment.findUnique.mockResolvedValue(eq());
    prisma.repEquipment.update.mockResolvedValue(eq({ status: 'withheld' }));
    await service.update('e1', { status: 'withheld' }, 'actor');
    const arg = prisma.repEquipment.update.mock.calls[0][0] as { data: Record<string, unknown> };
    expect(arg.data.status).toBe('withheld');
    expect(arg.data.returned_date).toBeUndefined();
  });
});
