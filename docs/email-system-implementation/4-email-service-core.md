# Phase 2.1: Email Service Core

## Overview

Implement the core email service that handles all email operations.

## Prerequisites

- [ ] Database setup complete (Phase 1.1)
- [ ] Environment configured (Phase 1.2)
- [ ] Types defined (Phase 1.3)

## Steps

### 1. Create Resend Client Wrapper

Create `src/lib/services/email/resend-client.ts`:

```typescript
import { Resend } from 'resend';
import { emailConfig } from '@/lib/config/email.config';

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
    this.client = new Resend(emailConfig.resend.apiKey);
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
```

### 2. Create Email Repository

Create `src/lib/services/email/email-repository.ts`:

```typescript
import { SupabaseClient } from '@supabase/supabase-js';
import {
  EmailTemplate,
  EmailLog,
  ConfirmationToken,
  UserEmailSettings,
  EmailType,
  EmailLogCreate,
} from '@/types/email';
import { get_default_email_templates } from './default-templates';

export class EmailRepository {
  constructor(
    private supabase: SupabaseClient,
    private userId: string
  ) {}

  // Template operations
  async getTemplate(emailType: EmailType): Promise<EmailTemplate | null> {
    const { data, error } = await this.supabase
      .from('email_templates')
      .select('*')
      .eq('email_type', emailType)
      .single();

    if (error) {
      console.error('Failed to fetch template:', error);
      // Return default template as fallback
      return this.getDefaultTemplate(emailType);
    }

    return data;
  }

  async getAllTemplates(): Promise<EmailTemplate[]> {
    const { data, error } = await this.supabase
      .from('email_templates')
      .select('*')
      .order('email_type');

    if (error) {
      console.error('Failed to fetch templates:', error);
      return [];
    }

    return data || [];
  }

  async updateTemplate(
    emailType: EmailType,
    updates: { subject: string; body: string }
  ): Promise<void> {
    const { error } = await this.supabase.from('email_templates').upsert(
      {
        email_type: emailType,
        ...updates,
        is_default: false,
        updated_at: new Date().toISOString(),
        created_by: this.userId,
      },
      {
        onConflict: 'email_type',
      }
    );

    if (error) throw error;
  }

  async resetTemplate(emailType: EmailType): Promise<void> {
    const defaultTemplate = this.getDefaultTemplate(emailType);
    if (!defaultTemplate) throw new Error('Default template not found');

    await this.updateTemplate(emailType, {
      subject: defaultTemplate.subject,
      body: defaultTemplate.body,
    });
  }

  // Email log operations
  async createEmailLog(log: EmailLogCreate): Promise<string> {
    const { data, error } = await this.supabase
      .from('email_logs')
      .insert({
        ...log,
        created_by: this.userId,
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }

  async updateEmailLog(id: string, updates: Partial<EmailLog>): Promise<void> {
    const { error } = await this.supabase
      .from('email_logs')
      .update(updates)
      .eq('id', id)
      .eq('created_by', this.userId);

    if (error) throw error;
  }

  async getEmailLogs(filters: {
    status?: string;
    emailType?: EmailType;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: EmailLog[]; total: number }> {
    let query = this.supabase
      .from('email_logs')
      .select('*', { count: 'exact' })
      .eq('created_by', this.userId)
      .order('created_at', { ascending: false });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.emailType) {
      query = query.eq('email_type', filters.emailType);
    }
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    const limit = filters.limit || 50;
    const offset = filters.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      logs: data || [],
      total: count || 0,
    };
  }

  // Token operations
  async createConfirmationToken(
    appointmentId: string
  ): Promise<ConfirmationToken> {
    const token = this.generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const { data, error } = await this.supabase
      .from('confirmation_tokens')
      .insert({
        token,
        appointment_id: appointmentId,
        expires_at: expiresAt.toISOString(),
        created_by: this.userId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async validateToken(token: string): Promise<{
    valid: boolean;
    appointmentId?: string;
    reason?: 'expired' | 'used' | 'not_found';
  }> {
    const { data, error } = await this.supabase
      .from('confirmation_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (error || !data) {
      return { valid: false, reason: 'not_found' };
    }

    if (data.used_at) {
      return { valid: false, reason: 'used' };
    }

    if (new Date(data.expires_at) < new Date()) {
      return { valid: false, reason: 'expired' };
    }

    return { valid: true, appointmentId: data.appointment_id };
  }

  async useToken(token: string): Promise<void> {
    const { error } = await this.supabase
      .from('confirmation_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('token', token);

    if (error) throw error;
  }

  // User settings
  async getUserEmailSettings(): Promise<UserEmailSettings | null> {
    const { data, error } = await this.supabase
      .from('user_email_settings')
      .select('*')
      .eq('user_id', this.userId)
      .single();

    if (error) {
      // Create default settings if not found
      if (error.code === 'PGRST116') {
        return this.createDefaultUserSettings();
      }
      throw error;
    }

    return data;
  }

  async updateUserEmailSettings(
    updates: Partial<UserEmailSettings>
  ): Promise<void> {
    const { error } = await this.supabase.from('user_email_settings').upsert(
      {
        user_id: this.userId,
        ...updates,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      }
    );

    if (error) throw error;
  }

  // Helper methods
  private generateToken(): string {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private getDefaultTemplate(emailType: EmailType): EmailTemplate | null {
    const defaults = get_default_email_templates();
    const template = defaults[emailType];

    if (!template) return null;

    return {
      id: 'default',
      email_type: emailType,
      ...template,
      is_default: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: this.userId,
    };
  }

  private async createDefaultUserSettings(): Promise<UserEmailSettings> {
    const settings: UserEmailSettings = {
      user_id: this.userId,
      receive_appointment_notifications: true,
      email_signature: null,
      reply_to_email: null,
      updated_at: new Date().toISOString(),
    };

    await this.supabase.from('user_email_settings').insert(settings);

    return settings;
  }
}
```

