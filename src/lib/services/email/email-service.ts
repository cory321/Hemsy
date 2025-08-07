import { SupabaseClient } from '@supabase/supabase-js';
import { EmailType, EmailSendResult } from '../../../types/email';
import { EmailRepository } from './email-repository';
import { TemplateRenderer } from './template-renderer';
import { ResendClient, getResendClient } from './resend-client';
import { emailConfig } from '../../config/email.config';
import { EMAIL_CONSTRAINTS } from '../../utils/email/constants';
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
        recipient_name: `${appointmentData.client.first_name} ${appointmentData.client.last_name}`,
        subject: rendered.subject,
        body: rendered.body,
        status: 'pending',
        attempts: 0,
        metadata: {
          appointment_id: appointmentId,
          ...additionalData,
        },
        resend_id: null,
        sent_at: null,
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
