/**
 * NotificationEmitterAdapter — binds the Documents `NOTIFICATION_EMITTER` seam to the real
 * NotificationsService. This is how a signature event in Documents becomes an in-app notification
 * (DOC-006/RPT-009) WITHOUT Documents depending on the Reporting feature code — Documents depends only
 * on the seam interface; this adapter (provided by NotificationsModule) supplies the real behavior.
 */
import { Injectable } from '@nestjs/common';
import { NotificationEmitter, NotificationEvent } from '../documents/seams/notification-emitter.provider';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationEmitterAdapter implements NotificationEmitter {
  constructor(private readonly notifications: NotificationsService) {}

  async emit(event: NotificationEvent): Promise<void> {
    await this.notifications.notify(event.eventType, event.userId, {
      title: event.title,
      body: event.body,
      relatedEntityType: event.relatedEntityType,
      relatedEntityId: event.relatedEntityId,
    });
  }
}
