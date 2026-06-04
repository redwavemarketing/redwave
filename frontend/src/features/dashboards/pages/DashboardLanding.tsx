/**
 * DashboardLanding — the index route ('/'): resolves the dashboard appropriate to the signed-in user's
 * role and redirects there. The order mirrors the backend gates so we never land a user on a dashboard
 * the server would 403 (CLAUDE §5). A user with no dashboard access falls back to the module-card home.
 *   Super Admin → Business · Admin → Operations · Manager → Team · linked rep → My dashboard
 *   else reports:view → Leaderboard · else → fallback home
 */
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../../auth/useAuth';
import AuthenticatedHome from '../../../pages/home/AuthenticatedHome';

function resolveLanding(auth: {
  isSuperAdmin: boolean;
  roles: string[];
  repId: string | null;
  permissions: Set<string>;
}): string | null {
  if (auth.isSuperAdmin) return '/dashboards/business';
  if (auth.roles.includes('Admin')) return '/dashboards/admin';
  if (auth.roles.includes('Manager')) return '/dashboards/manager';
  if (auth.repId) return '/dashboards/rep';
  if (auth.permissions.has('reports:view')) return '/dashboards/leaderboard';
  return null;
}

export default function DashboardLanding() {
  const { isSuperAdmin, roles, repId, permissions } = useAuth();
  const target = resolveLanding({ isSuperAdmin, roles, repId, permissions });
  if (target) return <Navigate to={target} replace />;
  return <AuthenticatedHome />;
}
