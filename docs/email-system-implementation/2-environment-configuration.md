# Phase 1.2: Environment Configuration

## Overview

Configure environment variables and external services for the email system.

## Prerequisites

- [ ] Resend account created
- [ ] Access to `.env.local` file
- [ ] Supabase project URL and keys

## Steps

### 1. Create Resend Account

1. Go to [Resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email address
4. Navigate to API Keys section

### 2. Generate API Keys

#### Development Key

1. Click "Create API Key"
2. Name: "Hemsy Development"
3. Permission: "Full Access"
4. Domain: Select "All domains" for development
5. Copy the key starting with `re_`

#### Production Key (Later)

1. Add and verify your domain first
2. Create a production key limited to your domain
3. Use more restrictive permissions

### 3. Update Environment Variables

Add to `.env.local`:

```bash
# ===== EMAIL CONFIGURATION =====

# Resend API (required)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxx

# Email Settings
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
EMAIL_FROM_NAME=Your Shop Name
EMAIL_REPLY_TO=support@yourdomain.com

# Development Settings
EMAIL_PREVIEW_MODE=true              # Set to false to actually send emails
EMAIL_LOG_LEVEL=debug               # verbose logging
ENABLE_EMAIL_SENDING=true           # master switch

# Rate Limiting
EMAIL_RATE_LIMIT_PER_HOUR=100      # prevent accidents

# Public URLs (update for production)
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_CONFIRMATION_URL=http://localhost:3000/confirm
```

### 4. Configure Email Domains

#### For Development

- Use Resend's test mode (automatic with free tier)
- Emails will be logged but not delivered
- Perfect for testing

#### For Production

1. Add your domain in Resend dashboard
2. Add DNS records as instructed:
   - SPF record
   - DKIM records
   - Optional: DMARC record
3. Verify domain
4. Update `EMAIL_FROM_ADDRESS` to use verified domain

### 5. Install Dependencies

```bash
npm install resend@^3.0.0
```

### 6. Configure TypeScript

Ensure these types are available:

```typescript
// types/env.d.ts
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Email
      RESEND_API_KEY: string;
      EMAIL_FROM_ADDRESS: string;
      EMAIL_FROM_NAME: string;
      EMAIL_REPLY_TO?: string;
      EMAIL_PREVIEW_MODE?: string;
      EMAIL_LOG_LEVEL?: string;
      ENABLE_EMAIL_SENDING?: string;
      EMAIL_RATE_LIMIT_PER_HOUR?: string;

      // URLs
      NEXT_PUBLIC_APP_URL: string;
      NEXT_PUBLIC_CONFIRMATION_URL: string;
    }
  }
}

export {};
```

### 7. Create Configuration Helper

```typescript
// src/lib/config/email.config.ts
export const emailConfig = {
	resend: {
		apiKey: process.env.RESEND_API_KEY!,
	},
	sender: {
		address: process.env.EMAIL_FROM_ADDRESS || 'noreply@hemsy.app',
		name: process.env.EMAIL_FROM_NAME || 'Hemsy'
		replyTo: process.env.EMAIL_REPLY_TO,
	},
	features: {
		previewMode: process.env.EMAIL_PREVIEW_MODE === 'true',
		enabled: process.env.ENABLE_EMAIL_SENDING !== 'false',
		logLevel: process.env.EMAIL_LOG_LEVEL || 'info',
	},
	limits: {
		ratePerHour: parseInt(process.env.EMAIL_RATE_LIMIT_PER_HOUR || '100'),
	},
	urls: {
		app: process.env.NEXT_PUBLIC_APP_URL!,
		confirmation: process.env.NEXT_PUBLIC_CONFIRMATION_URL!,
	},
} as const;

// Validation
if (!emailConfig.resend.apiKey && emailConfig.features.enabled) {
	throw new Error('RESEND_API_KEY is required when email sending is enabled');
}
```

### 8. Test Configuration

Create a test script:

```typescript
// scripts/test-email-config.ts
import { Resend } from 'resend';
import { emailConfig } from '@/lib/config/email.config';

async function testEmailConfig() {
	console.log('Testing email configuration...\n');

	// Check environment
	console.log('Environment:', process.env.NODE_ENV);
	console.log('Preview Mode:', emailConfig.features.previewMode);
	console.log(
		'From:',
		`${emailConfig.sender.name} <${emailConfig.sender.address}>`
	);

	// Test Resend connection
	if (!emailConfig.features.previewMode) {
		try {
			const resend = new Resend(emailConfig.resend.apiKey);
			const response = await resend.emails.send({
				from: `${emailConfig.sender.name} <${emailConfig.sender.address}>`,
				to: 'delivered@resend.dev', // Resend test address
				subject: 'Hemsy
				text: 'This is a test email from Hemsy email system setup.',
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
```

Run with:

```bash
npx tsx scripts/test-email-config.ts
```

## Security Checklist

- [ ] API keys are in `.env.local` (never commit)
- [ ] `.env.local` is in `.gitignore`
- [ ] Production uses domain-restricted API key
- [ ] Email addresses are validated before use
- [ ] Rate limiting is configured
- [ ] Preview mode is ON for development

## Verification

1. **Check environment is loaded**:

   ```typescript
   console.log('Resend key exists:', !!process.env.RESEND_API_KEY);
   ```

2. **Verify in Resend dashboard**:
   - API key shows "Last used" timestamp
   - Email logs appear (if not in preview mode)

3. **Test with curl**:
   ```bash
   curl -X POST 'https://api.resend.com/emails' \
     -H 'Authorization: Bearer re_YOUR_API_KEY' \
     -H 'Content-Type: application/json' \
     -d '{
       "from": "test@yourdomain.com",
       "to": "delivered@resend.dev",
       "subject": "Test",
       "text": "Test email"
     }'
   ```

## Common Issues

| Issue               | Solution                          |
| ------------------- | --------------------------------- |
| API key not found   | Check `.env.local` is loaded      |
| Domain not verified | Use test addresses in development |
| Rate limit exceeded | Check Resend dashboard limits     |
| Emails not sending  | Verify `EMAIL_PREVIEW_MODE=false` |

## Next Steps

Proceed to [Type Definitions](./3-type-definitions.md)
