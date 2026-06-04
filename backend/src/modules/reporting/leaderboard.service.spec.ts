import { LeaderboardService } from './leaderboard.service';

const D = (s: string) => new Date(`${s}T00:00:00.000Z`);
const item = (repId: string) => ({ sale: { rep_id: repId } });

function make() {
  const prisma = {
    payPeriod: { findMany: jest.fn().mockResolvedValue([{ id: 'P1', period_number: 1, start_date: D('2000-01-01'), end_date: D('2100-01-01') }]) },
    // 9 internet activations for rep b, 5 for rep a (bounded set; counted in-app).
    saleItem: {
      findMany: jest.fn().mockResolvedValue([
        ...Array.from({ length: 9 }, () => item('b')),
        ...Array.from({ length: 5 }, () => item('a')),
      ]),
    },
    rep: {
      findMany: jest.fn().mockResolvedValue([
        { id: 'a', rep_code: 'A', full_name: 'Alice' },
        { id: 'b', rep_code: 'B', full_name: 'Bob' },
      ]),
    },
  };
  return { service: new LeaderboardService(prisma as never), prisma };
}

describe('LeaderboardService.list (RPT-007 — counts only)', () => {
  it('ranks by activation count and carries NO money fields', async () => {
    const { service } = make();
    const result = await service.list();
    expect(result.rankings.map((r) => [r.rank, r.rep_id, r.activation_count])).toEqual([
      [1, 'b', 9],
      [2, 'a', 5],
    ]);
    // The payload must expose only counts/identity — never earnings.
    const keys = Object.keys(result.rankings[0]).join(',').toLowerCase();
    expect(keys).not.toMatch(/commission|payout|earning|amount|net|money|holdback|dollar/);
    expect(result.rankings[0].rep_name).toBe('Bob');
  });
});
