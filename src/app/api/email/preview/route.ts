import { NextRequest, NextResponse } from 'next/server';
import { ReactEmailRenderer } from '@/lib/services/email/react-email-renderer';
import { EmailType } from '@/types/email';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const emailType = searchParams.get('type') as EmailType;
    const format = searchParams.get('format') || 'html'; // 'html' or 'text'

    if (!emailType) {
      return NextResponse.json(
        { error: 'Email type is required' },
        { status: 400 }
      );
    }

    // Sample data for preview
    const sampleData = getSampleData(emailType);
    const renderer = new ReactEmailRenderer();

    try {
      const rendered = await renderer.render(emailType, sampleData);

      if (format === 'html') {
        return new NextResponse(rendered.html, {
          headers: { 'Content-Type': 'text/html' },
        });
      } else if (format === 'text') {
        return new NextResponse(rendered.text, {
          headers: { 'Content-Type': 'text/plain' },
        });
      } else {
        return NextResponse.json({
          subject: rendered.subject,
          html: rendered.html,
          text: rendered.text,
        });
      }
    } catch (renderError) {
      return NextResponse.json(
        {
          error: 'React Email template not available for this type',
          emailType,
          message:
            renderError instanceof Error
              ? renderError.message
              : 'Unknown error',
        },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Email preview error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getSampleData(emailType: EmailType) {
  const baseData = {
    client_name: 'Sarah Johnson',
    client_email: 'sarah.johnson@example.com',
    client_phone: '(555) 123-4567',
    shop_name: 'Elegant Alterations',
    shop_email: 'info@elegantalterations.com',
    shop_phone: '(555) 987-6543',
    shop_address: '123 Fashion Ave, Style City, SC 12345',
  };

  switch (emailType) {
    case 'appointment_scheduled':
      return {
        ...baseData,
        appointment_time: 'Thursday, March 15 at 2:00 PM',
        confirmation_link: 'https://hemsy.app/confirm/sample-token',
        cancel_link: 'https://hemsy.app/decline/sample-token',
      };

    case 'appointment_rescheduled':
      return {
        ...baseData,
        appointment_time: 'Friday, March 16 at 3:00 PM',
        previous_time: 'Thursday, March 15 at 2:00 PM',
      };

    case 'appointment_canceled':
      return {
        ...baseData,
        previous_time: 'Thursday, March 15 at 2:00 PM',
      };

    case 'appointment_reminder':
      return {
        ...baseData,
        appointment_time: 'Tomorrow, March 15 at 2:00 PM',
      };

    case 'payment_link':
      return {
        ...baseData,
        payment_link: 'https://payments.hemsy.app/pay/sample-payment-link',
        amount: '$125.00',
      };

    case 'payment_received':
      return {
        ...baseData,
        amount: '$125.00',
        order_details:
          'Wedding dress alterations\n- Hem adjustment\n- Waist taking in\n- Sleeve shortening',
      };

    case 'invoice_sent':
      return {
        ...baseData,
        invoice_details:
          'Wedding dress alterations\n- Hem adjustment: $45.00\n- Waist taking in: $50.00\n- Sleeve shortening: $30.00',
        amount: '$125.00',
        due_date: 'March 30, 2024',
        payment_link: 'https://payments.hemsy.app/pay/sample-invoice-payment',
      };

    case 'appointment_no_show':
      return {
        ...baseData,
        appointment_time: 'Thursday, March 15 at 2:00 PM',
      };

    case 'appointment_confirmation_request':
      return {
        ...baseData,
        appointment_time: 'Thursday, March 15 at 2:00 PM',
        confirmation_link: 'https://hemsy.app/confirm/sample-token',
      };

    case 'appointment_confirmed':
      return {
        ...baseData,
        seamstress_name: 'Sarah Wilson',
        appointment_time: 'Thursday, March 15 at 2:00 PM',
      };

    case 'appointment_rescheduled_seamstress':
      return {
        ...baseData,
        seamstress_name: 'Sarah Wilson',
        appointment_time: 'Friday, March 16 at 3:00 PM',
        previous_time: 'Thursday, March 15 at 2:00 PM',
      };

    case 'appointment_canceled_seamstress':
      return {
        ...baseData,
        seamstress_name: 'Sarah Wilson',
        previous_time: 'Thursday, March 15 at 2:00 PM',
      };

    default:
      return baseData;
  }
}
