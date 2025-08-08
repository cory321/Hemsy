import { NextRequest, NextResponse } from 'next/server';
import { resend, emailConfig } from '@/lib/config/email.config';
import { EmailTemplate } from '@/components/emails/EmailTemplate';

export async function POST(request: NextRequest) {
  try {
    // Get email address from request body
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }

    // Prepare email data
    const emailData = {
      from: emailConfig.sender.formatted,
      to:
        process.env.NODE_ENV !== 'production'
          ? [process.env.EMAIL_DEV_OVERRIDE || 'cory321@gmail.com']
          : [email],
      subject: 'Threadfolio Email System Test',
      react: EmailTemplate({
        title: '🎉 Threadfolio Email System Test',
        content:
          'Congratulations! Your Threadfolio email system is working correctly using the official Resend Next.js patterns.',
        details: [
          { label: 'From', value: emailConfig.sender.formatted },
          { label: 'System', value: 'Resend API with React Templates' },
          {
            label: 'Environment',
            value: process.env.NODE_ENV || 'development',
          },
          { label: 'Timestamp', value: new Date().toISOString() },
          { label: 'API Route', value: '/api/email/test' },
        ],
        footer:
          'This test email was sent from your Threadfolio V2 development environment using the official Resend Next.js integration patterns.',
      }),
    };

    // Send email only if not in preview mode
    if (emailConfig.features.previewMode) {
      console.log('📧 Email Preview Mode - Email would be sent with data:', {
        to: emailData.to,
        subject: emailData.subject,
        from: emailData.from,
      });

      return NextResponse.json({
        success: true,
        message: 'Email preview mode - email logged but not sent',
        data: {
          to: emailData.to,
          subject: emailData.subject,
          from: emailData.from,
          previewMode: true,
        },
      });
    }

    // Send the actual email
    const { data, error } = await resend.emails.send(emailData);

    if (error) {
      console.error('❌ Resend API Error:', error);
      return NextResponse.json(
        { error: 'Failed to send email', details: error },
        { status: 400 }
      );
    }

    console.log('✅ Email sent successfully!', {
      id: data?.id,
      to: emailData.to,
    });

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      data: {
        id: data?.id,
        to: emailData.to,
        subject: emailData.subject,
      },
    });
  } catch (error) {
    console.error('❌ Email API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
