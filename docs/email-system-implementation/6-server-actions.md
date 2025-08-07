# Phase 2.3: Server Actions

## Overview

Create all email-related Server Actions for the frontend to use.

## Prerequisites

- [ ] Email service implemented (Phase 2.1)
- [ ] Template renderer implemented (Phase 2.2)
- [ ] Authentication configured (Clerk)

## Steps

### 1. Create Email Template Actions

Create `src/lib/actions/emails/email-templates.ts`:

```typescript
'use server';

import { auth } from '@clerk/nextjs';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { EmailService } from '@/lib/services/email/email-service';
import { EmailRepository } from '@/lib/services/email/email-repository';
import { templateRenderer } from '@/lib/services/email/template-renderer';
import { PreviewHelper } from '@/lib/services/email/preview-helper';
import { EmailTemplate, EmailType, isEmailType } from '@/types/email';
import {
  UpdateEmailTemplateSchema,
  EmailTemplateSchema,
} from '@/lib/validations/email';
import { revalidatePath } from 'next/cache';

/**
 * Get all email templates
 */
export async function getEmailTemplates(): Promise<{
  success: boolean;
  data?: EmailTemplate[];
  error?: string;
}> {
  try {
    const { userId } = auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const supabase = createServerClient();
    const repository = new EmailRepository(supabase, userId);

    const templates = await repository.getAllTemplates();

    // If no templates exist, return default templates
    if (templates.length === 0) {
      const emailTypes: EmailType[] = [
        'appointment_scheduled',
        'appointment_rescheduled',
        'appointment_canceled',
        'payment_link',
        'appointment_confirmation_request',
        'appointment_confirmed',
      ];

      const defaultTemplates = await Promise.all(
        emailTypes.map((type) => repository.getTemplate(type))
      );

      return {
        success: true,
        data: defaultTemplates.filter((t) => t !== null) as EmailTemplate[],
      };
    }

    return { success: true, data: templates };
  } catch (error) {
    console.error('Failed to get email templates:', error);
    return {
      success: false,
      error: 'Failed to load email templates',
    };
  }
}

/**
 * Get a single email template by type
 */
export async function getEmailTemplate(emailType: string): Promise<{
  success: boolean;
  data?: EmailTemplate;
  error?: string;
}> {
  try {
    if (!isEmailType(emailType)) {
      return { success: false, error: 'Invalid email type' };
    }

    const { userId } = auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const supabase = createServerClient();
    const repository = new EmailRepository(supabase, userId);

    const template = await repository.getTemplate(emailType);
    if (!template) {
      return { success: false, error: 'Template not found' };
    }

    return { success: true, data: template };
  } catch (error) {
    console.error('Failed to get email template:', error);
    return {
      success: false,
      error: 'Failed to load email template',
    };
  }
}

/**
 * Update an email template
 */
export async function updateEmailTemplate(
  input: z.infer<typeof UpdateEmailTemplateSchema>
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Validate input
    const validatedData = UpdateEmailTemplateSchema.parse(input);

    const { userId } = auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Validate template syntax and variables
    const validation = PreviewHelper.validateTemplate(
      {
        subject: validatedData.subject,
        body: validatedData.body,
      },
      validatedData.emailType as EmailType
    );

    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors.join('. '),
      };
    }

    const supabase = createServerClient();
    const repository = new EmailRepository(supabase, userId);

    await repository.updateTemplate(validatedData.emailType as EmailType, {
      subject: validatedData.subject,
      body: validatedData.body,
    });

    // Revalidate the settings page
    revalidatePath('/settings');

    return { success: true };
  } catch (error) {
    console.error('Failed to update email template:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || 'Invalid template data',
      };
    }

    return {
      success: false,
      error: 'Failed to update email template',
    };
  }
}

/**
 * Reset a template to default
 */
export async function resetEmailTemplate(emailType: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    if (!isEmailType(emailType)) {
      return { success: false, error: 'Invalid email type' };
    }

    const { userId } = auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const supabase = createServerClient();
    const repository = new EmailRepository(supabase, userId);

    await repository.resetTemplate(emailType);

    // Revalidate the settings page
    revalidatePath('/settings');

    return { success: true };
  } catch (error) {
    console.error('Failed to reset email template:', error);
    return {
      success: false,
      error: 'Failed to reset email template',
    };
  }
}

/**
 * Preview an email template
 */
export async function previewEmailTemplate(
  emailType: string,
  template?: { subject: string; body: string }
): Promise<{
  success: boolean;
  data?: {
    subject: string;
    body: string;
    variables: string[];
  };
  error?: string;
}> {
  try {
    if (!isEmailType(emailType)) {
      return { success: false, error: 'Invalid email type' };
    }

    const { userId } = auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // If no template provided, get from database
    let templateToPreview = template;
    if (!templateToPreview) {
      const supabase = createServerClient();
      const repository = new EmailRepository(supabase, userId);
      const dbTemplate = await repository.getTemplate(emailType);

      if (!dbTemplate) {
        return { success: false, error: 'Template not found' };
      }

      templateToPreview = {
        subject: dbTemplate.subject,
        body: dbTemplate.body,
      };
    }

    // Generate preview
    const preview = PreviewHelper.generatePreview(
      templateToPreview,
      emailType,
      { includeFooter: true }
    );

    return { success: true, data: preview };
  } catch (error) {
    console.error('Failed to preview email template:', error);
    return {
      success: false,
      error: 'Failed to generate preview',
    };
  }
}

/**
 * Get template variables for help display
 */
export async function getTemplateVariables(emailType: string): Promise<{
  success: boolean;
  data?: Array<{
    key: string;
    description: string;
    example: string;
  }>;
  error?: string;
}> {
  try {
    if (!isEmailType(emailType)) {
      return { success: false, error: 'Invalid email type' };
    }

    const { userId } = auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const variables = templateRenderer.getVariableHelp(emailType);

    return { success: true, data: variables };
  } catch (error) {
    console.error('Failed to get template variables:', error);
    return {
      success: false,
      error: 'Failed to load template variables',
    };
  }
}
```