### 3. Create Default Templates

Create `src/lib/services/email/default-templates.ts`:

```typescript
import { EmailType } from '@/types/email';

interface DefaultTemplate {
  subject: string;
  body: string;
}

export function get_default_email_templates(): Record<
  EmailType,
  DefaultTemplate
> {
  return {
    appointment_scheduled: {
      subject: 'Your appointment is scheduled with {shop_name}',
      body: `Hi {client_name},

Your appointment with {shop_name} is confirmed for {appointment_time}.

If you have any questions or need to reschedule, please contact us.

Thank you,
{shop_name}`,
    },
    appointment_rescheduled: {
      subject: 'Your appointment has been rescheduled',
      body: `Hi {client_name},

Your appointment with {shop_name} has been rescheduled.

Previous time: {previous_time}
New time: {appointment_time}

If you have any questions, please contact us.

Thank you,
{shop_name}`,
    },
    appointment_canceled: {
      subject: 'Your appointment has been canceled',
      body: `Hi {client_name},

Your appointment with {shop_name} scheduled for {previous_time} has been canceled.

If you have any questions, please contact us.

Thank you,
{shop_name}`,
    },
    payment_link: {
      subject: 'Your payment link from {shop_name}',
      body: `Hi {client_name},

You can pay for your order using the link below:

{payment_link}

Amount due: {amount}

If you have any questions, please contact us.

Thank you,
{shop_name}`,
    },
    appointment_confirmation_request: {
      subject: 'Please confirm your appointment with {shop_name}',
      body: `Hi {client_name},

Please confirm your appointment scheduled for {appointment_time} by clicking the link below:

{confirmation_link}

This link will expire in 24 hours.

If you have any questions, please contact us.

Thank you,
{shop_name}`,
    },
    appointment_confirmed: {
      subject: '{client_name} confirmed their appointment',
      body: `Hi {seamstress_name},

{client_name} has confirmed their appointment scheduled for {appointment_time}.

You can view all your appointments in Hemsy.

Thank you,
Hemsy`,
    },
  };
}
```

### 4. Create Main Email Service

Create `src/lib/services/email/email-service.ts`:

