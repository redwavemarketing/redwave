/**
 * PaidSaleFinder — find a sale that has a clawable item. The Sales API has no text search, so the rows are
 * fetched server-side (paid + partially-clawed sales) and filtered CLIENT-side by Sale ID / customer. The
 * "clawable items" column is a COUNT (not money). Selecting a row reveals its items panel. Tokens only.
 */
import { Input, Table, TBody, TD, TH, THead, TR } from '../../../components/ui';
import { displayDate } from '../../../lib/format/date';
import { isClawable } from '../clawback.logic';
import styles from './clawback.module.css';
import type { Sale } from '../../sales/sales.types';

interface Props {
  text: string;
  onText: (v: string) => void;
  rows: Sale[];
  selectedSaleId: string | null;
  onSelect: (saleId: string) => void;
}

export function PaidSaleFinder({ text, onText, rows, selectedSaleId, onSelect }: Props) {
  return (
    <div className={styles.page}>
      <div className={styles.controls}>
        <div className={styles.control}>
          <Input value={text} onChange={(e) => onText(e.target.value)} placeholder="Search by Sale ID or customer" aria-label="Search paid sales" />
        </div>
      </div>
      <Table>
        <THead>
          <TR>
            <TH>Sale ID</TH>
            <TH>Customer</TH>
            <TH>Sale date</TH>
            <TH align="right">Clawable items</TH>
          </TR>
        </THead>
        <TBody>
          {rows.map((sale) => (
            <TR key={sale.id} selected={sale.id === selectedSaleId}>
              <TD>
                <button type="button" className={styles.linkBtn} onClick={() => onSelect(sale.id)}>
                  <span className="mono">{sale.sale_code}</span>
                </button>
              </TD>
              <TD>{sale.customer_name}</TD>
              <TD>
                <span className="mono">{displayDate(sale.sale_date)}</span>
              </TD>
              <TD numeric>{sale.sale_items.filter(isClawable).length}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
