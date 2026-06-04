/**
 * EnvironmentBadge — design-system §6.6. Shows the deploy environment (staging/dev) so users never
 * confuse it with production. Sourced from VITE_ENV (falls back to Vite's MODE). Hidden in production.
 */
import { Badge } from '../ui/Badge';

export function EnvironmentBadge() {
  const env = (import.meta.env.VITE_ENV as string | undefined) ?? import.meta.env.MODE;
  if (env === 'production') return null;
  const tone = env === 'staging' ? 'warning' : 'info';
  return <Badge tone={tone}>{env.toUpperCase()}</Badge>;
}
