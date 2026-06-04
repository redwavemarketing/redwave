import { UnprocessableEntityException } from '@nestjs/common';
import { HoldbackService } from './holdback.service';

function make() {
  const tx = { holdbackConfig: { deleteMany: jest.fn(), update: jest.fn(), create: jest.fn() } };
  const prisma = {
    holdbackConfig: { findMany: jest.fn().mockResolvedValue([]) },
    holdbackReleaseSetting: { findFirst: jest.fn(), create: jest.fn() },
    $transaction: jest.fn().mockImplementation(async (cb: (t: typeof tx) => unknown) => cb(tx)),
  };
  const audit = { log: jest.fn().mockResolvedValue(undefined) };
  return { service: new HoldbackService(prisma as never, audit as never), prisma, audit, tx };
}

const iso = (n: number) => {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 10);
};

describe('HoldbackService.setConfig (COMM-003)', () => {
  it('rejects a split that does not sum to 1 (422)', async () => {
    const { service } = make();
    await expect(
      service.setConfig(
        { advance_pct: '0.70', holdback_pct: '0.40', effective_from: iso(1) },
        'actor',
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('accepts 0.70/0.30, passes pct as decimal STRINGS, and supersedes', async () => {
    const { service, tx } = make();
    tx.holdbackConfig.create.mockResolvedValue({
      id: 'new',
      advance_pct: '0.7000',
      holdback_pct: '0.3000',
      effective_from: new Date(iso(1)),
      effective_to: null,
    });
    await service.setConfig(
      { advance_pct: '0.7000', holdback_pct: '0.3000', effective_from: iso(1) },
      'actor',
    );
    const arg = tx.holdbackConfig.create.mock.calls[0][0] as {
      data: { advance_pct: unknown; holdback_pct: unknown };
    };
    expect(arg.data.advance_pct).toBe('0.7000');
    expect(typeof arg.data.advance_pct).toBe('string');
    expect(typeof arg.data.holdback_pct).toBe('string');
  });

  it('rejects a back-dated split (422)', async () => {
    const { service } = make();
    await expect(
      service.setConfig(
        { advance_pct: '0.7000', holdback_pct: '0.3000', effective_from: iso(-1) },
        'actor',
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });
});

describe('HoldbackService release setting (COMM-004 — PROPOSED §17, sticky)', () => {
  it('getReleaseSetting returns the latest by effective_from (sticky, latest wins)', async () => {
    const { service, prisma } = make();
    prisma.holdbackReleaseSetting.findFirst.mockResolvedValue({ id: 'r2', release_rule: 'latest' });
    await expect(service.getReleaseSetting()).resolves.toEqual({
      id: 'r2',
      release_rule: 'latest',
    });
    expect(prisma.holdbackReleaseSetting.findFirst).toHaveBeenCalledWith({
      orderBy: { effective_from: 'desc' },
    });
  });

  it('setReleaseSetting persists a new sticky row (store only, no interpretation)', async () => {
    const { service, prisma } = make();
    prisma.holdbackReleaseSetting.create.mockResolvedValue({
      id: 'r3',
      release_rule: 'next_cycle',
    });
    await service.setReleaseSetting({ release_rule: 'next_cycle' }, 'actor');
    const arg = prisma.holdbackReleaseSetting.create.mock.calls[0][0] as {
      data: Record<string, unknown>;
    };
    expect(arg.data.release_rule).toBe('next_cycle');
    expect(arg.data.set_by).toBe('actor');
  });
});
