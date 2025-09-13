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

Your appointment with {shop_name} is scheduled for {appointment_time}.

Please confirm your appointment by clicking the link below:

{confirmation_link}

If you need to cancel, please click the link below: 

{cancel_link}

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
    appointment_no_show: {
      subject: 'We missed you at {shop_name}',
      body: `Hi {client_name},

We’re sorry we missed you for your appointment with {shop_name} on {appointment_time}.

If you still need help, reply to this email and we’ll get you the next available time.

Thank you,
{shop_name}`,
    },
    appointment_rescheduled_seamstress: {
      subject: 'Appointment rescheduled: {client_name}',
      body: `Hi {seamstress_name},

{client_name}'s appointment has been rescheduled.

Previous time: {previous_time}
New time: {appointment_time}

You can view details in Hemsy.

Thank you,
Hemsy`,
    },
    appointment_canceled_seamstress: {
      subject: 'Appointment canceled: {client_name}',
      body: `Hi {seamstress_name},

{client_name}'s appointment scheduled for {previous_time} has been canceled.

You can view details in Hemsy.

Thank you,
Hemsy`,
    },
    appointment_reminder: {
      subject: 'Appointment reminder: {shop_name}',
      body: `Hi {client_name},

This is a reminder about your appointment with {shop_name} scheduled for {appointment_time}.

If you need to reschedule or cancel, please contact us as soon as possible.

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
    payment_received: {
      subject: 'Payment received - Thank you!',
      body: `Hi {client_name},

We have received your payment of {amount} for your order.

Order details:
{order_details}

Thank you for your business!

{shop_name}`,
    },
    invoice_sent: {
      subject: 'Invoice from {shop_name}',
      body: `Hi {client_name},

Please find your invoice attached for the following services:

{invoice_details}

Total amount due: {amount}
Due date: {due_date}

You can pay using the following link: {payment_link}

If you have any questions about this invoice, please contact us.

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

You can view all your appointments in Hemsy.

Thank you,
Hemsy`,
    },
  };
}
