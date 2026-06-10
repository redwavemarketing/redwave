import { SequenceService } from './sequence.service';

/** A fake tx whose document_sequences.update emulates Postgres atomic increment + row-lock serialization. */
function makeTx(start: Record<string, number> = { statement: 0, invoice: 0 }) {
  const store = { ...start };
  return {
    documentSequence: {
      update: jest.fn(async ({ where: { key } }: { where: { key: string } }) => {
        store[key] += 1; // atomic increment-and-return-new
        return { current_value: store[key] };
      }),
    },
  };
}

describe('SequenceService — gapless sequential numbers (BRD §8)', () => {
  it('returns 1, 2, 3 … with no gaps', async () => {
    const svc = new SequenceService();
    const tx = makeTx();
    expect(await svc.next(tx as never, 'statement')).toBe(1);
    expect(await svc.next(tx as never, 'statement')).toBe(2);
    expect(await svc.next(tx as never, 'statement')).toBe(3);
  });

  it('keeps separate counters per document type', async () => {
    const svc = new SequenceService();
    const tx = makeTx();
    expect(await svc.next(tx as never, 'statement')).toBe(1);
    expect(await svc.next(tx as never, 'invoice')).toBe(1); // independent sequence
    expect(await svc.next(tx as never, 'statement')).toBe(2);
  });

  it('uses an atomic increment on the passed transaction client (the row-lock seam)', async () => {
    const svc = new SequenceService();
    const tx = makeTx();
    await svc.next(tx as never, 'statement');
    expect(tx.documentSequence.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { key: 'statement' }, data: { current_value: { increment: 1 } } }),
    );
  });
});
