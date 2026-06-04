/** Greenfield indicator — an accent badge when the sale is flagged greenfield, else a muted dash. */
import { Badge } from '../../../components/ui';

export function GreenfieldBadge({ on }: { on: boolean }) {
  return on ? <Badge tone="accent">Greenfield</Badge> : <span aria-hidden>—</span>;
}
