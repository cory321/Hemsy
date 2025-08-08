import { EmailVariableConfig, EmailType } from '../../../types/email';

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
      {
        key: 'confirmation_link',
        description:
          'Confirmation URL the client can click to confirm the appointment',
        example: 'http://localhost:3000/confirm/abcd1234',
      },
    ],
    sample_data: {
      client_name: 'Jane Smith',
      appointment_time: 'Monday, Jan 15 at 2:00 PM',
      shop_name: "Sarah's Alterations",
      seamstress_name: 'Sarah',
      confirmation_link: 'https://example.com/confirm/sample-token',
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
