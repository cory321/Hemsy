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

  constructor() {
    this.client = new Resend(process.env.RESEND_API_KEY);
    this.isPreviewMode = emailConfig.features.previewMode;
  }

  async send(payload: SendEmailPayload): Promise<SendEmailResult> {
    // In preview mode, log instead of sending
    if (this.isPreviewMode) {
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
      const { data, error } = await this.client.emails.send({
        from:
          payload.from ||
          `${emailConfig.sender.name} <${emailConfig.sender.address}>`,
        to: Array.isArray(payload.to) ? payload.to : [payload.to],
        subject: payload.subject,
        text: payload.text + EMAIL_FOOTER,
        reply_to: payload.replyTo || emailConfig.sender.replyTo,
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        messageId: data?.id,
      };
    } catch (error) {
      console.error('Resend client error:', error);
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