### 2. Create Email Send Actions

Create `src/lib/actions/emails/email-send.ts`:

```typescript
'use server';

import { auth } from '@clerk/nextjs';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { EmailService } from '@/lib/services/email/email-service';
import { EmailType, isEmailType } from '@/types/email';
import { SendEmailSchema } from '@/lib/validations/email';

/**
 * Send appointment scheduled email
 */
export async function sendAppointmentScheduledEmail(
  appointmentId: string
): Promise<{ success: boolean; error?: string }> {
  return sendAppointmentEmail({
    appointmentId,
    emailType: 'appointment_scheduled',
  });
}

/**
 * Send appointment rescheduled email
 */
export async function sendAppointmentRescheduledEmail(
  appointmentId: string,
  previousTime: string
): Promise<{ success: boolean; error?: string }> {
  return sendAppointmentEmail(
    {
      appointmentId,
      emailType: 'appointment_rescheduled',
    },
    { previous_time: previousTime }
  );
}

/**
 * Send appointment canceled email
 */
export async function sendAppointmentCanceledEmail(
  appointmentId: string,
  previousTime: string
): Promise<{ success: boolean; error?: string }> {
  return sendAppointmentEmail(
    {
      appointmentId,
      emailType: 'appointment_canceled',
    },
    { previous_time: previousTime }
  );
}

/**
 * Send confirmation request email
 */
export async function sendConfirmationRequestEmail(
  appointmentId: string
): Promise<{
  success: boolean;
  error?: string;
  confirmationUrl?: string;
}> {
  try {
    const { userId } = auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const supabase = createServerClient();
    const emailService = new EmailService(supabase, userId);

    const result = await emailService.sendConfirmationRequest(appointmentId);

    return result;
  } catch (error) {
    console.error('Failed to send confirmation request:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

/**
 * Send payment link email
 */
export async function sendPaymentLinkEmail(
  clientId: string,
  paymentLink: string,
  amount: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // For MVP, payment emails are placeholder
    // This would integrate with Stripe in the future
    console.log('Payment email placeholder:', {
      clientId,
      paymentLink,
      amount,
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to send payment email:', error);
    return {
      success: false,
      error: 'Failed to send payment email',
    };
  }
}

/**
 * Generic appointment email sender
 */
async function sendAppointmentEmail(
  input: z.infer<typeof SendEmailSchema>,
  additionalData?: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate input
    const validatedData = SendEmailSchema.parse(input);

    const { userId } = auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const supabase = createServerClient();
    const emailService = new EmailService(supabase, userId);

    const result = await emailService.sendAppointmentEmail(
      validatedData.appointmentId,
      validatedData.emailType as EmailType,
      additionalData
    );

    return {
      success: result.success,
      error: result.error,
    };
  } catch (error) {
    console.error('Failed to send appointment email:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid request data',
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

/**
 * Resend a failed email
 */
export async function resendEmail(
  emailLogId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const supabase = createServerClient();
    const emailService = new EmailService(supabase, userId);

    const result = await emailService.resendEmail(emailLogId);

    return {
      success: result.success,
      error: result.error,
    };
  } catch (error) {
    console.error('Failed to resend email:', error);
    return {
      success: false,
      error: 'Failed to resend email',
    };
  }
}
```

