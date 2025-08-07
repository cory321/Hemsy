# Email System API Reference

## Server Actions API

### Template Management

#### `getEmailTemplates()`

Get all email templates for the current user.

**Returns:**

```typescript
{
  success: boolean;
  data?: EmailTemplate[];
  error?: string;
}
```

**Usage:**

```typescript
const { success, data: templates, error } = await getEmailTemplates();
```

---

#### `getEmailTemplate(emailType: string)`

Get a single email template by type.

**Parameters:**

- `emailType` - One of the valid email types

**Returns:**

```typescript
{
  success: boolean;
  data?: EmailTemplate;
  error?: string;
}
```

---

#### `updateEmailTemplate(input)`

Update an email template.

**Parameters:**

```typescript
{
  emailType: string;
  subject: string;
  body: string;
}
```

**Returns:**

```typescript
{
  success: boolean;
  error?: string;
}
```

**Example:**

```typescript
const result = await updateEmailTemplate({
  emailType: 'appointment_scheduled',
  subject: 'Your appointment with {shop_name}',
  body: 'Hi {client_name}, ...',
});
```

---

#### `resetEmailTemplate(emailType: string)`

Reset a template to its default version.

**Parameters:**

- `emailType` - The email type to reset

**Returns:**

```typescript
{
  success: boolean;
  error?: string;
}
```

---

#### `previewEmailTemplate(emailType, template?)`

Preview an email template with sample data.

**Parameters:**

- `emailType` - The email type
- `template` (optional) - Custom template to preview

**Returns:**

```typescript
{
  success: boolean;
  data?: {
    subject: string;
    body: string;
    variables: string[];
  };
  error?: string;
}
```

### Email Sending

#### `sendAppointmentScheduledEmail(appointmentId)`

Send appointment scheduled notification.

**Parameters:**

- `appointmentId` - UUID of the appointment

**Returns:**

```typescript
{
  success: boolean;
  error?: string;
}
```

---

#### `sendAppointmentRescheduledEmail(appointmentId, previousTime)`

Send appointment rescheduled notification.

**Parameters:**

- `appointmentId` - UUID of the appointment
- `previousTime` - ISO string of previous appointment time

**Returns:**

```typescript
{
  success: boolean;
  error?: string;
}
```

---

#### `sendAppointmentCanceledEmail(appointmentId, previousTime)`

Send appointment canceled notification.

**Parameters:**

- `appointmentId` - UUID of the appointment
- `previousTime` - ISO string of canceled appointment time

---

#### `sendConfirmationRequestEmail(appointmentId)`

Send appointment confirmation request.

**Parameters:**

- `appointmentId` - UUID of the appointment

**Returns:**

```typescript
{
  success: boolean;
  error?: string;
  confirmationUrl?: string;
}
```

---

#### `sendPaymentLinkEmail(clientId, paymentLink, amount)`

Send payment link to client (placeholder for MVP).

**Parameters:**

- `clientId` - UUID of the client
- `paymentLink` - Payment URL
- `amount` - Payment amount

### Email Monitoring

#### `getEmailLogs(params)`

Get paginated email logs with filters.

**Parameters:**

```typescript
{
  status?: EmailStatus;
  emailType?: EmailType;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}
```

**Returns:**

```typescript
{
  success: boolean;
  data?: {
    logs: EmailLog[];
    total: number;
  };
  error?: string;
}
```

**Example:**

```typescript
const result = await getEmailLogs({
  status: 'failed',
  limit: 20,
  offset: 0,
});
```

---

#### `getEmailStatistics(params)`

Get email statistics for a date range.

**Parameters:**

```typescript
{
  startDate: string;
  endDate: string;
}
```

**Returns:**

```typescript
{
  success: boolean;
  data?: EmailStatistics;
  error?: string;
}
```

### User Settings

#### `getUserEmailSettings()`

Get current user's email preferences.

**Returns:**

```typescript
{
  success: boolean;
  data?: UserEmailSettings;
  error?: string;
}
```

---

#### `updateUserEmailSettings(input)`

Update user's email preferences.

**Parameters:**

```typescript
{
  receive_appointment_notifications: boolean;
  email_signature?: string | null;
  reply_to_email?: string | null;
}
```

