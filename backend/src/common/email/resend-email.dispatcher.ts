/**
 * ResendEmailDispatcher — the real EMAIL_DISPATCHER binding for the notification seam. When a notification
 * event has `email_enabled`, this resolves the user's email and sends it via the MailerService (Resend,
 * env-gated graceful). Replaces the NoopEmailDispatcher. — RPT-009, AUTH-002
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailDispatcher, EmailMessage } from '../../modules/reporting/seams/email-dispatcher.provider';
import { MailerService } from './mailer.service';

const escapeHtml = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

@Injectable()
export class ResendEmailDispatcher implements EmailDispatcher {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailer: MailerService,
  ) {}

  async send(message: EmailMessage): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: message.userId }, select: { email: true } });
    if (!user) {
      return;
    }
    await this.mailer.send(user.email, message.subject, `<p>${escapeHtml(message.body)}</p>`);
  }
}
