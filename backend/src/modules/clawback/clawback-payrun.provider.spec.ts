import { ClawbackPayrunProvider } from './clawback-payrun.provider';

const decLike = (s: string) => ({ toString: () => s });

function make() {
  const tx = { clawback: { updateMany: jest.fn() } };
  const prisma = { clawback: { findMany: jest.fn() } };
  return { provider: new ClawbackPayrunProvider(prisma as never), prisma, tx };
}

describe('ClawbackPayrunProvider (the rebound seam)', () => {
  it('getClawbackTotal sums the rep’s pending clawback amounts (exact decimal)', async () => {
    const { provider, prisma } = make();
    prisma.clawback.findMany.mockResolvedValue([
      { amount: decLike('30.00') },
      { amount: decLike('50.00') },
    ]);
    const total = await provider.getClawbackTotal('rep-1');
    expect(total.toFixed(2)).toBe('80.00');
    expect(prisma.clawback.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { rep_id: 'rep-1', status: 'pending' } }),
    );
  });

  it('markApplied flips pending → applied and links the run (within the finalize tx)', async () => {
    const { provider, tx } = make();
    await provider.markApplied('rep-1', 'P1', 'run-1', tx as never);
    expect(tx.clawback.updateMany).toHaveBeenCalledWith({
      where: { rep_id: 'rep-1', status: 'pending' },
      data: { status: 'applied', applied_in_pay_run_id: 'run-1' },
    });
  });
});
