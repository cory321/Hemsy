import { config } from 'dotenv';
import { Resend } from 'resend';

// Load environment variables from .env.local FIRST
config({ path: '.env.local' });

async function testEmailConfig() {
  console.log('Testing email configuration...\n');

  // Debug environment variables
  console.log('=== Environment Debug ===');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
  console.log(
    'RESEND_API_KEY value:',
    process.env.RESEND_API_KEY ? 'SET' : 'NOT SET'
  );
  console.log(
    'EMAIL_FROM_ADDRESS:',
    process.env.EMAIL_FROM_ADDRESS || 'NOT SET'
  );
  console.log('EMAIL_FROM_NAME:', process.env.EMAIL_FROM_NAME || 'NOT SET');
  console.log(
    'EMAIL_PREVIEW_MODE:',
    process.env.EMAIL_PREVIEW_MODE || 'NOT SET'
  );
  console.log(
    'ENABLE_EMAIL_SENDING:',
    process.env.ENABLE_EMAIL_SENDING || 'NOT SET'
  );
  console.log('=========================\n');

  // Check if we can proceed
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY is not set in environment variables');
    console.log('Please check your .env.local file contains:');
    console.log('RESEND_API_KEY=re_your_actual_key_here');
    return;
  }

  // Import email config after environment variables are loaded
  const { emailConfig, resend } = await import(
    '../src/lib/config/email.config'
  );

  // Check email config (this will now work since we have the API key)
  console.log('Preview Mode:', emailConfig.features.previewMode);
  console.log(
    'From:',
    `${emailConfig.sender.name} <${emailConfig.sender.address}>`
  );

  // Test Resend connection
  if (!emailConfig.features.previewMode) {
    try {
      const response = await resend.emails.send({
        from: `${emailConfig.sender.name} <${emailConfig.sender.address}>`,
        to: 'cory321@gmail.com', // Your email address
        subject: 'Hemsy Email System Test',
        html: `
					<h2>🎉 Hemsy Email System Test</h2>
					<p>Congratulations! Your Hemsy email system is working correctly.</p>
					<hr>
					<h3>Configuration Details:</h3>
					<ul>
						<li><strong>From:</strong> ${emailConfig.sender.name} &lt;${emailConfig.sender.address}&gt;</li>
						<li><strong>System:</strong> Resend API integration</li>
						<li><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</li>
						<li><strong>Timestamp:</strong> ${new Date().toISOString()}</li>
					</ul>
					<p>You can now proceed with implementing the full email system for appointment confirmations, reminders, and notifications.</p>
					<br>
					<p><em>This test email was sent from your Hemsy development environment.</em></p>
				`,
        text: `
Hemsy System Test

Congratulations! Your Hemsy email system is working correctly.

Configuration Details:
- From: ${emailConfig.sender.name} <${emailConfig.sender.address}>
- System: Resend API integration  
- Environment: ${process.env.NODE_ENV || 'development'}
- Timestamp: ${new Date().toISOString()}

You can now proceed with implementing the full email system for appointment confirmations, reminders, and notifications.

This test email was sent from your Hemsy development environment.
				`,
      });

      console.log('\n✅ Email sent successfully!');
      console.log('Message ID:', response.data?.id);
    } catch (error) {
      console.error('\n❌ Failed to send test email:', error);
    }
  } else {
    console.log('\n⚠️  Preview mode is ON - no emails will be sent');
  }
}

testEmailConfig();
