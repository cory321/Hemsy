# Email System Testing Guide

## Overview

Comprehensive testing guide for the Threadfolio email notification system.

## Testing Pyramid

```
         E2E Tests (10%)
        /              \
    Integration Tests (30%)
   /                      \
Unit Tests (60% of test effort)
```

## Unit Tests

### 1. Template Renderer Tests

Create `src/__tests__/unit/services/email/template-renderer.test.ts`:

```typescript
import { TemplateRenderer } from '@/lib/services/email/template-renderer';

describe('TemplateRenderer', () => {
  const renderer = new TemplateRenderer();

  describe('variable substitution', () => {
    test('replaces single variable', () => {
      const template = { subject: 'Hello {name}', body: 'Welcome!' };
      const data = { name: 'John' };

      const result = renderer.render(template, data);

      expect(result.subject).toBe('Hello John');
    });

    test('replaces multiple variables', () => {
      const template = {
        subject: '{greeting} {name}',
        body: 'Your appointment is at {time} with {shop_name}.',
      };
      const data = {
        greeting: 'Hello',
        name: 'John',
        time: '2:00 PM',
        shop_name: 'Best Tailors',
      };

      const result = renderer.render(template, data);

      expect(result.subject).toBe('Hello John');
      expect(result.body).toBe(
        'Your appointment is at 2:00 PM with Best Tailors.'
      );
    });

    test('leaves unmatched variables as placeholders', () => {
      const template = { subject: 'Hello {name}', body: '{greeting}!' };
      const data = { name: 'John' };

      const result = renderer.render(template, data);

      expect(result.body).toBe('{greeting}!');
    });

    test('handles special characters in values', () => {
      const template = {
        subject: 'Order for {name}',
        body: 'Amount: {amount}',
      };
      const data = { name: "O'Brien & Sons", amount: '$100.00' };

      const result = renderer.render(template, data);

      expect(result.subject).toBe("Order for O'Brien & Sons");
      expect(result.body).toBe('Amount: $100.00');
    });
  });

  describe('variable extraction', () => {
    test('extracts unique variables', () => {
      const template = 'Hello {name}, your {item} and {item} are ready.';

      const variables = renderer.extractVariables(template);

      expect(variables).toEqual(['name', 'item']);
    });

    test('handles no variables', () => {
      const template = 'Hello, your order is ready.';

      const variables = renderer.extractVariables(template);

      expect(variables).toEqual([]);
    });
  });

  describe('template validation', () => {
    test('validates correct template', () => {
      const template = {
        subject: 'Appointment with {shop_name}',
        body: 'Hi {client_name}, see you at {appointment_time}.',
      };

      const result = renderer.validateTemplate(
        template,
        'appointment_scheduled'
      );

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('catches unknown variables', () => {
      const template = {
        subject: 'Hello {unknown_var}',
        body: 'Test',
      };

      const result = renderer.validateTemplate(
        template,
        'appointment_scheduled'
      );

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Unknown variables: unknown_var');
    });
  });
});
```

### 2. Email Service Tests

Create `src/__tests__/unit/services/email/email-service.test.ts`:

```typescript
import { EmailService } from '@/lib/services/email/email-service';
import { createMockSupabaseClient } from '@/lib/testing/mocks';

jest.mock('@/lib/services/email/resend-client', () => ({
  getResendClient: () => ({
    send: jest.fn().mockResolvedValue({ success: true, messageId: 'test-id' }),
  }),
}));

describe('EmailService', () => {
  let emailService: EmailService;
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    emailService = new EmailService(mockSupabase, 'test-user-id');
  });

  describe('constraint checking', () => {
    test('respects 1-hour cutoff', async () => {
      // Mock appointment in 30 minutes
      const appointment = {
        id: 'test-id',
        start_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        client: { email: 'test@example.com', email_opt_out: false },
      };

      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: appointment }),
      }));

      const result = await emailService.sendAppointmentEmail(
        'test-id',
        'appointment_scheduled'
      );

      expect(result.success).toBe(true); // Silent success
      // Verify no email was actually sent
    });

    test('respects client opt-out', async () => {
      const appointment = {
        id: 'test-id',
        start_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        client: { email: 'test@example.com', email_opt_out: true },
      };

      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: appointment }),
      }));

      const result = await emailService.sendAppointmentEmail(
        'test-id',
        'appointment_scheduled'
      );

      expect(result.success).toBe(true); // Silent success
    });
  });
});
```

