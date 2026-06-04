import { UnprocessableEntityException } from '@nestjs/common';
import { IncentiveService } from './incentive.service';

function make() {
  const prisma = {
    client: { findUnique: jest.fn() },
    incentive: { create: jest.fn(), findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn() },
  };
  const audit = { log: jest.fn().mockResolvedValue(undefined) };
  return { service: new IncentiveService(prisma as never, audit as never), prisma, audit };
}

const base = {
  name: 'Spiff',
  window_start: '2026-07-01',
  window_end: '2026-07-31',
  amount: '20.00',
};

describe('IncentiveService.create (COMM-005)', () => {
  it('creates a per_activation incentive and passes amount as a decimal string', async () => {
    const { service, prisma } = make();
    prisma.incentive.create.mockResolvedValue({
      id: 'inc1',
      name: 'Spiff',
      target_type: 'per_activation',
    });
    await service.create({ ...base, target_type: 'per_activation' as never }, 'actor');
    const arg = prisma.incentive.create.mock.calls[0][0] as {
      data: { amount: unknown; status: unknown };
    };
    expect(arg.data.amount).toBe('20.00');
    expect(typeof arg.data.amount).toBe('string');
    expect(arg.data.status).toBe('active');
  });

  it('rejects a target_based incentive without target_count (422)', async () => {
    const { service } = make();
    await expect(
      service.create({ ...base, target_type: 'target_based' as never }, 'actor'),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('stores a target_based incentive when target_count is given (modeled, but engine-deferred)', async () => {
    const { service, prisma } = make();
    prisma.incentive.create.mockResolvedValue({
      id: 'inc2',
      name: 'Spiff',
      target_type: 'target_based',
    });
    await service.create(
      { ...base, target_type: 'target_based' as never, target_count: 5 },
      'actor',
    );
    const arg = prisma.incentive.create.mock.calls[0][0] as { data: { target_count: unknown } };
    expect(arg.data.target_count).toBe(5);
  });
});
