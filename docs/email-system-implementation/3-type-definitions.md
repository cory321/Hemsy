# Phase 1.3: Type Definitions

## Overview

Create all TypeScript types and interfaces for the email system.

## Prerequisites

- [ ] TypeScript configured in project
- [ ] Database tables created (Phase 1.1)

## Steps

### 1. Create Email Types File

Create `src/types/email.ts`:

```typescript
// Email type enum - matches database constraint
export type EmailType =
  | 'appointment_scheduled'
  | 'appointment_rescheduled'
  | 'appointment_canceled'
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
    'payment_link',
    'appointment_confirmation_request',
    'appointment_confirmed',
  ].includes(value);
}

export function isEmailStatus(value: string): value is EmailStatus {
  return ['pending', 'sent', 'failed', 'bounced', 'complained'].includes(value);
}
```

### 2. Create Email Constants

Create `src/lib/utils/email/constants.ts`:

```typescript
import { EmailVariableConfig, EmailType } from '@/types/email';

// Email type display names
export const EMAIL_TYPE_LABELS: Record<EmailType, string> = {
  appointment_scheduled: 'Appointment Scheduled',
  appointment_rescheduled: 'Appointment Rescheduled',
  appointment_canceled: 'Appointment Canceled',
  payment_link: 'Payment Link',
  appointment_confirmation_request: 'Confirmation Request',
  appointment_confirmed: 'Appointment Confirmed',
};

// Email status display names
export const EMAIL_STATUS_LABELS = {
  pending: 'Pending',
  sent: 'Sent',
  failed: 'Failed',
  bounced: 'Bounced',
  complained: 'Complained',
} as const;

// Email status colors for UI
export const EMAIL_STATUS_COLORS = {
  pending: 'warning',
  sent: 'success',
  failed: 'error',
  bounced: 'error',
  complained: 'error',
} as const;

// Available variables for each email type
export const EMAIL_VARIABLES: EmailVariableConfig[] = [
  {
    email_type: 'appointment_scheduled',
    variables: [
      {
        key: 'client_name',
        description: 'Client full name',
        example: 'Jane Smith',
      },
      {
        key: 'appointment_time',
        description: 'Formatted appointment time',
        example: 'Monday, Jan 15 at 2:00 PM',
      },
      {
        key: 'shop_name',
        description: 'Business name',
        example: "Sarah's Alterations",
      },
      {
        key: 'seamstress_name',
        description: 'Seamstress name',
        example: 'Sarah',
      },
    ],
    sample_data: {
      client_name: 'Jane Smith',
      appointment_time: 'Monday, Jan 15 at 2:00 PM',
      shop_name: "Sarah's Alterations",
      seamstress_name: 'Sarah',
    },
  },
  {
    email_type: 'appointment_rescheduled',
    variables: [
      {
        key: 'client_name',
        description: 'Client full name',
        example: 'Jane Smith',
      },
      {
        key: 'appointment_time',
        description: 'New appointment time',
        example: 'Tuesday, Jan 16 at 3:00 PM',
      },
      {
        key: 'previous_time',
        description: 'Previous appointment time',
        example: 'Monday, Jan 15 at 2:00 PM',
      },
      {
        key: 'shop_name',
        description: 'Business name',
        example: "Sarah's Alterations",
      },
      {
        key: 'seamstress_name',
        description: 'Seamstress name',
        example: 'Sarah',
      },
    ],
    sample_data: {
      client_name: 'Jane Smith',
      appointment_time: 'Tuesday, Jan 16 at 3:00 PM',
      previous_time: 'Monday, Jan 15 at 2:00 PM',
      shop_name: "Sarah's Alterations",
      seamstress_name: 'Sarah',
    },
  },
  {
    email_type: 'appointment_canceled',
    variables: [
      {
        key: 'client_name',
        description: 'Client full name',
        example: 'Jane Smith',
      },
      {
        key: 'previous_time',
        description: 'Canceled appointment time',
        example: 'Monday, Jan 15 at 2:00 PM',
      },
      {
        key: 'shop_name',
        description: 'Business name',
        example: "Sarah's Alterations",
      },
      {
        key: 'seamstress_name',
        description: 'Seamstress name',
        example: 'Sarah',
      },
    ],
    sample_data: {
      client_name: 'Jane Smith',
      previous_time: 'Monday, Jan 15 at 2:00 PM',
      shop_name: "Sarah's Alterations",
      seamstress_name: 'Sarah',
    },
  },
  {
    email_type: 'payment_link',
    variables: [
      {
        key: 'client_name',
        description: 'Client full name',
        example: 'Jane Smith',
      },
      {
        key: 'payment_link',
        description: 'Secure payment URL',
        example: 'https://pay.stripe.com/...',
      },
      { key: 'amount', description: 'Payment amount', example: '$125.00' },
      {
        key: 'shop_name',
        description: 'Business name',
        example: "Sarah's Alterations",
      },
    ],
    sample_data: {
      client_name: 'Jane Smith',
      payment_link: 'https://example.com/pay/sample-link',
      amount: '$125.00',
      shop_name: "Sarah's Alterations",
    },
  },
  {
    email_type: 'appointment_confirmation_request',
    variables: [
      {
        key: 'client_name',
        description: 'Client full name',
        example: 'Jane Smith',
      },
      {
        key: 'appointment_time',
        description: 'Appointment time',
        example: 'Monday, Jan 15 at 2:00 PM',
      },
      {
        key: 'confirmation_link',
        description: 'Confirmation URL',
        example: 'https://app.threadfolio.com/confirm/...',
      },
      {
        key: 'shop_name',
        description: 'Business name',
        example: "Sarah's Alterations",
      },
    ],
    sample_data: {
      client_name: 'Jane Smith',
      appointment_time: 'Monday, Jan 15 at 2:00 PM',
      confirmation_link: 'https://example.com/confirm/sample-token',
      shop_name: "Sarah's Alterations",
    },
  },
  {
    email_type: 'appointment_confirmed',
    variables: [
      {
        key: 'client_name',
        description: 'Client full name',
        example: 'Jane Smith',
      },
      {
        key: 'appointment_time',
        description: 'Appointment time',
        example: 'Monday, Jan 15 at 2:00 PM',
      },
      {
        key: 'seamstress_name',
        description: 'Seamstress name',
        example: 'Sarah',
      },
    ],
    sample_data: {
      client_name: 'Jane Smith',
      appointment_time: 'Monday, Jan 15 at 2:00 PM',
      seamstress_name: 'Sarah',
    },
  },
];

// Retry configuration
export const RETRY_CONFIG = {
  maxAttempts: 5,
  initialDelay: 1000, // 1 second
  maxDelay: 60000, // 1 minute
  backoffMultiplier: 2,
} as const;

// Email constraints
export const EMAIL_CONSTRAINTS = {
  subjectMaxLength: 200,
  bodyMaxLength: 2000,
  signatureMaxLength: 500,
  hourCutoff: 1, // Don't send if appointment is within 1 hour
} as const;

// Default email footer
export const EMAIL_FOOTER = '\n\n--\nPowered by Threadfolio';
```