### 3. Server Action Tests

Create `src/__tests__/unit/actions/email-templates.test.ts`:

```typescript
import {
  updateEmailTemplate,
  previewEmailTemplate,
} from '@/lib/actions/emails';
import { auth } from '@clerk/nextjs';

jest.mock('@clerk/nextjs', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/supabase/server', () => ({
  createServerClient: jest.fn(),
}));

describe('Email Template Actions', () => {
  beforeEach(() => {
    (auth as jest.Mock).mockReturnValue({ userId: 'test-user' });
  });

  describe('updateEmailTemplate', () => {
    test('validates input data', async () => {
      const result = await updateEmailTemplate({
        emailType: 'invalid_type',
        subject: 'Test',
        body: 'Test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid email type');
    });

    test('checks authentication', async () => {
      (auth as jest.Mock).mockReturnValue({ userId: null });

      const result = await updateEmailTemplate({
        emailType: 'appointment_scheduled',
        subject: 'Test',
        body: 'Test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');
    });
  });
});
```

## Integration Tests

### 1. Email Send Flow Test

Create `src/__tests__/integration/email-send-flow.test.ts`:

```typescript
import { createTestSupabaseClient } from '@/lib/testing/supabase';
import { EmailService } from '@/lib/services/email/email-service';

describe('Email Send Flow Integration', () => {
  let supabase: any;
  let emailService: EmailService;

  beforeAll(async () => {
    supabase = createTestSupabaseClient();
    // Set up test data
    await supabase.from('appointments').insert({
      id: 'test-appointment',
      start_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      client_id: 'test-client',
      user_id: 'test-user',
    });
  });

  afterAll(async () => {
    // Clean up test data
    await supabase.from('appointments').delete().eq('id', 'test-appointment');
  });

  test('complete email send flow', async () => {
    emailService = new EmailService(supabase, 'test-user');

    const result = await emailService.sendAppointmentEmail(
      'test-appointment',
      'appointment_scheduled'
    );

    expect(result.success).toBe(true);

    // Verify email log created
    const { data: logs } = await supabase
      .from('email_logs')
      .select('*')
      .eq('metadata->appointment_id', 'test-appointment');

    expect(logs).toHaveLength(1);
    expect(logs[0].status).toBe('sent');
  });
});
```

### 2. Template Management Test

Create `src/__tests__/integration/template-management.test.ts`:

```typescript
import {
  getEmailTemplates,
  updateEmailTemplate,
  resetEmailTemplate,
} from '@/lib/actions/emails';

describe('Template Management Integration', () => {
  test('full template lifecycle', async () => {
    // 1. Get default templates
    const templatesResult = await getEmailTemplates();
    expect(templatesResult.success).toBe(true);

    const originalTemplate = templatesResult.data?.find(
      (t) => t.email_type === 'appointment_scheduled'
    );
    expect(originalTemplate).toBeDefined();

    // 2. Update template
    const updateResult = await updateEmailTemplate({
      emailType: 'appointment_scheduled',
      subject: 'Custom subject',
      body: 'Custom body',
    });
    expect(updateResult.success).toBe(true);

    // 3. Verify update
    const updatedResult = await getEmailTemplates();
    const updatedTemplate = updatedResult.data?.find(
      (t) => t.email_type === 'appointment_scheduled'
    );
    expect(updatedTemplate?.subject).toBe('Custom subject');
    expect(updatedTemplate?.is_default).toBe(false);

    // 4. Reset template
    const resetResult = await resetEmailTemplate('appointment_scheduled');
    expect(resetResult.success).toBe(true);

    // 5. Verify reset
    const resetTemplatesResult = await getEmailTemplates();
    const resetTemplate = resetTemplatesResult.data?.find(
      (t) => t.email_type === 'appointment_scheduled'
    );
    expect(resetTemplate?.subject).toBe(originalTemplate?.subject);
  });
});
```

