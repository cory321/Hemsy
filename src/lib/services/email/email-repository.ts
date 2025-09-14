import { SupabaseClient } from '@supabase/supabase-js';
import {
  EmailTemplate,
  EmailLog,
  ConfirmationToken,
  UserEmailSettings,
  EmailType,
  EmailLogCreate,
} from '../../../types/email';
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
      .eq('created_by', this.userId)
      .single();

    if (error) {
      // Only log non-expected errors (not "no rows found")
      if (error.code !== 'PGRST116') {
        console.error('Failed to fetch template:', error);
      }
      // Return default template as fallback
      return this.getDefaultTemplate(emailType);
    }

    return data;
  }

  async getAllTemplates(): Promise<EmailTemplate[]> {
    const { data: dbTemplates, error } = await this.supabase
      .from('email_templates')
      .select('*')
      .eq('created_by', this.userId)
      .order('email_type');

    if (error) {
      console.error('Failed to fetch templates:', error);
      // Return default templates as fallback
      return this.getDefaultTemplatesForUser();
    }

    // Get all email types that should exist
    const allEmailTypes: EmailType[] = [
      'appointment_scheduled',
      'appointment_rescheduled',
      'appointment_canceled',
      'appointment_no_show',
      'appointment_rescheduled_seamstress',
      'appointment_canceled_seamstress',
      'appointment_reminder',
      'payment_link',
      'payment_received',
      'invoice_sent',
      'appointment_confirmation_request',
      'appointment_confirmed',
    ];

    // Create a map of existing database templates by email_type
    const dbTemplateMap = new Map<EmailType, EmailTemplate>();
    if (dbTemplates) {
      dbTemplates.forEach((template) => {
        dbTemplateMap.set(template.email_type as EmailType, template);
      });
    }

    // Build the final templates list: use database template if exists, otherwise use default
    const finalTemplates: EmailTemplate[] = [];

    for (const emailType of allEmailTypes) {
      const dbTemplate = dbTemplateMap.get(emailType);
      if (dbTemplate) {
        // Use customized template from database
        finalTemplates.push(dbTemplate);
      } else {
        // Use default template
        const defaultTemplate = this.getDefaultTemplate(emailType);
        if (defaultTemplate) {
          finalTemplates.push(defaultTemplate);
        }
      }
    }

    return finalTemplates;
  }

  async updateTemplate(
    emailType: EmailType,
    updates: { subject: string; body: string }
  ): Promise<void> {
    // First check if user has a template for this email type
    const { data: existingTemplate } = await this.supabase
      .from('email_templates')
      .select('id')
      .eq('email_type', emailType)
      .eq('created_by', this.userId)
      .single();

    if (existingTemplate) {
      // Update existing template
      const { error } = await this.supabase
        .from('email_templates')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingTemplate.id);

      if (error) throw error;
    } else {
      // Insert new template
      const { error } = await this.supabase.from('email_templates').insert({
        email_type: emailType,
        ...updates,
        is_default: false,
        created_by: this.userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
    }
  }

  async resetTemplate(emailType: EmailType): Promise<void> {
    // Delete the custom template from database to fall back to default
    const { error } = await this.supabase
      .from('email_templates')
      .delete()
      .eq('email_type', emailType)
      .eq('created_by', this.userId);

    if (error) throw error;

    // After deletion, getAllTemplates() will automatically return the default template
    // for this email type, and it will have is_default: true (no "Customized" chip)
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

    // Always include appointmentId when token exists
    const appointmentId: string = data.appointment_id;

    if (data.used_at) {
      return { valid: false, reason: 'used', appointmentId };
    }

    if (new Date(data.expires_at) < new Date()) {
      return { valid: false, reason: 'expired', appointmentId };
    }

    return { valid: true, appointmentId };
  }

  async useToken(token: string): Promise<void> {
    const { error } = await this.supabase
      .from('confirmation_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('token', token);

    if (error) throw error;
  }

  async invalidateUnusedTokensForAppointment(
    appointmentId: string
  ): Promise<void> {
    const { error } = await this.supabase
      .from('confirmation_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('appointment_id', appointmentId)
      .is('used_at', null);

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
      id: `default-${emailType}`,
      email_type: emailType,
      ...template,
      is_default: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: this.userId,
    };
  }

  private getDefaultTemplatesForUser(): EmailTemplate[] {
    const defaults = get_default_email_templates();
    const emailTypes: EmailType[] = [
      'appointment_scheduled',
      'appointment_rescheduled',
      'appointment_canceled',
      'appointment_no_show',
      'appointment_rescheduled_seamstress',
      'appointment_canceled_seamstress',
      'appointment_reminder',
      'payment_link',
      'payment_received',
      'invoice_sent',
      'appointment_confirmation_request',
      'appointment_confirmed',
    ];

    return emailTypes
      .map((type) => this.getDefaultTemplate(type))
      .filter((template): template is EmailTemplate => template !== null);
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
