/**
 * Greenfield indicator — a clear GREEN badge when the sale is flagged greenfield, else a muted "Standard"
 * badge so the state reads at a glance across the sales list, detail, and the validation queue.
 */
import { Badge } from '../../../components/ui';

export function GreenfieldBadge({ on }: { on: boolean }) {
  return on ? <Badge tone="success">Greenfield</Badge> : <Badge tone="muted">Standard</Badge>;
}
