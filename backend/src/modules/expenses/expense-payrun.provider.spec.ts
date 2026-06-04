import { ExpensePayrunProvider } from './expense-payrun.provider';

const decLike = (s: string) => ({ toString: () => s });

function make() {
  const prisma = { expenseItem: { findMany: jest.fn() } };
  const provider = new ExpensePayrunProvider(prisma as never);
  return { provider, prisma };
}

describe('ExpensePayrunProvider.getApprovedExpenseTotal (Pay Run seam)', () => {
  it('sums the rep’s approved item amounts for the period (exact Decimal)', async () => {
    const { provider, prisma } = make();
    prisma.expenseItem.findMany.mockResolvedValue([
      { amount: decLike('31.50') },
      { amount: decLike('42.50') },
      { amount: decLike('0.01') },
    ]);
    const total = await provider.getApprovedExpenseTotal('rep-1', 'P1');
    expect(total.toFixed(2)).toBe('74.01');
  });

  it('queries only APPROVED reports for that rep + period (scope is in the query)', async () => {
    const { provider, prisma } = make();
    prisma.expenseItem.findMany.mockResolvedValue([]);
    await provider.getApprovedExpenseTotal('rep-9', 'P7');
    const where = (prisma.expenseItem.findMany.mock.calls[0][0] as { where: { expense_report: object } })
      .where;
    expect(where.expense_report).toEqual({ rep_id: 'rep-9', pay_period_id: 'P7', status: 'approved' });
  });

  it('no approved items → 0', async () => {
    const { provider, prisma } = make();
    prisma.expenseItem.findMany.mockResolvedValue([]);
    expect((await provider.getApprovedExpenseTotal('rep-1', 'P1')).toFixed(2)).toBe('0.00');
  });
});