---

#### `testEmailDelivery(testEmail?)`

Send a test email to verify configuration.

**Parameters:**

- `testEmail` (optional) - Email address to send to

### Confirmation Tokens

#### `confirmAppointment(token)`

Confirm an appointment using a token (public action).

**Parameters:**

- `token` - 64-character hex token

**Returns:**

```typescript
{
  success: boolean;
  error?: string;
  appointmentId?: string;
}
```

---

#### `checkConfirmationToken(token)`

Check if a token is valid without using it.

**Parameters:**

- `token` - 64-character hex token

**Returns:**

```typescript
{
  valid: boolean;
  reason?: 'expired' | 'used' | 'invalid';
}
```

## Type Definitions

### EmailType

```typescript
type EmailType =
  | 'appointment_scheduled'
  | 'appointment_rescheduled'
  | 'appointment_canceled'
  | 'payment_link'
  | 'appointment_confirmation_request'
  | 'appointment_confirmed';
```

### EmailStatus

```typescript
type EmailStatus = 'pending' | 'sent' | 'failed' | 'bounced' | 'complained';
```

### EmailTemplate

```typescript
interface EmailTemplate {
  id: string;
  email_type: EmailType;
  subject: string;
  body: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}
```

### EmailLog

```typescript
interface EmailLog {
  id: string;
  email_type: EmailType;
  recipient_email: string;
  recipient_name: string;
  subject: string;
  body: string;
  status: EmailStatus;
  attempts: number;
  last_error: string | null;
  resend_id: string | null;
  metadata: Record<string, any>;
  sent_at: string | null;
  created_at: string;
}
```

### UserEmailSettings

```typescript
interface UserEmailSettings {
  user_id: string;
  receive_appointment_notifications: boolean;
  email_signature: string | null;
  reply_to_email: string | null;
  updated_at: string;
}
```

## Available Email Variables

### appointment_scheduled

- `{client_name}` - Client's full name
- `{appointment_time}` - Formatted appointment date/time
- `{shop_name}` - Business name
- `{seamstress_name}` - Seamstress name

### appointment_rescheduled

- All variables from appointment_scheduled
- `{previous_time}` - Previous appointment time

### appointment_canceled

- `{client_name}` - Client's full name
- `{previous_time}` - Canceled appointment time
- `{shop_name}` - Business name
- `{seamstress_name}` - Seamstress name

### payment_link

- `{client_name}` - Client's full name
- `{payment_link}` - Secure payment URL
- `{amount}` - Payment amount
- `{shop_name}` - Business name

### appointment_confirmation_request

- `{client_name}` - Client's full name
- `{appointment_time}` - Appointment date/time
- `{confirmation_link}` - Confirmation URL
- `{shop_name}` - Business name

### appointment_confirmed

- `{client_name}` - Client's full name
- `{appointment_time}` - Appointment date/time
- `{seamstress_name}` - Seamstress name

## Error Handling

All Server Actions return a consistent error format:

```typescript
{
  success: false,
  error: string
}
```

Common error messages:

- "Unauthorized" - User not authenticated
- "Invalid email type" - Unknown email type provided
- "Template not found" - Template doesn't exist
- "Failed to send email" - Email delivery failed
- "Too close to appointment time" - Within 1-hour cutoff

## Rate Limits

- **Resend Free Tier**: 100 emails/day, 3000/month
- **Application Rate Limit**: 100 emails/hour (configurable)
- **Retry Attempts**: Maximum 5 attempts per email

## Best Practices

1. **Always handle errors**:

   ```typescript
   const result = await sendAppointmentEmail(id);
   if (!result.success) {
     console.error('Email failed:', result.error);
   }
   ```

2. **Use type guards**:

   ```typescript
   if (isEmailType(emailType)) {
     // Safe to use as EmailType
   }
   ```

3. **Check constraints before sending**:
   - Client opt-out status
   - 1-hour cutoff for appointments
   - User notification preferences

4. **Preview before saving**:

   ```typescript
   const preview = await previewEmailTemplate(emailType, draft);
   // Show preview to user before saving
   ```

5. **Monitor delivery**:
   - Check email logs regularly
   - Set up alerts for high failure rates
   - Review bounced emails