### 3. Create Email Monitoring Actions

Create `src/lib/actions/emails/email-monitoring.ts`:

```typescript
'use server';

import { auth } from '@clerk/nextjs';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { EmailRepository } from '@/lib/services/email/email-repository';
import { EmailLog, EmailStatistics } from '@/types/email';
import { EmailLogQuerySchema } from '@/lib/validations/email';
import { startOfDay, endOfDay, eachDayOfInterval, format } from 'date-fns';

/**
 * Get email logs with filters
 */
export async function getEmailLogs(
  params: z.infer<typeof EmailLogQuerySchema> = {}
): Promise<{
  success: boolean;
  data?: {
    logs: EmailLog[];
    total: number;
  };
  error?: string;
}> {
  try {
    // Validate input
    const validatedParams = EmailLogQuerySchema.parse(params);

    const { userId } = auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const supabase = createServerClient();
    const repository = new EmailRepository(supabase, userId);

    const result = await repository.getEmailLogs(validatedParams);

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to get email logs:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid query parameters',
      };
    }

    return {
      success: false,
      error: 'Failed to load email logs',
    };
  }
}

/**
 * Get email statistics
 */
export async function getEmailStatistics(params: {
  startDate: string;
  endDate: string;
}): Promise<{
  success: boolean;
  data?: EmailStatistics;
  error?: string;
}> {
  try {
    const { userId } = auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const supabase = createServerClient();
    const repository = new EmailRepository(supabase, userId);

    // Get all logs for the date range
    const { logs } = await repository.getEmailLogs({
      startDate: startOfDay(new Date(params.startDate)).toISOString(),
      endDate: endOfDay(new Date(params.endDate)).toISOString(),
      limit: 1000, // High limit for statistics
    });

    // Calculate statistics
    const statistics: EmailStatistics = {
      total: logs.length,
      sent: logs.filter((log) => log.status === 'sent').length,
      failed: logs.filter((log) => log.status === 'failed').length,
      pending: logs.filter((log) => log.status === 'pending').length,
      byType: {},
      dailyCounts: [],
    };

    // Count by type
    const emailTypes = [
      'appointment_scheduled',
      'appointment_rescheduled',
      'appointment_canceled',
      'payment_link',
      'appointment_confirmation_request',
      'appointment_confirmed',
    ] as const;

    emailTypes.forEach((type) => {
      statistics.byType[type] = logs.filter(
        (log) => log.email_type === type
      ).length;
    });

    // Calculate daily counts
    const days = eachDayOfInterval({
      start: new Date(params.startDate),
      end: new Date(params.endDate),
    });

    statistics.dailyCounts = days.map((day) => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);

      const count = logs.filter((log) => {
        const logDate = new Date(log.created_at);
        return logDate >= dayStart && logDate <= dayEnd;
      }).length;

      return {
        date: format(day, 'yyyy-MM-dd'),
        count,
      };
    });

    return { success: true, data: statistics };
  } catch (error) {
    console.error('Failed to get email statistics:', error);
    return {
      success: false,
      error: 'Failed to load email statistics',
    };
  }
}

/**
 * Get single email log details
 */
export async function getEmailLog(emailLogId: string): Promise<{
  success: boolean;
  data?: EmailLog;
  error?: string;
}> {
  try {
    const { userId } = auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('email_logs')
      .select('*')
      .eq('id', emailLogId)
      .eq('created_by', userId)
      .single();

    if (error || !data) {
      return { success: false, error: 'Email log not found' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Failed to get email log:', error);
    return {
      success: false,
      error: 'Failed to load email log',
    };
  }
}

/**
 * Delete old email logs (cleanup)
 */
export async function deleteOldEmailLogs(daysToKeep: number = 90): Promise<{
  success: boolean;
  deletedCount?: number;
  error?: string;
}> {
  try {
    const { userId } = auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const supabase = createServerClient();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const { data, error } = await supabase
      .from('email_logs')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .eq('created_by', userId)
      .select('id');

    if (error) {
      throw error;
    }

    return {
      success: true,
      deletedCount: data?.length || 0,
    };
  } catch (error) {
    console.error('Failed to delete old email logs:', error);
    return {
      success: false,
      error: 'Failed to delete old logs',
    };
  }
}
```

