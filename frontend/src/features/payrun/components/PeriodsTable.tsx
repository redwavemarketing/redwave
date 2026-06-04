/**
 * PeriodsTable — the entry point: the pre-loaded pay-period schedule joined (client-side) with each
 * period's latest run, so each row shows its run state and the right action. Drafting/finalize are backend
 * calls; this only routes to the workspace. Tokens only.
 */
import { Button, Table, TBody, TD, TH, THead, TR } from '../../../components/ui';
import { displayDate } from '../../../lib/format/date';
import { PeriodStatusBadge } from './PeriodStatusBadge';
import { PayRunStatusBadge } from './PayRunStatusBadge';
import styles from './payrun.module.css';
import type { PayPeriod, PayRunSummary } from '../payrun.types';

export interface PeriodRow {
  period: PayPeriod;
  run: PayRunSummary | null;
}

interface Props {
  rows: PeriodRow[];
  canCreate: boolean;
  draftingPeriodId: string | null;
  onOpen: (runId: string) => void;
  onDraft: (periodId: string) => void;
}

export function PeriodsTable({ rows, canCreate, draftingPeriodId, onOpen, onDraft }: Props) {
  return (
    <Table>
      <THead>
        <TR>
          <TH>Period</TH>
          <TH>Payday</TH>
          <TH>Period status</TH>
          <TH>Run</TH>
          <TH align="right">Action</TH>
        </TR>
      </THead>
      <TBody>
        {rows.map(({ period, run }) => (
          <TR key={period.id}>
            <TD>
              <span className="mono">#{period.period_number}</span>{' '}
              <span className={styles.note}>
                {displayDate(period.start_date)} – {displayDate(period.end_date)}
              </span>
            </TD>
            <TD>
              <span className="mono">{displayDate(period.payday)}</span>
            </TD>
            <TD>
              <PeriodStatusBadge status={period.status} />
            </TD>
            <TD>{run ? <PayRunStatusBadge status={run.status} /> : <span className={styles.note}>No run</span>}</TD>
            <TD align="right">
              <div className={styles.rowActions}>
                {run ? (
                  <Button variant="secondary" size="sm" onClick={() => onOpen(run.id)}>
                    {run.status === 'draft' ? 'Open draft' : 'View'}
                  </Button>
                ) : canCreate ? (
                  <Button
                    variant="primary"
                    size="sm"
                    loading={draftingPeriodId === period.id}
                    onClick={() => onDraft(period.id)}
                  >
                    Draft a run
                  </Button>
                ) : (
                  <span className={styles.note}>—</span>
                )}
              </div>
            </TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}
