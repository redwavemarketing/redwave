import { Decimal } from 'decimal.js';
import { buildStatement, SaleInput } from './statement.logic';

const item = (id: string, name: string, rate: string | null) => ({
  product_id: id,
  product_name: name,
  rate: rate === null ? null : new Decimal(rate),
});

describe('buildStatement (pure one-line-per-customer aggregation) — SRS BILL-001', () => {
  it('household with internet + TV + home phone → ONE line, combined total (worked example)', () => {
    const sales: SaleInput[] = [
      {
        sale_id: 's1',
        customer_name: 'Jane Doe',
        items: [
          item('p-int', 'Internet', '60.00'),
          item('p-tv', 'TV', '25.00'),
          item('p-hp', 'Home Phone', '15.00'),
        ],
      },
    ];
    const result = buildStatement(sales);
    expect(result.lines).toHaveLength(1); // never one row per product
    expect(result.lines[0].products_summary).toBe('Internet, TV, Home Phone');
    expect(result.lines[0].line_total.toFixed(2)).toBe('100.00');
    expect(result.total_amount.toFixed(2)).toBe('100.00');
  });

  it('one line per SALE — two customers → two lines, each aggregating its own products', () => {
    const sales: SaleInput[] = [
      { sale_id: 's1', customer_name: 'A', items: [item('p-int', 'Internet', '60.00')] },
      {
        sale_id: 's2',
        customer_name: 'B',
        items: [item('p-int', 'Internet', '60.00'), item('p-tv', 'TV', '25.00')],
      },
    ];
    const result = buildStatement(sales);
    expect(result.lines.map((l) => l.sale_id)).toEqual(['s1', 's2']);
    expect(result.lines[1].line_total.toFixed(2)).toBe('85.00');
    expect(result.total_amount.toFixed(2)).toBe('145.00');
  });

  it('products_summary de-duplicates repeated product names', () => {
    const sales: SaleInput[] = [
      {
        sale_id: 's1',
        customer_name: 'A',
        items: [item('p-int', 'Internet', '60.00'), item('p-int2', 'Internet', '60.00')],
      },
    ];
    expect(buildStatement(sales).lines[0].products_summary).toBe('Internet');
  });

  it('amounts are exact Decimal (no float drift)', () => {
    const sales: SaleInput[] = [
      {
        sale_id: 's1',
        customer_name: 'A',
        items: [item('p1', 'X', '10.10'), item('p2', 'Y', '20.20'), item('p3', 'Z', '0.01')],
      },
    ];
    expect(buildStatement(sales).total_amount.toFixed(2)).toBe('30.31');
  });

  it('empty input → no lines, total 0', () => {
    const result = buildStatement([]);
    expect(result.lines).toHaveLength(0);
    expect(result.total_amount.toFixed(2)).toBe('0.00');
  });
});
