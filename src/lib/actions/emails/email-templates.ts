'use server';

import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
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
import { ensureUserAndShop } from '../users';

/**
 * Get all email templates
 */
export async function getEmailTemplates(): Promise<{
  success: boolean;
  data?: EmailTemplate[];
  error?: string;
}> {
  try {
    const { user } = await ensureUserAndShop();

    const supabase = await createClient();
    const repository = new EmailRepository(supabase, user.id);

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

    const { user } = await ensureUserAndShop();

    const supabase = await createClient();
    const repository = new EmailRepository(supabase, user.id);

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

    const { user } = await ensureUserAndShop();

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

    const supabase = await createClient();
    const repository = new EmailRepository(supabase, user.id);

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

    const { user } = await ensureUserAndShop();

    const supabase = await createClient();
    const repository = new EmailRepository(supabase, user.id);

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

    const { user } = await ensureUserAndShop();

    // If no template provided, get from database
    let templateToPreview = template;
    if (!templateToPreview) {
      const supabase = await createClient();
      const repository = new EmailRepository(supabase, user.id);
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

    const { user } = await ensureUserAndShop();

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
