import { ForbiddenException } from '@nestjs/common';
import { TargetsService } from './targets.service';
import { AuthUser } from '../../common/rbac/auth-user.type';

const D = (s: string) => new Date(`${s}T00:00:00.000Z`);
const user = (over: Partial<AuthUser> = {}): AuthUser => ({
  id: 'u1', email: 'u@x.co', full_name: 'U', status: 'active', roleNames: [], isSuperAdmin: false,
  permissions: new Set(), repId: null, ...over,
});

function make(scope: 'all' | 'roster' | 'self', repIds: string[] = []) {
  const prisma = {
    payPeriod: { findUnique: jest.fn().mockResolvedValue({ start_date: D('2026-01-01'), end_date: D('2026-01-14') }) },
    salesTarget: { findFirst: jest.fn().mockResolvedValue(null), findMany: jest.fn().mockResolvedValue([]), create: jest.fn().mockResolvedValue({ id: 't1' }), update: jest.fn().mockResolvedValue({ id: 't1' }) },
  };
  const audit = { log: jest.fn().mockResolvedValue(undefined) };
  const scopeSvc = { getRepScope: jest.fn().mockResolvedValue(scope === 'all' ? { level: 'all' } : { level: scope, repIds }) };
  return { service: new TargetsService(prisma as never, audit as never, scopeSvc as never), prisma };
}

describe('TargetsService.set', () => {
  it('a bare rep (self scope) cannot set targets → 403', async () => {
    const { service } = make('self', ['rep-1']);
    await expect(service.set(user(), { rep_id: 'rep-1', pay_period_id: 'P1', target_count: 20 })).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('a manager cannot set a target for a rep OUTSIDE their roster → 403', async () => {
    const { service } = make('roster', ['r1', 'r2']);
    await expect(service.set(user(), { rep_id: 'rX', pay_period_id: 'P1', target_count: 20 })).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('a manager sets a target for a roster rep (create when none exists)', async () => {
    const { service, prisma } = make('roster', ['r1', 'r2']);
    await service.set(user(), { rep_id: 'r1', pay_period_id: 'P1', target_count: 20 });
    expect(prisma.salesTarget.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ rep_id: 'r1', target_count: 20 }) }),
    );
  });

  it('updates in place when a target already exists for the rep+period', async () => {
    const { service, prisma } = make('all');
    prisma.salesTarget.findFirst.mockResolvedValue({ id: 'existing' });
    await service.set(user({ isSuperAdmin: true }), { rep_id: 'r1', pay_period_id: 'P1', target_count: 25 });
    expect(prisma.salesTarget.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'existing' } }));
    expect(prisma.salesTarget.create).not.toHaveBeenCalled();
  });
});
