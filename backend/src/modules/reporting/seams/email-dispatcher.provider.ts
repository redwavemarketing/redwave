/**
 * Email dispatch seam — the external send boundary. When a NotificationEventSetting has
 * `email_enabled`, NotificationService asks this dispatcher to send. The default
 * `NoopEmailDispatcher` is a STUB (logs only) — real SMTP/provider wiring is deferred (CLAUDE §12).
 * Abstracted so the channel can be swapped without touching notification logic. — arch §9, RPT-009
 */
import { Injectable, Logger } from '@nestjs/common';

export const EMAIL_DISPATCHER = Symbol('EMAIL_DISPATCHER');

export interface EmailMessage {
  userId: string;
  subject: string;
  body: string;
}

export interface EmailDispatcher {
  send(message: EmailMessage): Promise<void>;
}

@Injectable()
export class NoopEmailDispatcher implements EmailDispatcher {
  private readonly logger = new Logger('EmailDispatcher');

  async send(message: EmailMessage): Promise<void> {
    // STUB — real delivery deferred. Record intent so the path is observable in dev.
    this.logger.debug(`[stub] email to user ${message.userId}: ${message.subject}`);
  }
}
