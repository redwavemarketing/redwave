import { createContext } from 'react';
import type { ThemePreference } from '../theme/theme.types';
import type { PublicUser } from './auth.types';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthContextValue {
  status: AuthStatus;
  user: PublicUser | null;
  roles: string[];
  /** Effective permissions as `"module:action"` strings (union of the user's roles, from /me). */
  permissions: Set<string>;
  isSuperAdmin: boolean;
  /** The caller's linked rep id, or null. The backend defines "is a rep" by this — drives rep landing. */
  repId: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Set the theme: applies instantly; persists to the server (PATCH /v1/account/theme) when authed. */
  setTheme: (preference: ThemePreference) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
