import type { Env } from '../config/env.js';
import type { Logger } from './logger.js';

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

/**
 * Transactional email via Resend when configured; logs in development otherwise.
 */
export class EmailService {
  /**
   * @param env - Application environment.
   * @param logger - Structured logger (no PII in log fields).
   */
  constructor(
    private readonly env: Env,
    private readonly logger: Logger,
  ) {}

  /**
   * Send an email when Resend is configured.
   *
   * @param input - Recipient and message body.
   */
  async send(input: SendEmailInput): Promise<void> {
    if (!this.env.RESEND_API_KEY || !this.env.EMAIL_FROM) {
      this.logger.info(
        { userIdHint: 'email-dev', subject: input.subject },
        'Email skipped (Resend not configured)',
      );
      return;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.env.EMAIL_FROM,
        to: input.to,
        subject: input.subject,
        html: input.html,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      this.logger.error({ status: response.status, body }, 'Resend API error');
      throw new Error('Failed to send email');
    }
  }
}
