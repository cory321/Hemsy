import { z } from 'zod';
import { isEmailType } from '../../types/email';
import { EMAIL_CONSTRAINTS } from '../utils/email/constants';

// Email template validation
export const EmailTemplateSchema = z.object({
  subject: z
    .string()
    .min(1, 'Subject is required')
    .max(
      EMAIL_CONSTRAINTS.subjectMaxLength,
      `Subject must be less than ${EMAIL_CONSTRAINTS.subjectMaxLength} characters`
    ),
  body: z
    .string()
    .min(1, 'Body is required')
    .max(
      EMAIL_CONSTRAINTS.bodyMaxLength,
      `Body must be less than ${EMAIL_CONSTRAINTS.bodyMaxLength} characters`
    ),
});

// Email template update schema
export const UpdateEmailTemplateSchema = z.object({
  emailType: z.string().refine(isEmailType, 'Invalid email type'),
  subject: z.string().min(1).max(EMAIL_CONSTRAINTS.subjectMaxLength),
  body: z.string().min(1).max(EMAIL_CONSTRAINTS.bodyMaxLength),
});

// User email settings validation
export const UserEmailSettingsSchema = z.object({
  receive_appointment_notifications: z.boolean(),
  // Treat blank string as undefined so the field is truly optional
  email_signature: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().max(EMAIL_CONSTRAINTS.signatureMaxLength).optional().nullable()
  ),
  // Treat blank string as undefined so empty input does not trigger email validation
  reply_to_email: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().email('Invalid email format').optional().nullable()
  ),
});

// Email send validation
export const SendEmailSchema = z.object({
  appointmentId: z.string().uuid('Invalid appointment ID'),
  emailType: z.string().refine(isEmailType, 'Invalid email type'),
});

// Confirmation token validation
export const ConfirmationTokenSchema = z.object({
  token: z
    .string()
    .length(64, 'Invalid token format')
    .regex(/^[a-f0-9]+$/, 'Invalid token format'),
});

// Email log query validation
export const EmailLogQuerySchema = z.object({
  status: z.string().optional(),
  emailType: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

// Type exports for use in components
export type EmailTemplateFormData = z.infer<typeof EmailTemplateSchema>;
export type UpdateEmailTemplateData = z.infer<typeof UpdateEmailTemplateSchema>;
export type UserEmailSettingsData = z.infer<typeof UserEmailSettingsSchema>;
export type SendEmailData = z.infer<typeof SendEmailSchema>;
export type EmailLogQueryData = z.infer<typeof EmailLogQuerySchema>;
