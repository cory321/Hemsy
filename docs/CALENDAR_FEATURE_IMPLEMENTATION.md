# Calendar Appointments Feature Implementation Guide

## Overview

This document provides a comprehensive guide to the calendar appointments feature implementation based on the user stories provided. The feature allows seamstresses to manage client appointments with working hours enforcement, conflict detection, and multiple calendar views.

## Database Schema

### New Tables Created

1. **appointments**
   - Core appointment data with client relationships
   - Includes type, status, and reminder tracking

2. **shop_hours**
   - Working hours configuration per day of week
   - Supports closed days

3. **calendar_settings**
   - Buffer times between appointments
   - Default durations
   - Walk-in preferences
   - Reminder settings

See: `supabase/migrations/002_create_appointments_tables.sql`

## Key Components

### Server Actions (`src/lib/actions/appointments.ts`)

- `createAppointment` - Creates new appointments with conflict/hours validation
- `updateAppointment` - Updates existing appointments
- `cancelAppointment` - Cancels appointments (sends notifications)
- `completeAppointment` - Marks appointments as completed
- `getAppointments` - Fetches appointments for date ranges
- `createWalkInAppointment` - Quick walk-in creation
- `getShopHours` / `updateShopHours` - Working hours management
- `getCalendarSettings` / `updateCalendarSettings` - Calendar preferences

### Calendar Components

1. **Main Calendar (`src/components/appointments/Calendar.tsx`)**
   - Handles view switching (month/week/day/list)
   - Navigation controls
   - Responsive design

2. **Calendar Views**
   - `MonthView.tsx` - Grid layout with appointment indicators
   - `WeekView.tsx` - Time grid with appointment blocks
   - `DayView.tsx` - Detailed hourly view
   - `ListView.tsx` - Searchable list with filters

3. **Appointment Management**
   - `AppointmentDialog.tsx` - Create/edit appointments
   - `AppointmentDetailsDialog.tsx` - View appointment details
   - `QuickWalkInDialog.tsx` - Fast walk-in creation

4. **Settings Components**
   - `WorkingHoursSettings.tsx` - Configure shop hours
   - `CalendarSettings.tsx` - Buffer times, defaults, reminders

### Utilities (`src/lib/utils/calendar.ts`)

- Date/time manipulation functions
- Conflict detection
- Available slot calculation
- Formatting helpers

## Key Features Implemented

### ✅ Epic 1: Appointment Management

#### Story 1.1 - Create Appointment

- Client selection with autocomplete
- Working hours validation
- Conflict detection with buffer times
- Success notifications (ready for email/SMS integration)

#### Story 1.2 - Edit Appointment

- Full edit capabilities
- Re-validation on changes
- Notification triggers

#### Story 1.3 - Cancel Appointment

- Status update to "Cancelled"
- Confirmation dialog
- Notification triggers

#### Story 1.4 - Complete Appointment

- Mark as completed
- Appears in history

#### Story 1.5 - Multiple Calendar Views

- Month view with day cells
- Week view with time grid
- Day view with detailed timeline
- List view with search/filters

### ✅ Epic 2: Conflict & Rules Enforcement

#### Story 2.1 - Block Overlapping Appointments

- Server-side conflict checking via PostgreSQL function
- Client-side slot availability calculation
- Visual feedback in UI

#### Story 2.2 - Adjustable Buffer Times

- Configurable in settings (0-60 minutes)
- Applied in conflict detection
- Reflected in available slots

#### Story 2.3 - Working Hours Enforcement

- Per-day configuration
- Closed days support
- Grey out unavailable times

#### Story 2.4 - Quick Walk-In Logging

- One-click walk-in creation
- Current time slot checking
- Optional client selection

### ✅ Epic 3: Client Data Handling

#### Story 3.1 - Client Contact Requirements

- Phone/email validation on client creation
- Required fields enforced

#### Story 3.2 - Notification Opt-Out

- Client preferences stored
- Shop preferences in settings
- Conditional notification sending

### ✅ Epic 4: Resilience & System Reliability

#### Story 4.1-4.3 - Network & Error Handling

- Optimistic UI updates
- Error boundaries
- Loading states
- Rollback on failures

#### Story 4.3 - Performance Optimization

- Date-range based data loading
- View-specific queries
- Pagination for list view

## Integration Points

### With Existing Features

1. **Clients Module**
   - Client selection in appointments
   - Contact info for notifications
   - Appointment history on client profile

2. **Settings Page**
   - New "Calendar" tab
   - Working hours configuration
   - Calendar preferences

3. **Navigation**
   - `/appointments` route integrated
   - Mobile-responsive navigation

### Future Integration Points

1. **Orders**
   - Link appointments to orders
   - Show related garments

2. **Notifications**
   - Email via Resend (structure ready)
   - SMS via Twilio (structure ready)

3. **Dashboard**
   - Today's appointments widget
   - Quick appointment creation

## Testing

### Test Coverage Includes:

1. **Integration Tests** (`src/__tests__/integration/appointments.test.ts`)
   - Server action testing
   - Conflict detection
   - Working hours validation

2. **Component Tests** (`src/components/appointments/Calendar.test.tsx`)
   - View switching
   - Navigation
   - Event handling

3. **Utility Tests** (`src/lib/utils/calendar.test.ts`)
   - Date calculations
   - Time formatting
   - Slot availability

## Usage Examples

### Creating an Appointment

```typescript
// In AppointmentDialog.tsx
const appointment = await createAppointment({
  client_id: selectedClient?.id,
  title: 'Dress Fitting',
  date: '2024-02-15',
  start_time: '10:00',
  end_time: '11:00',
  type: 'fitting',
  notes: 'Blue dress alteration',
});
```

### Checking Available Slots

```typescript
// Get available slots for a date
const slots = getAvailableTimeSlots(
  selectedDate,
  shopHours,
  existingAppointments,
  duration,
  bufferMinutes
);
```

### Quick Walk-In

```typescript
// One-click walk-in
await createWalkInAppointment(clientId);
```

## Configuration

### Environment Variables

No new environment variables required. Uses existing Supabase configuration.

### Feature Flags

- `allow_walk_ins` - Enable/disable walk-in appointments
- `send_reminders` - Toggle appointment reminders

## Deployment Checklist

1. ✅ Run database migration: `002_create_appointments_tables.sql`
2. ✅ Update Supabase types if using TypeScript generation
3. ✅ Test appointment creation flow
4. ✅ Verify working hours enforcement
5. ✅ Check conflict detection
6. ✅ Test all calendar views
7. ✅ Verify mobile responsiveness

## Future Enhancements

1. **Recurring Appointments** - Weekly/monthly patterns
2. **Calendar Sync** - Google/Outlook integration
3. **Client Self-Booking** - Public booking page
4. **Resource Management** - Multiple staff/rooms
5. **Waitlist Management** - Cancellation notifications

## Support

For questions or issues:

- Check test files for usage examples
- Review component PropTypes for API
- Consult `architecture.md` for system design
