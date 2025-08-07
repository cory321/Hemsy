import { config } from 'dotenv';

// Load environment variables from .env.local FIRST
config({ path: '.env.local' });

async function testEmailAPI() {
  console.log('Testing Threadfolio Email API (Resend + Next.js patterns)...\n');

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const testEmail = 'cory321@gmail.com';

  try {
    console.log('🔄 Sending POST request to /api/email/test...');
    console.log('📧 Target email:', testEmail);
    console.log('🌐 Base URL:', baseUrl);

    const response = await fetch(`${baseUrl}/api/email/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ API request failed:', response.status);
      console.error('Error details:', result);
      return;
    }

    console.log('\n✅ API request successful!');
    console.log('📊 Response:', JSON.stringify(result, null, 2));

    if (result.data?.previewMode) {
      console.log('\n⚠️  Preview mode is ON - email was logged but not sent');
    } else {
      console.log('\n🎉 Email sent successfully via API route!');
      console.log('📮 Message ID:', result.data?.id);
    }
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.log('\n💡 Make sure your Next.js development server is running:');
    console.log('   npm run dev');
  }
}

// Check if we're calling this directly or if Next.js server might not be running
if (process.env.NEXT_PUBLIC_APP_URL?.includes('localhost')) {
  console.log(
    '⚠️  Note: This test requires the Next.js development server to be running.'
  );
  console.log('   If the test fails, run: npm run dev\n');
}

testEmailAPI();
