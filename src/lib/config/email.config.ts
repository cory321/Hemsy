import { Resend } from 'resend';

// Create Resend instance following official patterns
export const resend = new Resend(process.env.RESEND_API_KEY);

// Email configuration
export const emailConfig = {
  sender: {
    address: process.env.EMAIL_FROM_ADDRESS || 'onboarding@resend.dev',
    name: process.env.EMAIL_FROM_NAME || 'Hemsy',
    replyTo: process.env.EMAIL_REPLY_TO,
    // Following Resend format: "Name <email@domain.com>"
    get formatted() {
      return `${this.name} <${this.address}>`;
    },
  },
  features: {
    previewMode: process.env.EMAIL_PREVIEW_MODE === 'true',
    enabled: process.env.ENABLE_EMAIL_SENDING !== 'false',
    logLevel: process.env.EMAIL_LOG_LEVEL || 'info',
  },
  limits: {
    ratePerHour: parseInt(process.env.EMAIL_RATE_LIMIT_PER_HOUR || '100'),
  },
  urls: {
    app: process.env.NEXT_PUBLIC_APP_URL!,
    confirmation: process.env.NEXT_PUBLIC_CONFIRMATION_URL!,
  },
  dev: {
    overrideRecipient: process.env.EMAIL_DEV_OVERRIDE || null,
  },
} as const;

// Validation
if (!process.env.RESEND_API_KEY && emailConfig.features.enabled) {
  throw new Error('RESEND_API_KEY is required when email sending is enabled');
}
