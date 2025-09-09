'use server';

import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { EmailRepository } from '@/lib/services/email/email-repository';
import { UserEmailSettings, EmailType } from '@/types/email';
import { UserEmailSettingsSchema } from '@/lib/validations/email';
import { revalidatePath } from 'next/cache';
import { ensureUserAndShop } from '../users';
import { EmailService } from '@/lib/services/email/email-service';
import { TemplateRenderer } from '@/lib/services/email/template-renderer';
import { Shop } from '@/types';
import { format } from 'date-fns';

/**
 * Get user email settings
 */
export async function getUserEmailSettings(): Promise<{
  success: boolean;
  data?: UserEmailSettings;
  error?: string;
}> {
  try {
    const { user } = await ensureUserAndShop();

    const supabase = await createClient();
    const repository = new EmailRepository(supabase, user.id);

    const settings = await repository.getUserEmailSettings();

    if (!settings) {
      // Return default settings if none exist
      return {
        success: true,
        data: {
          user_id: user.id,
          receive_appointment_notifications: true,
          email_signature: null,
          reply_to_email: null,
          updated_at: new Date().toISOString(),
        },
      };
    }

    return { success: true, data: settings };
  } catch (error) {
    console.error('Failed to get user email settings:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return {
      success: false,
      error: 'Failed to load email settings',
    };
  }
}

/**
 * Update user email settings
 */
export async function updateUserEmailSettings(
  input: z.infer<typeof UserEmailSettingsSchema>
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Validate input
    const validatedData = UserEmailSettingsSchema.parse(input);

    const { user } = await ensureUserAndShop();

    const supabase = await createClient();
    const repository = new EmailRepository(supabase, user.id);

    // Convert validated data to the format expected by repository
    const updates: Partial<UserEmailSettings> = {
      receive_appointment_notifications:
        validatedData.receive_appointment_notifications,
      email_signature: validatedData.email_signature ?? null,
      reply_to_email: validatedData.reply_to_email ?? null,
    };

    await repository.updateUserEmailSettings(updates);

    // Revalidate the settings page
    revalidatePath('/settings');

    return { success: true };
  } catch (error) {
    console.error('Failed to update user email settings:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || 'Invalid settings data',
      };
    }

    return {
      success: false,
      error: 'Failed to update email settings',
    };
  }
}

/**
 * Test email delivery
 */
