import { Module } from '@nestjs/common';
import { NOTIFICATION_EMITTER } from '../documents/seams/notification-emitter.provider';
import { NotificationsService } from './notifications.service';
import { NotificationEmitterAdapter } from './notification-emitter.adapter';
import { EMAIL_DISPATCHER, NoopEmailDispatcher } from './seams/email-dispatcher.provider';

/**
 * NotificationsModule — owns notification generation + settings + the email-dispatch stub, and SUPPLIES
 * the real `NOTIFICATION_EMITTER` binding that Documents consumes (rebinding its seam). Imported by both
 * DocumentsModule (to deliver signature notifications) and ReportingModule (to expose the API). One-
 * directional: it imports neither — so no cycle. — RPT-009/010, arch §9
 */
@Module({
  providers: [
    NotificationsService,
    { provide: EMAIL_DISPATCHER, useClass: NoopEmailDispatcher },
    { provide: NOTIFICATION_EMITTER, useClass: NotificationEmitterAdapter },
  ],
  exports: [NotificationsService, NOTIFICATION_EMITTER],
})
export class NotificationsModule {}