```typescript
import { SupabaseClient } from '@supabase/supabase-js';
import { EmailType, EmailSendResult } from '@/types/email';
import { EmailRepository } from './email-repository';
import { TemplateRenderer } from './template-renderer';
import { ResendClient, getResendClient } from './resend-client';
import { emailConfig } from '@/lib/config/email.config';
import { format } from 'date-fns';

export class EmailService {
  private repository: EmailRepository;
  private renderer: TemplateRenderer;
  private resendClient: ResendClient;

  constructor(
    private supabase: SupabaseClient,
    private userId: string
  ) {
    this.repository = new EmailRepository(supabase, userId);
    this.renderer = new TemplateRenderer();
    this.resendClient = getResendClient();
  }

  async sendAppointmentEmail(
    appointmentId: string,
    emailType: EmailType,
    additionalData?: Record<string, any>
  ): Promise<EmailSendResult> {
    try {
      // 1. Fetch appointment and related data
      const appointmentData = await this.fetchAppointmentData(appointmentId);

      // 2. Check delivery constraints
      const constraints = await this.checkDeliveryConstraints(
        appointmentData,
        emailType
      );
      if (!constraints.shouldSend) {
        console.log(`Email not sent: ${constraints.reason}`);
        return { success: true }; // Silent success
      }

      // 3. Get template
      const template = await this.repository.getTemplate(emailType);
      if (!template) {
        throw new Error(`Template not found for ${emailType}`);
      }

      // 4. Prepare email data
      const emailData = this.prepareEmailData(
        appointmentData,
        emailType,
        additionalData
      );

      // 5. Render template
      const rendered = this.renderer.render(template, emailData);

      // 6. Create log entry
      const logId = await this.repository.createEmailLog({
        email_type: emailType,
        recipient_email: appointmentData.client.email,
        recipient_name: appointmentData.client.name,
        subject: rendered.subject,
        body: rendered.body,
        status: 'pending',
        attempts: 0,
        metadata: {
          appointment_id: appointmentId,
          ...additionalData,
        },
      });

      // 7. Send email(s)
      const results = await this.sendEmails(
        emailType,
        appointmentData,
        rendered
      );

      // 8. Update log with results
      const overallSuccess = results.every((r) => r.success);
      await this.repository.updateEmailLog(logId, {
        status: overallSuccess ? 'sent' : 'failed',
        resend_id: results.find((r) => r.messageId)?.messageId,
        sent_at: overallSuccess ? new Date().toISOString() : null,
        last_error: results.find((r) => !r.success)?.error || null,
        attempts: 1,
      });

      return {
        success: overallSuccess,
        error: results.find((r) => !r.success)?.error,
        logId,
      };
    } catch (error) {
      console.error('Email service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email',
      };
    }
  }

  async sendConfirmationRequest(
    appointmentId: string
  ): Promise<EmailSendResult & { confirmationUrl?: string }> {
    try {
      // Generate confirmation token
      const token =
        await this.repository.createConfirmationToken(appointmentId);
      const confirmationUrl = `${emailConfig.urls.confirmation}/${token.token}`;

      // Send email with confirmation link
      const result = await this.sendAppointmentEmail(
        appointmentId,
        'appointment_confirmation_request',
        { confirmation_link: confirmationUrl }
      );

      return { ...result, confirmationUrl };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to send confirmation',
      };
    }
  }

  async resendEmail(emailLogId: string): Promise<EmailSendResult> {
    // Implementation for retry logic
    // This would fetch the log, increment attempts, and resend
    // For MVP, we'll keep it simple
    throw new Error('Not implemented yet');
  }

  // Private helper methods
  private async fetchAppointmentData(appointmentId: string): Promise<any> {
    const { data: appointment, error } = await this.supabase
      .from('appointments')
      .select(
        `
        *,
        client:clients(*),
        user:users(*)
      `
      )
      .eq('id', appointmentId)
      .single();

    if (error || !appointment) {
      throw new Error('Appointment not found');
    }

    // Fetch shop info from user metadata or settings
    const shopInfo = {
      name: appointment.user.business_name || 'Your Seamstress',
      seamstress_name: appointment.user.name || 'Your Seamstress',
    };

    return {
      ...appointment,
      shop: shopInfo,
    };
  }

  private async checkDeliveryConstraints(
    appointment: any,
    emailType: EmailType
  ): Promise<{ shouldSend: boolean; reason?: string }> {
    // Check if email sending is enabled
    if (!emailConfig.features.enabled) {
      return { shouldSend: false, reason: 'Email sending disabled' };
    }

    // Check client opt-out
    if (appointment.client.email_opt_out) {
      return { shouldSend: false, reason: 'Client opted out' };
    }

    // Check 1-hour cutoff for appointment emails
    if (
      [
        'appointment_scheduled',
        'appointment_rescheduled',
        'appointment_confirmation_request',
      ].includes(emailType)
    ) {
      const hoursUntilAppointment =
        (new Date(appointment.start_time).getTime() - Date.now()) /
        (1000 * 60 * 60);

      if (hoursUntilAppointment < EMAIL_CONSTRAINTS.hourCutoff) {
        return { shouldSend: false, reason: 'Too close to appointment time' };
      }
    }

    // Check seamstress preferences for notification emails
    if (emailType === 'appointment_confirmed') {
      const settings = await this.repository.getUserEmailSettings();
      if (settings && !settings.receive_appointment_notifications) {
        return {
          shouldSend: false,
          reason: 'Seamstress opted out of notifications',
        };
      }
    }

    return { shouldSend: true };
  }

  private prepareEmailData(
    appointment: any,
    emailType: EmailType,
    additionalData?: Record<string, any>
  ): Record<string, string> {
    const baseData = {
      client_name: appointment.client.name,
      appointment_time: this.formatAppointmentTime(appointment.start_time),
      shop_name: appointment.shop.name,
      seamstress_name: appointment.shop.seamstress_name,
      ...additionalData,
    };

    // Add type-specific data
    if (
      emailType === 'appointment_rescheduled' &&
      additionalData?.previous_time
    ) {
      baseData.previous_time = this.formatAppointmentTime(
        additionalData.previous_time
      );
    }

    if (emailType === 'appointment_canceled' && additionalData?.previous_time) {
      baseData.previous_time = this.formatAppointmentTime(
        additionalData.previous_time
      );
    }

    return baseData;
  }

  private formatAppointmentTime(dateString: string): string {
    return format(new Date(dateString), 'EEEE, MMMM d at h:mm a');
  }

  private async sendEmails(
    emailType: EmailType,
    appointmentData: any,
    rendered: { subject: string; body: string }
  ): Promise<Array<{ success: boolean; error?: string; messageId?: string }>> {
    const results = [];

    // Send to client (most email types)
    if (emailType !== 'appointment_confirmed') {
      const clientResult = await this.resendClient.send({
        to: appointmentData.client.email,
        subject: rendered.subject,
        text: rendered.body,
      });
      results.push(clientResult);
    }

    // Send to seamstress (specific types)
    if (
      [
        'appointment_scheduled',
        'appointment_rescheduled',
        'appointment_canceled',
        'appointment_confirmed',
      ].includes(emailType)
    ) {
      const settings = await this.repository.getUserEmailSettings();

      if (!settings || settings.receive_appointment_notifications) {
        // Render seamstress version
        const seamstressTemplate = await this.repository.getTemplate(emailType);
        if (seamstressTemplate) {
          const seamstressRendered = this.renderer.render(
            seamstressTemplate,
            this.prepareEmailData(appointmentData, emailType)
          );

          const seamstressResult = await this.resendClient.send({
            to: appointmentData.user.email,
            subject: seamstressRendered.subject,
            text: seamstressRendered.body,
          });
          results.push(seamstressResult);
        }
      }
    }

    return results;
  }
}
```