## E2E Tests

### 1. Complete Email Flow E2E

Create `src/__tests__/e2e/email-flow.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Email System E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/sign-in');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'testpassword');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('edit email template', async ({ page }) => {
    // Navigate to email settings
    await page.goto('/settings');
    await page.click('text=Emails');
    await page.click('text=Templates');

    // Edit appointment scheduled template
    await page
      .click('text=Appointment Scheduled')
      .locator('..')
      .getByText('Edit');

    // Modify template
    await page.fill(
      '[name="subject"]',
      'Your appointment with {shop_name} is confirmed!'
    );
    await page.fill(
      '[name="body"]',
      'Hi {client_name}, see you at {appointment_time}!'
    );

    // Check preview updates
    await expect(page.locator('[data-testid="email-preview"]')).toContainText(
      "Your appointment with Sarah's Alterations is confirmed!"
    );

    // Save
    await page.click('button:has-text("Save Template")');
    await expect(page.locator('[role="alert"]')).toContainText(
      'Template saved'
    );
  });

  test('send test email', async ({ page }) => {
    // Navigate to preferences
    await page.goto('/settings');
    await page.click('text=Emails');
    await page.click('text=Preferences');

    // Send test email
    await page.click('button:has-text("Send Test Email")');
    await expect(page.locator('[role="alert"]')).toContainText(
      'Test email sent'
    );
  });

  test('view email logs', async ({ page }) => {
    // Navigate to logs
    await page.goto('/settings');
    await page.click('text=Emails');
    await page.click('text=Email Logs');

    // Apply filters
    await page.selectOption('[name="status"]', 'sent');
    await page.selectOption('[name="emailType"]', 'appointment_scheduled');

    // Check results update
    await expect(page.locator('table')).toBeVisible();

    // View details
    await page.click('button[aria-label="View details"]').first();
    await expect(page.locator('[data-testid="email-details"]')).toBeVisible();
  });
});
```

### 2. Confirmation Flow E2E

Create `src/__tests__/e2e/confirmation-flow.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Appointment Confirmation E2E', () => {
  test('complete confirmation flow', async ({ page, context }) => {
    // 1. Create appointment and get confirmation URL
    // (This would be done via API or UI)
    const confirmationUrl = 'http://localhost:3000/confirm/test-token';

    // 2. Open confirmation link in new tab (simulating email click)
    const newPage = await context.newPage();
    await newPage.goto(confirmationUrl);

    // 3. Check confirmation page
    await expect(newPage.locator('h1')).toContainText(
      'Confirm Your Appointment'
    );
    await expect(
      newPage.locator('text=Monday, Jan 15 at 2:00 PM')
    ).toBeVisible();

    // 4. Confirm appointment
    await newPage.click('button:has-text("Confirm Appointment")');

    // 5. Check success state
    await expect(
      newPage.locator('[data-testid="confirmation-success"]')
    ).toBeVisible();
    await expect(
      newPage.locator('text=Your appointment has been confirmed')
    ).toBeVisible();
  });

  test('expired token handling', async ({ page }) => {
    await page.goto('/confirm/expired-token');

    await expect(
      page.locator('[data-testid="confirmation-error"]')
    ).toBeVisible();
    await expect(
      page.locator('text=This confirmation link has expired')
    ).toBeVisible();
  });
});
```

## Manual Testing Checklist

### Email Templates

- [ ] Navigate to Settings > Emails > Templates
- [ ] Each email type displays with correct label
- [ ] Edit button opens template editor
- [ ] Subject field updates preview in real-time
- [ ] Body field updates preview in real-time
- [ ] Variables are highlighted in preview
- [ ] Save button shows success message
- [ ] Reset button only shows for customized templates
- [ ] Reset confirmation dialog works
- [ ] Cancel button returns to list

### Email Preferences

- [ ] Navigate to Settings > Emails > Preferences
- [ ] Toggle switch saves correctly
- [ ] Reply-to email validates format
- [ ] Email signature respects character limit
- [ ] Save button is disabled when no changes
- [ ] Test email button sends email
- [ ] Success/error messages display correctly

### Email Logs

