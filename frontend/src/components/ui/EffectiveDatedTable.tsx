/**
 * EffectiveDatedTable — the SHARED, domain-agnostic effective-dating table (CLAUDE #10). Renders any rows
 * carrying `{ effective_from, effective_to, status }` plus caller-supplied leading columns, then the
 * effective window + a RateStatusBadge. Rows are READ-ONLY: the only change path is superseding (adding a
 * new future-dated row) — you never edit a current/pending/past row. Reused by Clients billing rates and
 * Commission Config (tiers/flats/holdback). Tokens only.
 */
import type { ReactNode } from 'react';
import { displayDate } from '../../lib/format/date';
import { Table, TBody, TD, TH, THead, TR } from './Table';
import { RateStatusBadge, type RateStatus } from './RateStatusBadge';

export interface EffectiveDatedRow {
  id: string;
  effective_from: string;
  effective_to: string | null;
  status: RateStatus;
}

export interface EffectiveColumn<T> {
  header: ReactNode;
  align?: 'left' | 'right';
  render: (row: T) => ReactNode;
}

export function EffectiveDatedTable<T extends EffectiveDatedRow>({
  rows,
  columns,
}: {
  rows: T[];
  columns: EffectiveColumn<T>[];
}) {
  return (
    <Table density="comfortable">
      <THead>
        <TR>
          {columns.map((c, i) => (
            <TH key={i} align={c.align}>
              {c.header}
            </TH>
          ))}
          <TH>Effective from</TH>
          <TH>Effective to</TH>
          <TH>Status</TH>
        </TR>
      </THead>
      <TBody>
        {rows.map((row) => (
          <TR key={row.id}>
            {columns.map((c, i) => (
              <TD key={i} align={c.align} numeric={c.align === 'right'}>
                {c.render(row)}
              </TD>
            ))}
            <TD numeric>{displayDate(row.effective_from)}</TD>
            <TD numeric>{row.effective_to ? displayDate(row.effective_to) : 'Open'}</TD>
            <TD>
              <RateStatusBadge status={row.status} />
            </TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}
