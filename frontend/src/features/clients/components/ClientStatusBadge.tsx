/** ClientStatusBadge — active/inactive for a client or product (soft-deactivate preserves history). */
import { Badge } from '../../../components/ui';

export function ClientStatusBadge({ active }: { active: boolean }) {
  return <Badge tone={active ? 'success' : 'muted'}>{active ? 'Active' : 'Inactive'}</Badge>;
}