### 3. Create Validation Schemas

Create `src/lib/validations/email.ts`:

```typescript
import { z } from 'zod';
import { isEmailType } from '@/types/email';
import { EMAIL_CONSTRAINTS } from '@/lib/utils/email/constants';

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
  email_signature: z
    .string()
    .max(EMAIL_CONSTRAINTS.signatureMaxLength)
    .optional()
    .nullable(),
  reply_to_email: z
    .string()
    .email('Invalid email format')
    .optional()
    .nullable(),
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
```

### 4. Update Main Types Export

Update `src/types/index.ts`:

```typescript
// ... existing exports ...

// Email system types
export * from './email';
```

### 5. Create Type Tests

Create `src/__tests__/unit/types/email.test.ts`:

```typescript
import { isEmailType, isEmailStatus } from '@/types/email';

describe('Email Type Guards', () => {
  describe('isEmailType', () => {
    it('returns true for valid email types', () => {
      expect(isEmailType('appointment_scheduled')).toBe(true);
      expect(isEmailType('appointment_rescheduled')).toBe(true);
      expect(isEmailType('appointment_canceled')).toBe(true);
    });

    it('returns false for invalid email types', () => {
      expect(isEmailType('invalid_type')).toBe(false);
      expect(isEmailType('')).toBe(false);
      expect(isEmailType('APPOINTMENT_SCHEDULED')).toBe(false);
    });
  });

  describe('isEmailStatus', () => {
    it('returns true for valid statuses', () => {
      expect(isEmailStatus('pending')).toBe(true);
      expect(isEmailStatus('sent')).toBe(true);
      expect(isEmailStatus('failed')).toBe(true);
    });

    it('returns false for invalid statuses', () => {
      expect(isEmailStatus('delivered')).toBe(false);
      expect(isEmailStatus('')).toBe(false);
      expect(isEmailStatus('SENT')).toBe(false);
    });
  });
});
```

## Verification

1. **TypeScript compilation**:

   ```bash
   npx tsc --noEmit
   ```

2. **Test type guards**:

   ```bash
   npm test email.test.ts
   ```

3. **IDE support**:
   - Open any `.ts` file
   - Import types: `import { EmailTemplate } from '@/types/email'`
   - Verify autocomplete works

## Common Issues

| Issue                 | Solution                                  |
| --------------------- | ----------------------------------------- |
| Type not found        | Check import paths and tsconfig paths     |
| Type mismatch with DB | Ensure types match database constraints   |
| Validation errors     | Check Zod schema matches type definitions |

## Next Steps

Proceed to [Phase 2: Email Service Core](./4-email-service-core.md)
