/**
 * Auth response types — HAND-WRITTEN to match the backend contract.
 *
 * NOTE: the backend's OpenAPI declares request bodies but NOT response schemas, so the generated
 * `api/generated/schema.d.ts` types every success body as `never`. Until the backend adds
 * `@ApiResponse` DTOs (a flagged follow-up), these mirror the real shapes from
 * `backend/src/modules/auth/auth.service.ts`. Keep in sync with the contract.
 */
import type { ThemePreference } from '../theme/theme.types';

export interface PublicUser {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  theme_preference: ThemePreference;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
}

export interface RefreshResponse {
  access_token: string;
}

export interface MeResponse {
  user: PublicUser;
  roles: string[];
  is_super_admin: boolean;
  rep_id: string | null;
  effective_permissions: string[];
}
