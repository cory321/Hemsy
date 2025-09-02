# Direct UTC Implementation Plan

Since there's no production data to migrate, we can implement UTC storage directly.

## Implementation Steps

### 1. Run Database Migration ✅

The migration is ready at `/supabase/migrations/20241228_add_timezone_support.sql`

### 2. Create UTC Date Utilities

```typescript
// src/lib/utils/date-time-utc.ts
import { zonedTimeToUtc, utcToZonedTime, format } from 'date-fns-tz';

export function convertLocalToUTC(
  date: string,
  time: string,
  timezone: string
): Date {
  const dateTime = `${date} ${time}`;
  return zonedTimeToUtc(dateTime, timezone);
}

export function convertUTCToLocal(
  utcDate: Date,
  timezone: string
): { date: string; time: string } {
  const localDate = utcToZonedTime(utcDate, timezone);
  return {
    date: format(localDate, 'yyyy-MM-dd'),
    time: format(localDate, 'HH:mm'),
  };
}
```

### 3. Update Appointment Creation

```typescript
// In appointments.ts
const createAppointmentSchema = z.object({
  // ... existing fields
  timezone: z.string().optional(), // Client timezone
});

// In createAppointment
const startAt = convertLocalToUTC(
  validated.date,
  validated.startTime,
  validated.timezone || 'America/New_York'
);
const endAt = convertLocalToUTC(
  validated.date,
  validated.endTime,
  validated.timezone || 'America/New_York'
);

// Store in database
const insertData = {
  shop_id: validated.shopId,
  client_id: validated.clientId,
  start_at: startAt.toISOString(),
  end_at: endAt.toISOString(),
  // Keep old fields for now (dual write)
  date: validated.date,
  start_time: validated.startTime,
  end_time: validated.endTime,
  // ...
};
```

### 4. Update Appointment Display

```typescript
// When fetching appointments
const appointments = await getAppointments();

// Convert UTC to user's timezone for display
const displayAppointments = appointments.map((apt) => {
  const { date, time } = convertUTCToLocal(apt.start_at, userTimezone);
  return {
    ...apt,
    displayDate: date,
    displayTime: time,
  };
});
```

### 5. Add Timezone to Onboarding

```typescript
// In onboarding component
const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

// Save to user profile
await updateUser({
  timezone: confirmedTimezone,
  timezone_offset: new Date().getTimezoneOffset(),
});
```

## Components to Update

### High Priority

1. **AppointmentDialog.tsx** - Pass timezone from client
2. **appointments.ts** - Store UTC in new columns
3. **Onboarding** - Capture user timezone
4. **User settings** - Allow timezone change

### Medium Priority

1. **Dashboard displays** - Show in user timezone
2. **Calendar views** - Render in user timezone
3. **Email notifications** - Format times in recipient timezone

### Low Priority

1. **Reports** - Handle timezone for date ranges
2. **Shop hours** - Store in shop timezone
3. **Due dates** - Convert to UTC with noon assumption

## Testing Checklist

- [ ] Create appointment in PST, verify UTC storage
- [ ] View appointment from EST, verify correct display
- [ ] Create appointment near midnight, verify date handling
- [ ] Test daylight saving time transitions
- [ ] Verify email notifications show correct timezone
