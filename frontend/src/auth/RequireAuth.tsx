/**
 * RequireAuth — the protected-route guard. While the session is booting it shows a loading screen;
 * once resolved it either renders the routed pages (<Outlet/>) or redirects to /login. An element
 * guard (not a router loader) because loaders can't read React context. This is UX routing — the
 * server still authorizes every request (CLAUDE §5).
 */
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './useAuth';
import { SessionLoading } from './SessionLoading';

export function RequireAuth() {
  const { status } = useAuth();
  if (status === 'loading') {
    return <SessionLoading />;
  }
  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