export async function testEmailDelivery(testEmail?: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { user } = await ensureUserAndShop();

    const supabase = await createClient();

    // Get user email
    const userData = { email: user.email };

    const recipientEmail = testEmail || userData?.email;

    if (!recipientEmail) {
      return { success: false, error: 'No email address provided' };
    }

    // Send test email via Resend
    const { getResendClient } = await import(
      '@/lib/services/email/resend-client'
    );
    const resendClient = getResendClient();

    const result = await resendClient.send({
      to: recipientEmail,
      subject: 'Hemsy Email Test',
      text: 'This is a test email from your Hemsy email system. If you received this, your email configuration is working correctly!',
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to send test email',
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to send test email:', error);
    return {
      success: false,
      error: 'Failed to send test email',
    };
  }
}

/**
 * Send test email with a specific template
 */
export async function testEmailTemplate(
  emailType: EmailType,
  testEmail?: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { user, shop } = await ensureUserAndShop();

    if (!shop) {
      return { success: false, error: 'Shop not found' };
    }

    const supabase = await createClient();
    const emailService = new EmailService(supabase, user.id);

    const recipientEmail = testEmail || user.email;

    if (!recipientEmail) {
      return { success: false, error: 'No email address provided' };
    }

    // Get the template - first try user's custom template
    // Order by updated_at desc to ensure we get the latest version
    // eslint-disable-next-line prefer-const
    let { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('created_by', user.id)
      .eq('email_type', emailType)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    console.log('Test email - fetched user template:', {
      emailType,
      userId: user.id,
      template: template
        ? { id: template.id, subject: template.subject.substring(0, 50) }
        : null,
      error: templateError,
    });

    // If no user template exists, try to get the default template
    if (!template) {
      const { data: defaultTemplate } = await supabase
        .from('email_templates')
        .select('*')
        .eq('email_type', emailType)
        .eq('is_default', true)
        .single();

      template = defaultTemplate;
    }

    // If still no template, return an error (do not fallback to hardcoded defaults for tests)
    if (!template) {
      return { success: false, error: 'Template not found' };
    }

    // Create sample data for the template
    const sampleData = getSampleDataForEmailType(emailType, shop as Shop);

    // Render the template
    const renderer = new TemplateRenderer();
    const rendered = renderer.render(template, sampleData);

    // Send the test email
    const { getResendClient } = await import(
      '@/lib/services/email/resend-client'
    );
    const resendClient = getResendClient();

    const result = await resendClient.send({
      to: recipientEmail,
      subject: `[TEST] ${rendered.subject}`,
      text: rendered.body.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to send test email',
      };
    }

    // Log the test email
    await supabase.from('email_logs').insert({
      created_by: user.id,
      email_type: emailType,
      recipient_email: recipientEmail,
      recipient_name: 'Test Recipient',
      subject: `[TEST] ${rendered.subject}`,
      body: rendered.body,
      status: 'sent',
      attempts: 1,
      resend_id: result.messageId || null,
      sent_at: new Date().toISOString(),
      metadata: { is_test: true },
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to send test template email:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to send test email',
    };
  }
}

/**
 * Helper function to generate sample data for different email types
 */
function getSampleDataForEmailType(emailType: EmailType, shop: Shop): any {
  const baseData = {
    shop_name: shop.business_name || 'Your Shop',
    shop_email: shop.business_email || 'shop@example.com',
    shop_phone: shop.business_phone || '(555) 123-4567',
    shop_address: shop.business_address || '123 Main St, City, State 12345',
    client_name: 'Jane Smith',
    client_email: 'jane.smith@example.com',
    client_phone: '(555) 987-6543',
  };

  const appointmentDate = new Date();
  appointmentDate.setDate(appointmentDate.getDate() + 3); // 3 days from now

  switch (emailType) {
    case 'appointment_scheduled':
      return {
        ...baseData,
        appointment_date: format(appointmentDate, 'EEEE, MMMM d, yyyy'),
        appointment_time: format(appointmentDate, 'h:mm a'),
        service_type: 'Dress Alteration',
        notes: 'Please bring the dress and shoes you plan to wear.',
      };

    case 'appointment_rescheduled':
      return {
        ...baseData,
        appointment_date: format(appointmentDate, 'EEEE, MMMM d, yyyy'),
        appointment_time: format(appointmentDate, 'h:mm a'),
        previous_time: 'Monday, January 15, 2024 at 2:00 PM',
        service_type: 'Dress Alteration',
        notes: 'Please bring the dress and shoes you plan to wear.',
      };

    case 'appointment_canceled':
      return {
        ...baseData,
        previous_time:
          format(appointmentDate, 'EEEE, MMMM d, yyyy') +
          ' at ' +
          format(appointmentDate, 'h:mm a'),
        service_type: 'Dress Alteration',
      };

    case 'appointment_reminder':
      return {
        ...baseData,
        appointment_date: format(appointmentDate, 'EEEE, MMMM d, yyyy'),
        appointment_time: format(appointmentDate, 'h:mm a'),
        service_type: 'Dress Alteration',
        notes: 'Please bring the dress and shoes you plan to wear.',
      };

    case 'appointment_confirmed':
      return {
        ...baseData,
        appointment_date: format(appointmentDate, 'EEEE, MMMM d, yyyy'),
        appointment_time: format(appointmentDate, 'h:mm a'),
        service_type: 'Dress Alteration',
        notes: 'Please bring the dress and shoes you plan to wear.',
      };

    case 'payment_received':
      return {
        ...baseData,
        amount: '$150.00',
        payment_method: 'Credit Card',
        invoice_number: 'INV-2024-001',
        payment_date: format(new Date(), 'MMMM d, yyyy'),
      };

    case 'invoice_sent':
      return {
        ...baseData,
        invoice_number: 'INV-2024-001',
        amount_due: '$150.00',
        due_date: format(appointmentDate, 'MMMM d, yyyy'),
        invoice_link: 'https://example.com/invoice/123',
      };

    default:
      return baseData;
  }
}
