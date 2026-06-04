/**
 * Account types — RESPONSE shapes are hand-written (the backend Reporting/account endpoints declare no
 * response schema, so generated types are `never`). Mirrors `backend/src/modules/account/`. REQUEST bodies
 * ARE typed from the generated schema (re-exported below). Keep in sync with the backend.
 */
import type { components } from '../../api/generated/schema';
import type { ThemePreference } from '../../theme/theme.types';

/** The HR fields that can be changed via a profile-change request. */
export interface ProfileChangeFields {
  full_name?: string;
  phone?: string;
  avatar_url?: string;
}

export interface PendingRequestSummary {
  id: string;
  proposed_changes: ProfileChangeFields;
  created_at: string;
}

/** GET /v1/account/profile — the user's profile + whether a change is pending review. */
export interface AccountProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  theme_preference: ThemePreference;
  status: string;
  created_at: string;
  updated_at: string;
  change_pending: boolean;
  pending_request: PendingRequestSummary | null;
}

export type ProfileChangeStatus = 'pending' | 'approved' | 'rejected';

/** A row from GET /v1/account/profile-change-requests (the user's own request history). */
export interface MyProfileRequest {
  id: string;
  status: ProfileChangeStatus;
  proposed_changes: ProfileChangeFields;
  reviewed_at: string | null;
  created_at: string;
}

// Request bodies — typed from the generated schema (the backend DID emit request DTOs).
export type ProfileChangeRequestBody = components['schemas']['ProfileChangeRequestDto'];
export type ChangePasswordBody = components['schemas']['ChangePasswordDto'];