## Testing

Create `src/__tests__/unit/services/email/email-service.test.ts`:

```typescript
import { EmailService } from '@/lib/services/email/email-service';
import { createMockSupabaseClient } from '@/lib/testing/mocks';

describe('EmailService', () => {
  let emailService: EmailService;
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    emailService = new EmailService(mockSupabase, 'test-user-id');
  });

  describe('sendAppointmentEmail', () => {
    it('sends appointment scheduled email successfully', async () => {
      // Mock appointment data
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'test-appointment',
            start_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
            client: {
              name: 'Test Client',
              email: 'client@test.com',
              email_opt_out: false,
            },
            user: {
              name: 'Test Seamstress',
              email: 'seamstress@test.com',
              business_name: 'Test Shop',
            },
          },
        }),
      });

      const result = await emailService.sendAppointmentEmail(
        'test-appointment',
        'appointment_scheduled'
      );

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('respects 1-hour cutoff', async () => {
      // Mock appointment starting in 30 minutes
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            start_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
            // ... other data
          },
        }),
      });

      const result = await emailService.sendAppointmentEmail(
        'test-appointment',
        'appointment_scheduled'
      );

      expect(result.success).toBe(true); // Silent success
      expect(result.error).toBeUndefined();
    });
  });
});
```

## Verification

1. **Service instantiation**:

   ```typescript
   const service = new EmailService(supabase, userId);
   ```

2. **Send test email**:
   ```typescript
   const result = await service.sendAppointmentEmail(
     'appointment-id',
     'appointment_scheduled'
   );
   console.log('Email sent:', result);
   ```

## Common Issues

| Issue                     | Solution                            |
| ------------------------- | ----------------------------------- |
| Supabase connection error | Check Supabase client configuration |
| Template not found        | Ensure default templates are seeded |
| Email not sending         | Check preview mode is disabled      |
| Type errors               | Ensure all imports are correct      |

## Next Steps

Proceed to [Template Renderer](./5-template-renderer.md)
