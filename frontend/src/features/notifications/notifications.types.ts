/**
 * Notification types — HAND-WRITTEN (the backend declares no response schema; generated types are
 * `never`). Mirrors `backend/src/modules/reporting/notifications.service.ts` row shape. The list is
 * own-only (scoped server-side by user_id). Keep in sync with the backend.
 */
import type { components } from '../../api/generated/schema';

export type NotificationChannel = 'in_app' | 'email';

export interface AppNotification {
  id: string;
  user_id: string;
  type: string;
  channel: NotificationChannel;
  title: string;
  body: string;
  related_entity_type: string | null;
  related_entity_id: string | null;
  is_read: boolean;
  sent_at: string | null;
  created_at: string;
}

export interface NotificationFilter {
  is_read?: boolean;
}

/**
 * A global per-event channel setting (GET /v1/notification-settings, settings:view / Super Admin). There
 * is NO per-user override — the Super Admin configures channels per event for everyone (SRS AUTH-013).
 */
export interface NotificationSetting {
  id: string;
  event_type: string;
  in_app_enabled: boolean;
  email_enabled: boolean;
  updated_by: string;
  updated_at: string;
}

// Request body for the settings editor (PATCH /v1/notification-settings, settings:edit). Typed from schema.
export type UpdateNotificationSettingsBody = components['schemas']['UpdateNotificationSettingsDto'];
