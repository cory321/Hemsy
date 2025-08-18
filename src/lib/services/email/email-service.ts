import { SupabaseClient } from '@supabase/supabase-js';
import { EmailType, EmailSendResult } from '../../../types/email';
import { EmailRepository } from './email-repository';
import { TemplateRenderer } from './template-renderer';
import { ResendClient, getResendClient } from './resend-client';
import { emailConfig } from '../../config/email.config';
import { EMAIL_CONSTRAINTS } from '../../utils/email/constants';
import { format } from 'date-fns';
import { getShopDisplayName } from '@/lib/auth/user-shop';

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
      // Generic idempotency guard (applies to all types EXCEPT reschedules)
      if (emailType !== 'appointment_rescheduled') {
        const { data: existingLogs } = await this.supabase
          .from('email_logs')
          .select('id, created_at')
          .eq('email_type', emailType)
          .eq('created_by', this.userId)
          .contains('metadata', { appointment_id: appointmentId })
          .order('created_at', { ascending: false })
          .limit(1);

        if (existingLogs && existingLogs.length > 0) {
          const existing = existingLogs[0] as { id: string } | undefined;
          if (existing?.id) {
            console.log(
              'ℹ️ EmailService: Skipping send due to existing email_log (idempotency):',
              { appointmentId, emailType, existingLogId: existing.id }
            );
            return { success: true, logId: existing.id };
          }
        }
      }

      console.log(`📧 EmailService.sendAppointmentEmail called with:`, {
        appointmentId,
        emailType,
        additionalData,
      });

      // 1. Fetch appointment and related data
      console.log(`🔍 Fetching appointment data for ID: ${appointmentId}`);
      const appointmentData = await this.fetchAppointmentData(appointmentId);
      console.log(`✅ Appointment data fetched:`, {
        id: appointmentData.id,
        status: appointmentData.status,
        clientEmail: appointmentData.client?.email,
        clientAcceptEmail: appointmentData.client?.accept_email,
      });

      // Reschedule-specific dedupe: only suppress identical reschedule within short window
      if (emailType === 'appointment_rescheduled') {
        const previousTimeRaw: string | undefined =
          additionalData?.previous_time;
        const newTimeRaw: string = `${appointmentData.date} ${appointmentData.start_time}`;
        const rescheduleKey = `${previousTimeRaw || 'unknown'}->${newTimeRaw}`;

        const { data: existingReschedules } = await this.supabase
          .from('email_logs')
          .select('id, created_at')
          .eq('email_type', 'appointment_rescheduled')
          .eq('created_by', this.userId)
          .contains('metadata', {
            appointment_id: appointmentId,
            reschedule_key: rescheduleKey,
          })
          .order('created_at', { ascending: false })
          .limit(1);

        if (existingReschedules && existingReschedules.length > 0) {
          const existing = existingReschedules[0] as {
            id: string;
            created_at?: string;
          };
          const createdAt = existing?.created_at
            ? new Date(existing.created_at).getTime()
            : 0;
          const windowMs = (EMAIL_CONSTRAINTS as any).rescheduleDedupeMinutes
            ? (EMAIL_CONSTRAINTS as any).rescheduleDedupeMinutes * 60 * 1000
            : 5 * 60 * 1000; // default 5 minutes
          const cutoff = Date.now() - windowMs;
          if (createdAt > cutoff) {
            console.log(
              'ℹ️ EmailService: Skipping send due to recent duplicate reschedule (idempotency window):',
              {
                appointmentId,
                emailType,
                existingLogId: existing.id,
                rescheduleKey,
              }
            );
            return { success: true, logId: existing.id };
          }
        }
      }

      // 2. Check delivery constraints
      console.log(`🔒 Checking delivery constraints...`);
      const constraints = await this.checkDeliveryConstraints(
        appointmentData,
        emailType
      );
      console.log(`🔒 Delivery constraints result:`, constraints);
      if (!constraints.shouldSend) {
        console.log(`❌ Email not sent: ${constraints.reason}`);
        return { success: true }; // Silent success
      }

      // 3. Get template
      const template = await this.repository.getTemplate(emailType);
      if (!template) {
        throw new Error(`Template not found for ${emailType}`);
      }
      console.log('🧩 Email template resolved:', {
        emailType,
        templateId: template.id,
        isDefault: template.is_default,
        subjectPreview: template.subject.substring(0, 80),
      });

      // 4. Prepare email data
      let emailData = this.prepareEmailData(
        appointmentData,
        emailType,
        additionalData
      );

      // If sending scheduled email for a pending appointment, include confirmation link
      // We generate a token and link similar to sendConfirmationRequest, but inline here
      if (
        emailType === 'appointment_scheduled' &&
        appointmentData.status === 'pending'
      ) {
        const token =
          await this.repository.createConfirmationToken(appointmentId);
        const confirmationUrl = `${emailConfig.urls.confirmation}/${token.token}`;
        emailData = { ...emailData, confirmation_link: confirmationUrl };
      }

      // 5. Render template
      const rendered = this.renderer.render(template, emailData);
      console.log('🖨️ Rendered email:', {
        emailType,
        subject: rendered.subject,
        bodyPreview: rendered.body.substring(0, 160) + '...',
      });

      // 6. Create log entry
      const logId = await this.repository.createEmailLog({
        email_type: emailType,
        recipient_email: appointmentData.client.email,
        recipient_name: `${appointmentData.client.first_name} ${appointmentData.client.last_name}`,
        subject: rendered.subject,
        body: rendered.body,
        status: 'pending',
        attempts: 0,
        last_error: null,
        metadata: {
          appointment_id: appointmentId,
          ...additionalData,
          ...(emailType === 'appointment_rescheduled'
            ? {
                reschedule_key: `${additionalData?.previous_time || 'unknown'}->${appointmentData.date} ${appointmentData.start_time}`,
                previous_time_raw: additionalData?.previous_time || null,
                new_time_raw: `${appointmentData.date} ${appointmentData.start_time}`,
              }
            : {}),
        },
        resend_id: null,
        sent_at: null,
      });
      console.log('📝 Created email_log entry:', {
        logId,
        emailType,
        appointmentId,
      });

      // 7. Send email(s)
      const results = await this.sendEmails(
        emailType,
        appointmentData,
        rendered,
        additionalData
      );
      console.log('📬 Send results:', results);

      // 8. Update log with results
      const overallSuccess = results.every((r) => r.success);
      await this.repository.updateEmailLog(logId, {
        status: overallSuccess ? 'sent' : 'failed',
        resend_id: results.find((r) => r.messageId)?.messageId || null,
        sent_at: overallSuccess ? new Date().toISOString() : null,
        last_error: results.find((r) => !r.success)?.error || null,
        attempts: 1,
      });

      const errorMsg = results.find((r) => !r.success)?.error;
      return {
        success: overallSuccess,
        ...(errorMsg ? { error: errorMsg } : {}),
        logId,
      };
    } catch (error) {
      console.error('❌ EmailService error:', error);
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
        shop:shops(*)
      `
      )
      .eq('id', appointmentId)
      .single();

    if (error || !appointment) {
      throw new Error('Appointment not found');
    }

    // Fetch shop info from shop record
    const shopInfo = {
      name:
        appointment.shop?.business_name ||
        appointment.shop?.name ||
        'Your Seamstress',
      seamstress_name: appointment.shop?.business_name || 'Your Seamstress',
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
    if (appointment.client.accept_email === false) {
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
      const appointmentDateTime = new Date(
        `${appointment.date} ${appointment.start_time}`
      );
      const hoursUntilAppointment =
        (appointmentDateTime.getTime() - Date.now()) / (1000 * 60 * 60);

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
      client_name: `${appointment.client.first_name} ${appointment.client.last_name}`,
      appointment_time: this.formatAppointmentTime(
        `${appointment.date} ${appointment.start_time}`
      ),
      shop_name: getShopDisplayName(appointment.shop),
      seamstress_name: appointment.shop.seamstress_name,
      ...additionalData,
    };

    // Add type-specific data
    if (
      emailType === 'appointment_rescheduled' &&
      additionalData?.previous_time
    ) {
      (baseData as any).previous_time = this.formatAppointmentTime(
        additionalData.previous_time
      );
    }

    if (emailType === 'appointment_canceled' && additionalData?.previous_time) {
      (baseData as any).previous_time = this.formatAppointmentTime(
        additionalData.previous_time
      );
    }

    return baseData;
  }

  private formatAppointmentTime(dateString: string): string {
    // Wrap literal text in single quotes per date-fns formatting rules
    return format(new Date(dateString), "EEEE, MMMM d 'at' h:mm a");
  }

  private async sendEmails(
    emailType: EmailType,
    appointmentData: any,
    rendered: { subject: string; body: string },
    additionalData?: Record<string, any>
  ): Promise<Array<{ success: boolean; error?: string; messageId?: string }>> {
    const results = [];

    // Send to client (most email types)
    if (emailType !== 'appointment_confirmed') {
      console.log('➡️ Sending email to client...', {
        to: appointmentData.client.email,
        emailType,
      });
      const clientResult = await this.resendClient.send({
        to: appointmentData.client.email,
        subject: rendered.subject,
        text: rendered.body,
      });
      console.log('⬅️ Client send result:', clientResult);
      results.push(clientResult);
    }

    // Send to seamstress (specific types)
    if (
      [
        // Do NOT notify seamstress on initial scheduled (pending) email
        'appointment_rescheduled',
        'appointment_canceled',
        'appointment_confirmed',
      ].includes(emailType)
    ) {
      const settings = await this.repository.getUserEmailSettings();

      if (!settings || settings.receive_appointment_notifications) {
        // Render seamstress version
        const seamstressTemplateType = ((): EmailType => {
          if (emailType === 'appointment_rescheduled') {
            return 'appointment_rescheduled_seamstress';
          }
          if (emailType === 'appointment_canceled') {
            return 'appointment_canceled_seamstress';
          }
          return 'appointment_confirmed';
        })();

        const seamstressTemplate = await this.repository.getTemplate(
          seamstressTemplateType
        );
        if (seamstressTemplate) {
          const seamstressRendered = this.renderer.render(
            seamstressTemplate,
            this.prepareEmailData(
              appointmentData,
              seamstressTemplateType,
              additionalData
            )
          );

          const seamstressTo =
            appointmentData.shop?.email || emailConfig.sender.address;
          console.log('➡️ Sending email to seamstress...', {
            to: seamstressTo,
            emailType,
          });
          const seamstressResult = await this.resendClient.send({
            to: seamstressTo,
            subject: seamstressRendered.subject,
            text: seamstressRendered.body,
          });
          console.log('⬅️ Seamstress send result:', seamstressResult);
          results.push(seamstressResult);
        }
      }
    }

    return results;
  }
}