### 4. Create Email Settings Actions

Create `src/lib/actions/emails/email-settings.ts`:

```typescript
'use server';

import { auth } from '@clerk/nextjs';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { EmailRepository } from '@/lib/services/email/email-repository';
import { UserEmailSettings } from '@/types/email';
import { UserEmailSettingsSchema } from '@/lib/validations/email';
import { revalidatePath } from 'next/cache';

/**
 * Get user email settings
 */
export async function getUserEmailSettings(): Promise<{
  success: boolean;
  data?: UserEmailSettings;
  error?: string;
}> {
  try {
    const { userId } = auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const supabase = createServerClient();
    const repository = new EmailRepository(supabase, userId);

    const settings = await repository.getUserEmailSettings();

    if (!settings) {
      // Return default settings if none exist
      return {
        success: true,
        data: {
          user_id: userId,
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

    const { userId } = auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const supabase = createServerClient();
    const repository = new EmailRepository(supabase, userId);

    await repository.updateUserEmailSettings(validatedData);

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
    const { userId } = auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const supabase = createServerClient();

    // Get user email
    const { data: userData } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

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
      subject: 'Threadfolio Email Test',
      text: 'This is a test email from your Threadfolio email system. If you received this, your email configuration is working correctly!',
    });

    if (!result.success) {
      return { success: false, error: result.error };
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
```

### 5. Create Confirmation Token Actions

Create `src/lib/actions/emails/confirmation-tokens.ts`:

