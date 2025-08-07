import { EmailType } from '../../../types/email';

interface DefaultTemplate {
  subject: string;
  body: string;
}

export function get_default_email_templates(): Record<
  EmailType,
  DefaultTemplate
> {
  return {
    appointment_scheduled: {
      subject: 'Your appointment is scheduled with {shop_name}',
      body: `Hi {client_name},

Your appointment with {shop_name} is confirmed for {appointment_time}.

If you have any questions or need to reschedule, please contact us.

Thank you,
{shop_name}`,
    },
    appointment_rescheduled: {
      subject: 'Your appointment has been rescheduled',
      body: `Hi {client_name},

Your appointment with {shop_name} has been rescheduled.

Previous time: {previous_time}
New time: {appointment_time}

If you have any questions, please contact us.

Thank you,
{shop_name}`,
    },
    appointment_canceled: {
      subject: 'Your appointment has been canceled',
      body: `Hi {client_name},

Your appointment with {shop_name} scheduled for {previous_time} has been canceled.

If you have any questions, please contact us.

Thank you,
{shop_name}`,
    },
    payment_link: {
      subject: 'Your payment link from {shop_name}',
      body: `Hi {client_name},

You can pay for your order using the link below:

{payment_link}

Amount due: {amount}

If you have any questions, please contact us.

Thank you,
{shop_name}`,
    },
    appointment_confirmation_request: {
      subject: 'Please confirm your appointment with {shop_name}',
      body: `Hi {client_name},

Please confirm your appointment scheduled for {appointment_time} by clicking the link below:

{confirmation_link}

This link will expire in 24 hours.

If you have any questions, please contact us.

Thank you,
{shop_name}`,
    },
    appointment_confirmed: {
      subject: '{client_name} confirmed their appointment',
      body: `Hi {seamstress_name},

{client_name} has confirmed their appointment scheduled for {appointment_time}.

You can view all your appointments in Threadfolio.

Thank you,
Threadfolio`,
    },
  };
}
