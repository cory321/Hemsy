# Appointment Reschedule Behavior

## Overview

When an appointment is rescheduled in Hemsy, the system automatically handles status updates and confirmation token management to ensure proper client communication and appointment tracking.

## Key Behaviors

### 1. Status Reset to Pending

When an appointment is rescheduled (date or time changes), the appointment status is automatically reset to `pending` regardless of its previous status. This includes:

- **Confirmed → Pending**: If a previously confirmed appointment is rescheduled, it needs to be re-confirmed for the new time
- **Declined → Pending**: If a previously declined appointment is rescheduled, it becomes a new appointment proposal
- **No Show → Pending**: If a no-show appointment is rescheduled, it gets a fresh start
- **Pending → Pending**: Remains pending if already in that state

**Exception**: If explicitly canceling during a reschedule operation (`status: 'canceled'`), the canceled status takes precedence.

### 2. Confirmation Token Management

#### Token Generation

- When an appointment is scheduled initially, confirm/decline tokens are generated for pending appointments
- When an appointment is rescheduled, new confirm/decline tokens are generated (only for pending appointments)
- Tokens are only generated when the appointment status is `pending`

#### Token Invalidation

- When an appointment is rescheduled, all previous unused tokens are automatically invalidated
- When a confirm or decline link is clicked, all other unused tokens for that appointment are voided
- This prevents:
  - Using old confirm/decline links after a reschedule
  - Confirming and then declining (or vice versa) the same appointment

### 3. Email Notifications

#### Scheduled Appointment Email

- Sent when a new appointment is created
- Includes confirm/decline links if appointment is pending

#### Rescheduled Appointment Email

- Sent when appointment date/time changes
- Includes new confirm/decline links if appointment is pending
- Shows both previous and new appointment times
- Old tokens from previous emails become invalid

## Implementation Details

### Code Flow

1. **Update Appointment Action** (`src/lib/actions/appointments.ts`)

   ```typescript
   // Check if this is a reschedule (date/time changed)
   const isReschedule =
   	validated.date !== undefined ||
   	validated.startTime !== undefined ||
   	validated.endTime !== undefined;

   // If rescheduling, always set status to pending (unless explicitly canceling)
   if (isReschedule && validated.status !== 'canceled') {
   	updateData.status = 'pending';
   }
   ```

2. **Token Invalidation** (`src/lib/actions/appointments.ts`)

   ```typescript
   // Invalidate all unused confirmation tokens for this appointment
   const repository = new EmailRepository(supabase, ownerUserId);
   await repository.invalidateUnusedTokensForAppointment(validated.id);
   ```

3. **Email Service Token Generation** (`src/lib/services/email/email-service.ts`)
   ```typescript
   // Generate new tokens for rescheduled appointments
   if (
   	emailType === 'appointment_rescheduled' &&
   	appointmentData.status === 'pending'
   ) {
   	const confirmToken =
   		await this.repository.createConfirmationToken(appointmentId);
   	const cancelToken =
   		await this.repository.createConfirmationToken(appointmentId);
   	// Include tokens in email data
   }
   ```

## User Experience

### For Clients

1. Receive initial appointment email with confirm/decline links
2. If appointment is rescheduled:
   - Receive new email with updated time and new confirm/decline links
   - Old links no longer work
   - Must confirm or decline the new time
3. Once confirmed/declined, the other action is no longer available

### For Seamstresses

1. Can reschedule appointments at any time
2. System automatically handles status updates and client notifications
3. Can track which appointments need client confirmation (pending status)

## Security Considerations

- Tokens are cryptographically secure and unique
- Tokens expire after 24 hours
- Used tokens cannot be reused
- Token validation happens server-side
- No authentication required for confirm/decline actions (tokens act as bearer tokens)

## Testing

Comprehensive test coverage includes:

- Unit tests for status reset behavior
- Unit tests for token invalidation
- Integration tests for end-to-end flow
- Email rendering tests with confirm/decline buttons

See test files:

- `src/__tests__/unit/actions/appointment-reschedule-status.test.ts`
- `src/__tests__/unit/actions/appointment-reschedule-tokens.test.ts`
- `src/__tests__/integration/appointment-reschedule-confirm-decline.test.ts`