```typescript
'use server';

import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { EmailRepository } from '@/lib/services/email/email-repository';
import { EmailService } from '@/lib/services/email/email-service';
import { ConfirmationTokenSchema } from '@/lib/validations/email';

/**
 * Confirm an appointment via token
 */
export async function confirmAppointment(token: string): Promise<{
  success: boolean;
  error?: string;
  appointmentId?: string;
}> {
  try {
    // Validate token format
    const validatedData = ConfirmationTokenSchema.parse({ token });

    const supabase = createServerClient();

    // Validate token (public action - no auth required)
    const repository = new EmailRepository(supabase, 'system');
    const validation = await repository.validateToken(validatedData.token);

    if (!validation.valid) {
      return {
        success: false,
        error:
          validation.reason === 'expired'
            ? 'This confirmation link has expired'
            : validation.reason === 'used'
              ? 'This confirmation link has already been used'
              : 'Invalid confirmation link',
      };
    }

    // Update appointment status
    const { error: updateError } = await supabase
      .from('appointments')
      .update({ status: 'confirmed' })
      .eq('id', validation.appointmentId!);

    if (updateError) {
      throw updateError;
    }

    // Mark token as used
    await repository.useToken(validatedData.token);

    // Send confirmation email to seamstress
    // Get appointment details to find the seamstress
    const { data: appointment } = await supabase
      .from('appointments')
      .select('user_id')
      .eq('id', validation.appointmentId!)
      .single();

    if (appointment) {
      const emailService = new EmailService(supabase, appointment.user_id);
      await emailService.sendAppointmentEmail(
        validation.appointmentId!,
        'appointment_confirmed'
      );
    }

    return {
      success: true,
      appointmentId: validation.appointmentId,
    };
  } catch (error) {
    console.error('Failed to confirm appointment:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid confirmation link format',
      };
    }

    return {
      success: false,
      error: 'Failed to confirm appointment',
    };
  }
}

/**
 * Check if a confirmation token is valid
 */
export async function checkConfirmationToken(token: string): Promise<{
  valid: boolean;
  reason?: 'expired' | 'used' | 'invalid';
}> {
  try {
    // Validate token format
    const validatedData = ConfirmationTokenSchema.parse({ token });

    const supabase = createServerClient();
    const repository = new EmailRepository(supabase, 'system');

    const validation = await repository.validateToken(validatedData.token);

    return {
      valid: validation.valid,
      reason: validation.reason,
    };
  } catch (error) {
    return {
      valid: false,
      reason: 'invalid',
    };
  }
}
```

### 6. Create Barrel Export

Create `src/lib/actions/emails/index.ts`:

```typescript
// Template management
export {
  getEmailTemplates,
  getEmailTemplate,
  updateEmailTemplate,
  resetEmailTemplate,
  previewEmailTemplate,
  getTemplateVariables,
} from './email-templates';

// Email sending
export {
  sendAppointmentScheduledEmail,
  sendAppointmentRescheduledEmail,
  sendAppointmentCanceledEmail,
  sendConfirmationRequestEmail,
  sendPaymentLinkEmail,
  resendEmail,
} from './email-send';

// Monitoring
export {
  getEmailLogs,
  getEmailStatistics,
  getEmailLog,
  deleteOldEmailLogs,
} from './email-monitoring';

// Settings
export {
  getUserEmailSettings,
  updateUserEmailSettings,
  testEmailDelivery,
} from './email-settings';

// Confirmation tokens
export {
  confirmAppointment,
  checkConfirmationToken,
} from './confirmation-tokens';
```

## Testing Server Actions

Create a test page to verify actions work:

```typescript
// app/(app)/test-email-actions/page.tsx
import { getEmailTemplates, testEmailDelivery } from '@/lib/actions/emails';

export default async function TestEmailActions() {
  const templates = await getEmailTemplates();

  return (
    <div>
      <h1>Email Actions Test</h1>
      <pre>{JSON.stringify(templates, null, 2)}</pre>

      <form action={async () => {
        'use server';
        const result = await testEmailDelivery();
        console.log('Test result:', result);
      }}>
        <button type="submit">Test Email Delivery</button>
      </form>
    </div>
  );
}
```

## Common Issues

| Issue                    | Solution                                   |
| ------------------------ | ------------------------------------------ |
| Auth error               | Ensure Clerk middleware is configured      |
| Supabase error           | Check database connection and RLS policies |
| Type errors              | Ensure all imports use correct paths       |
| Revalidation not working | Check revalidatePath paths match           |

## Next Steps

Proceed to [Phase 3: Settings Integration](./7-settings-integration.md)
