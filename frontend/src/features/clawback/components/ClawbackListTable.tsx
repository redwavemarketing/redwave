/**
 * ClawbackListTable — the clawbacks list. Records are FLAT (no joins), so the row links to the sale via
 * `sale_id` for context and maps `applied_in_pay_run_id` → a period label via the pay-run list (when
 * available). Amount is the server's exact-decimal via money(); no money math. Tokens only.
 */
import { Link } from 'react-router-dom';
import { Table, TBody, TD, TH, THead, TR } from '../../../components/ui';
import { money } from '../../../lib/format/money';
import { displayDate } from '../../../lib/format/date';
import { ClawbackStatusBadge } from './ClawbackStatusBadge';
import styles from './clawback.module.css';
import type { Clawback } from '../clawback.types';

interface Props {
  rows: Clawback[];
  /** Maps a pay-run id → a human label (e.g. "#5"); '—' when unknown / not applied. */
  runLabel: (payRunId: string | null) => string;
}

export function ClawbackListTable({ rows, runLabel }: Props) {
  return (
    <Table>
      <THead>
        <TR>
          <TH>Reported date</TH>
          <TH align="right">Amount</TH>
          <TH>Reason</TH>
          <TH>Status</TH>
          <TH>Applied run</TH>
          <TH align="right" aria-label="Sale" />
        </TR>
      </THead>
      <TBody>
        {rows.map((c) => (
          <TR key={c.id}>
            <TD>
              <span className="mono">{displayDate(c.reported_date)}</span>
            </TD>
            <TD numeric>{money(c.amount)}</TD>
            <TD>
              <span className={styles.reason} title={c.reason}>
                {c.reason}
              </span>
            </TD>
            <TD>
              <ClawbackStatusBadge status={c.status} />
            </TD>
            <TD>
              <span className="mono">{runLabel(c.applied_in_pay_run_id)}</span>
            </TD>
            <TD align="right">
              <Link to={`/sales/${c.sale_id}`}>View sale</Link>
            </TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}
