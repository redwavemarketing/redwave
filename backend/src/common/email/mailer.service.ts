/**
 * MailerService — transactional email via Resend, env-gated + graceful. Reads RESEND_API_KEY / EMAIL_FROM /
 * APP_URL; with no key it logs the intent (so the path is observable in dev and the build/tests pass without
 * a provider). Sends are BEST-EFFORT (never throw to the caller — a failed email must not break a user
 * create / forgot-password flow). Used for invite + password-reset + temp-password mail. — AUTH-002
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

const escapeHtml = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly resend: Resend | null;
  private readonly from: string;
  private readonly appUrl: string;

  constructor(config: ConfigService) {
    const key = config.get<string>('RESEND_API_KEY');
    this.from = config.get<string>('EMAIL_FROM') ?? 'Redwave <noreply@app.redwavemarketing.ca>';
    this.appUrl = (config.get<string>('APP_URL') ?? 'http://localhost:5173').replace(/\/+$/, '');
    this.resend = key ? new Resend(key) : null;
  }

  isConfigured(): boolean {
    return this.resend !== null;
  }

  /** Send an email; logs + swallows errors (best-effort). */
  async send(to: string, subject: string, html: string): Promise<void> {
    if (!this.resend) {
      this.logger.log(`[email stub] to=${to} subject="${subject}" (set RESEND_API_KEY to deliver)`);
      return;
    }
    try {
      const { error } = await this.resend.emails.send({ from: this.from, to, subject, html });
      if (error) {
        this.logger.error(`email to ${to} failed: ${error.message}`);
      }
    } catch (e) {
      this.logger.error(`email to ${to} threw: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  inviteLink(token: string): string {
    return `${this.appUrl}/set-password?token=${token}`;
  }
  resetLink(token: string): string {
    return `${this.appUrl}/reset-password?token=${token}`;
  }

  async sendInvite(to: string, name: string, token: string): Promise<void> {
    await this.send(
      to,
      'You’ve been invited to Redwave',
      wrap(`<p>Hi ${escapeHtml(name)},</p>
        <p>An administrator created a Redwave account for you. Set your password to get started:</p>
        ${button('Set your password', this.inviteLink(token))}
        <p class="muted">This link expires in 7 days. If you weren’t expecting this, you can ignore this email.</p>`),
    );
  }

  async sendPasswordReset(to: string, name: string, token: string): Promise<void> {
    await this.send(
      to,
      'Reset your Redwave password',
      wrap(`<p>Hi ${escapeHtml(name)},</p>
        <p>We received a request to reset your Redwave password. Click below to choose a new one:</p>
        ${button('Reset password', this.resetLink(token))}
        <p class="muted">This link expires in 1 hour. If you didn’t request this, you can safely ignore this email — your password won’t change.</p>`),
    );
  }

  async sendTempPassword(to: string, name: string, tempPassword: string): Promise<void> {
    await this.send(
      to,
      'Your Redwave temporary password',
      wrap(`<p>Hi ${escapeHtml(name)},</p>
        <p>An administrator issued you a temporary password. Sign in with it and you’ll be asked to set a new one:</p>
        <p style="font-family:monospace;font-size:18px;background:#f4f4f5;padding:10px 14px;border-radius:6px;display:inline-block">${escapeHtml(tempPassword)}</p>
        ${button('Sign in', `${this.appUrl}/login`)}
        <p class="muted">For your security, change this password as soon as you sign in.</p>`),
    );
  }
}

const button = (label: string, href: string): string =>
  `<p><a href="${href}" style="display:inline-block;background:#ff6600;color:#fff;text-decoration:none;padding:10px 18px;border-radius:6px">${label}</a></p>
   <p class="muted">Or paste this link into your browser:<br><a href="${href}">${href}</a></p>`;

const wrap = (inner: string): string =>
  `<div style="font-family:system-ui,Segoe UI,Helvetica,Arial,sans-serif;color:#18181b;max-width:520px;margin:0 auto">
     <h2 style="color:#ff6600">Redwave</h2>${inner}
     <hr style="border:none;border-top:1px solid #e4e4e7;margin:20px 0">
     <p style="color:#71717a;font-size:12px">Redwave Marketing Inc.</p>
   </div>`.replace(/class="muted"/g, 'style="color:#71717a;font-size:13px"');
