/**
 * StatementLinesTable — renders the statement: ONE LINE PER CUSTOMER (the backend aggregates a sale's
 * products into a single line). Customer · products summary · line total. Money is the server's exact-decimal
 * via money() (right-aligned mono); the UI prices nothing. There is **NO GST line/field** and **no client-side
 * total row** — the statement total is server-sourced and shown separately. Tokens only.
 */
import { Table, TBody, TD, TH, THead, TR } from '../../../components/ui';
import { money } from '../../../lib/format/money';
import type { ClientStatementLine } from '../billing.types';

export function StatementLinesTable({ lines }: { lines: ClientStatementLine[] }) {
  return (
    <Table>
      <THead>
        <TR>
          <TH>Customer</TH>
          <TH>Products</TH>
          <TH align="right">Line total</TH>
        </TR>
      </THead>
      <TBody>
        {lines.map((l) => (
          <TR key={l.id}>
            <TD>{l.customer_name}</TD>
            <TD>
              <span className="mono">{l.products_summary}</span>
            </TD>
            <TD numeric>{money(l.line_total)}</TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}
