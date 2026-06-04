/**
 * Administration types — hand-written (the backend declares no response schema). Session 1 covers the
 * profile-change-review queue; Session 2 adds users/roles/notification-settings types here. Mirrors
 * `backend/src/modules/account/` (the review controller + ScopeService routing).
 */

/** The HR fields a profile-change request may carry. */
export interface ProfileChangeFields {
  full_name?: string;
  phone?: string;
  avatar_url?: string;
}

/** The subject (whose profile would change) as returned on a queue row. */
export interface ReviewSubject {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
}

/** A pending profile-change request in the reviewer's (server-scoped) queue. */
export interface ReviewRequest {
  id: string;
  proposed_changes: ProfileChangeFields;
  created_at: string;
  requested_by: string;
  subject: ReviewSubject;
}
