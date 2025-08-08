import { Resend } from 'resend';
import { emailConfig } from '../../config/email.config';
import { EMAIL_FOOTER } from '../../utils/email/constants';

export interface SendEmailPayload {
  to: string | string[];
  subject: string;
  text: string;
  from?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class ResendClient {
  private client: Resend;
  private isPreviewMode: boolean;
  private devOverrideRecipient: string | null;

  constructor() {
    this.client = new Resend(process.env.RESEND_API_KEY);
    this.isPreviewMode = emailConfig.features.previewMode;
    // In non-production, allow optional override to a single inbox when explicitly set
    this.devOverrideRecipient =
      process.env.NODE_ENV !== 'production'
        ? process.env.EMAIL_DEV_OVERRIDE || null
        : null;
  }

  async send(payload: SendEmailPayload): Promise<SendEmailResult> {
    // In preview mode, log instead of sending, unless we have a dev override to actually send to test inbox
    if (this.isPreviewMode && !this.devOverrideRecipient) {
      console.log('📧 Email Preview:', {
        to: payload.to,
        subject: payload.subject,
        body: payload.text.substring(0, 200) + '...',
      });
      return {
        success: true,
        messageId: `preview_${Date.now()}`,
      };
    }

    try {
      console.log('📨 ResendClient.send called', {
        to: Array.isArray(payload.to) ? payload.to : [payload.to],
        subject: payload.subject,
      });
      // In non-production with override set, redirect emails to test inbox
      const finalTo = this.devOverrideRecipient
        ? [this.devOverrideRecipient]
        : Array.isArray(payload.to)
          ? payload.to
          : [payload.to];

      const { data, error } = await this.client.emails.send({
        from:
          payload.from ||
          `${emailConfig.sender.name} <${emailConfig.sender.address}>`,
        to: finalTo,
        subject: payload.subject,
        text: payload.text + EMAIL_FOOTER,
        reply_to: payload.replyTo || emailConfig.sender.replyTo,
      });

      if (error) {
        console.error('❌ Resend API error:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      console.log('✅ Resend API success:', { id: data?.id });
      return {
        success: true,
        messageId: data?.id,
      };
    } catch (error) {
      console.error('❌ Resend client exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async sendBatch(payloads: SendEmailPayload[]): Promise<SendEmailResult[]> {
    // For MVP, just send individually
    // Future: Use Resend batch API
    return Promise.all(payloads.map((p) => this.send(p)));
  }
}

// Singleton instance
let resendClient: ResendClient | null = null;

export function getResendClient(): ResendClient {
  if (!resendClient) {
    resendClient = new ResendClient();
  }
  return resendClient;
}
