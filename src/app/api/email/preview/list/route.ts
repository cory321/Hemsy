import { NextResponse } from 'next/server';
import { EmailType } from '@/types/email';

export async function GET() {
  const reactEmailTypes: Array<{
    type: EmailType;
    name: string;
    description: string;
  }> = [
    {
      type: 'appointment_scheduled',
      name: 'Appointment Scheduled',
      description:
        'Sent when a new appointment is scheduled with confirmation links',
    },
    {
      type: 'appointment_rescheduled',
      name: 'Appointment Rescheduled',
      description: 'Sent when an appointment time is changed',
    },
    {
      type: 'appointment_canceled',
      name: 'Appointment Canceled',
      description: 'Sent when an appointment is canceled',
    },
    {
      type: 'appointment_reminder',
      name: 'Appointment Reminder',
      description: 'Sent as a reminder before an upcoming appointment',
    },
    {
      type: 'payment_link',
      name: 'Payment Link',
      description: 'Sent with a secure payment link for an order',
    },
    {
      type: 'payment_received',
      name: 'Payment Received',
      description: 'Sent to confirm payment has been received',
    },
    {
      type: 'invoice_sent',
      name: 'Invoice',
      description: 'Sent with invoice details and payment information',
    },
    {
      type: 'appointment_no_show',
      name: 'Appointment No Show',
      description: 'Sent when a client misses their appointment',
    },
    {
      type: 'appointment_confirmation_request',
      name: 'Confirmation Request',
      description: 'Sent to request appointment confirmation from client',
    },
    {
      type: 'appointment_confirmed',
      name: 'Appointment Confirmed (Seamstress)',
      description: 'Sent to seamstress when client confirms appointment',
    },
    {
      type: 'appointment_rescheduled_seamstress',
      name: 'Rescheduled (Seamstress)',
      description: 'Sent to seamstress when appointment is rescheduled',
    },
    {
      type: 'appointment_canceled_seamstress',
      name: 'Canceled (Seamstress)',
      description: 'Sent to seamstress when appointment is canceled',
    },
  ];

  return NextResponse.json({
    available: reactEmailTypes,
    previewUrls: {
      html: '/api/email/preview?type={TYPE}&format=html',
      text: '/api/email/preview?type={TYPE}&format=text',
      json: '/api/email/preview?type={TYPE}&format=json',
    },
  });
}