- [ ] Navigate to Settings > Emails > Email Logs
- [ ] Table displays email history
- [ ] Status filter works
- [ ] Email type filter works
- [ ] Date range filters work
- [ ] Pagination controls work
- [ ] View details opens modal/drawer
- [ ] Email details show full content
- [ ] Resend button appears for failed emails

### Appointment Integration

- [ ] Create appointment → Email sends
- [ ] Reschedule appointment → Email sends with both times
- [ ] Cancel appointment → Email sends with previous time
- [ ] Appointment within 1 hour → No email sent
- [ ] Client opted out → No email sent

### Confirmation Flow

- [ ] Confirmation email contains working link
- [ ] Link opens confirmation page
- [ ] Appointment details display correctly
- [ ] Confirm button updates appointment
- [ ] Success message appears
- [ ] Link cannot be used twice
- [ ] Expired links show error

## Performance Testing

### Load Testing

```typescript
// Test multiple emails sending simultaneously
async function loadTest() {
  const promises = [];

  for (let i = 0; i < 50; i++) {
    promises.push(sendAppointmentScheduledEmail(`appointment-${i}`));
  }

  const results = await Promise.all(promises);
  const successRate = results.filter((r) => r.success).length / results.length;

  expect(successRate).toBeGreaterThan(0.95); // 95% success rate
}
```

### Response Time Testing

- Template preview: < 200ms
- Email send: < 2s
- Template save: < 500ms
- Log loading: < 1s

## Security Testing

### Input Validation

- [ ] XSS: Try `<script>alert('xss')</script>` in templates
- [ ] SQL Injection: Try `'; DROP TABLE emails; --` in fields
- [ ] Template injection: Try `{__proto__}` in templates

### Access Control

- [ ] Cannot access other users' templates
- [ ] Cannot access other users' email logs
- [ ] Cannot use confirmation tokens from other users

### Rate Limiting

- [ ] Cannot send > 100 emails per hour
- [ ] Rate limit error message is clear

## Monitoring & Debugging

### Key Metrics to Track

- Email delivery rate (target: > 95%)
- Average send time (target: < 2s)
- Template customization rate
- Confirmation rate for appointments

### Debug Checklist

1. Check browser console for errors
2. Check network tab for failed requests
3. Check Resend dashboard for delivery status
4. Check Supabase logs for database errors
5. Check server logs for unhandled errors

### Common Issues & Solutions

| Issue                    | Debug Steps                                                                     | Solution                             |
| ------------------------ | ------------------------------------------------------------------------------- | ------------------------------------ |
| Email not sending        | 1. Check preview mode<br>2. Check Resend API key<br>3. Check email logs         | Disable preview mode, verify API key |
| Template not saving      | 1. Check validation errors<br>2. Check network request<br>3. Check RLS policies | Fix validation, check auth           |
| Preview not updating     | 1. Check debounce timing<br>2. Check console errors<br>3. Check variable names  | Adjust debounce, fix errors          |
| Confirmation link broken | 1. Check token format<br>2. Check expiration<br>3. Check public route           | Verify token generation              |

## CI/CD Testing

### GitHub Actions Workflow

```yaml
name: Email System Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '22.17.1'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit -- --coverage

      - name: Run integration tests
        run: npm run test:integration
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_TEST_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_TEST_ANON_KEY }}

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Test Data Management

### Seed Test Data

```typescript
// scripts/seed-test-emails.ts
async function seedTestEmails() {
  const supabase = createServerClient();

  // Create test email logs
  const logs = Array.from({ length: 50 }, (_, i) => ({
    email_type: ['appointment_scheduled', 'appointment_rescheduled'][i % 2],
    recipient_email: `test${i}@example.com`,
    recipient_name: `Test User ${i}`,
    subject: 'Test Email',
    body: 'This is a test email',
    status: ['sent', 'failed', 'pending'][i % 3],
    attempts: i % 3,
    created_at: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
  }));

  await supabase.from('email_logs').insert(logs);
}
```

### Clean Test Data

```typescript
// Always clean up after tests
afterEach(async () => {
  await supabase
    .from('email_logs')
    .delete()
    .eq('recipient_email', 'like', 'test%');
});
```
