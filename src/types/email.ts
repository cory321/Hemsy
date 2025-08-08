// Email type enum - matches database constraint
export type EmailType =
  | 'appointment_scheduled'
  | 'appointment_rescheduled'
  | 'appointment_canceled'
  | 'appointment_no_show'
  | 'appointment_rescheduled_seamstress'
  | 'appointment_canceled_seamstress'
  | 'payment_link'
  | 'appointment_confirmation_request'
  | 'appointment_confirmed';

// Email status enum - matches database constraint
export type EmailStatus =
  | 'pending'
  | 'sent'
  | 'failed'
  | 'bounced'
  | 'complained';

// Email template stored in database
export interface EmailTemplate {
  id: string;
  email_type: EmailType;
  subject: string;
  body: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

// Email log entry
export interface EmailLog {
  id: string;
  email_type: EmailType;
  recipient_email: string;
  recipient_name: string;
  subject: string;
  body: string;
  status: EmailStatus;
  attempts: number;
  last_error: string | null;
  resend_id: string | null;
  metadata: {
    appointment_id?: string;
    client_id?: string;
    previous_time?: string;
    [key: string]: any;
  };
  sent_at: string | null;
  created_at: string;
  created_by: string;
}

// Confirmation token
export interface ConfirmationToken {
  id: string;
  token: string;
  appointment_id: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
  created_by: string;
}

// User email settings
export interface UserEmailSettings {
  user_id: string;
  receive_appointment_notifications: boolean;
  email_signature: string | null;
  reply_to_email: string | null;
  updated_at: string;
}

// Variable definition for template editor
export interface EmailVariable {
  key: string;
  description: string;
  example: string;
}

// Email variables configuration
export interface EmailVariableConfig {
  email_type: EmailType;
  variables: EmailVariable[];
  sample_data: Record<string, string>;
}

// Form data types
export interface EmailTemplateFormData {
  subject: string;
  body: string;
}

export interface EmailSettingsFormData {
  receive_appointment_notifications: boolean;
  email_signature?: string;
  reply_to_email?: string;
}

// API response types
export interface EmailSendResult {
  success: boolean;
  error?: string;
  messageId?: string;
  logId?: string;
}

export interface EmailPreviewResult {
  subject: string;
  body: string;
}

// Query parameter types
export interface EmailLogQuery {
  status?: EmailStatus;
  emailType?: EmailType;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface EmailStatistics {
  total: number;
  sent: number;
  failed: number;
  pending: number;
  byType: Record<EmailType, number>;
  dailyCounts: Array<{
    date: string;
    count: number;
  }>;
}

// Utility types
export type EmailTemplateUpdate = Partial<
  Pick<EmailTemplate, 'subject' | 'body'>
>;

export type EmailLogCreate = Omit<EmailLog, 'id' | 'created_at' | 'created_by'>;

// Type guards
export function isEmailType(value: string): value is EmailType {
  return [
    'appointment_scheduled',
    'appointment_rescheduled',
    'appointment_canceled',
    'appointment_no_show',
    'payment_link',
    'appointment_confirmation_request',
    'appointment_confirmed',
  ].includes(value);
}

export function isEmailStatus(value: string): value is EmailStatus {
  return ['pending', 'sent', 'failed', 'bounced', 'complained'].includes(value);
}
