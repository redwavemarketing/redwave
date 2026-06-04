/**
 * Notification emitter seam — the clean output boundary for "this signature event should notify a
 * user". Documents emits events through this token; the default `NoopNotificationEmitter` does
 * nothing, so Documents stays self-contained and testable. The Reporting module re-binds the token
 * to a real adapter over its NotificationService — Documents code does not change (one-directional,
 * no Documents↔Reporting cycle). Same seam pattern as the Pay Run providers. — arch §9, DOC-006/RPT-009
 */
import { Injectable } from '@nestjs/common';

export const NOTIFICATION_EMITTER = Symbol('NOTIFICATION_EMITTER');

export interface NotificationEvent {
  eventType: string;
  userId: string;
  title: string;
  body: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
}

export interface NotificationEmitter {
  /** Best-effort: emitting a notification must NEVER break the originating action (e.g. signing). */
  emit(event: NotificationEvent): Promise<void>;
}

@Injectable()
export class NoopNotificationEmitter implements NotificationEmitter {
  async emit(): Promise<void> {
    // no-op until Reporting re-binds the token
  }
}
