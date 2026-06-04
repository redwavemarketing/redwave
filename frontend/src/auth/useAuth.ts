import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from './auth-context';

/** Access the authenticated session (user, permissions, login/logout/setTheme). */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
