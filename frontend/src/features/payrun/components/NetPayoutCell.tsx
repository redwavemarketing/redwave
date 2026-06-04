/**
 * NetPayoutCell — the ONE place net payout is presented. Renders the server's exact-decimal net via
 * money() and styles a NEGATIVE net (a rep can owe when clawbacks exceed commission) in danger colour —
 * never hidden or floored (#1). Display only; no money math.
 */
import { money } from '../../../lib/format/money';
import styles from './payrun.module.css';

export function NetPayoutCell({ value }: { value: string }) {
  const negative = value.trim().startsWith('-');
  return <span className={negative ? styles.neg : styles.net}>{money(value)}</span>;
}
