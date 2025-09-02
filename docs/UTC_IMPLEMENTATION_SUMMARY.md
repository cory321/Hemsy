# UTC Implementation Summary

## What We've Implemented

Since there's no production data to migrate, we've gone directly to implementing UTC storage for dates and times.

### ✅ Database Changes

1. **Added timezone columns** to `users` and `shops` tables:
   - `timezone` (TEXT) - IANA timezone identifier (e.g., 'America/Los_Angeles')
   - `timezone_offset` (INTEGER) - Offset in minutes from UTC

2. **Added UTC columns** for time-sensitive data:
   - `appointments.start_at` and `appointments.end_at` (timestamptz)
   - `orders.due_at` (timestamptz)
   - `garments.event_at` and `garments.due_at` (timestamptz)

3. **Created helper functions** in the database:
   - `convert_date_time_to_utc()` - Converts local date/time to UTC
   - `convert_date_to_utc()` - Converts date to UTC (assumes noon local time)

### ✅ Utility Functions

1. **`date-time-utc.ts`** - Core UTC conversion utilities:
   - `convertLocalToUTC()` - Convert local date/time to UTC
   - `convertUTCToLocal()` - Convert UTC to local date/time
   - `formatInTimezone()` - Format UTC dates in specific timezone
   - `validateFutureDateTimeForTimezone()` - Timezone-aware validation

2. **`timezone-helpers.ts`** - Database helper functions:
   - `getShopTimezone()` - Get timezone for a shop
   - `getUserTimezone()` - Get timezone for a user
   - `getCurrentUserTimezone()` - Get current user's timezone
   - `updateUserTimezone()` - Update user timezone
   - `updateShopTimezone()` - Update shop timezone

### ✅ Appointment System Updates

1. **Schema Changes**:
   - Added optional `timezone` parameter to appointment creation/update

2. **Server Actions** (`appointments.ts`):
   - **Create**: Now stores both legacy fields AND UTC timestamps
   - **Update**: Updates UTC timestamps when date/time changes
   - **Validation**: Uses timezone-aware validation

3. **Dual-Write Strategy**:
   - Still writing to legacy `date`, `start_time`, `end_time` fields
   - Also writing to new `start_at`, `end_at` UTC fields
   - This allows gradual migration of read operations

## What's Still Needed

### 1. Frontend Updates 🔧

**AppointmentDialog.tsx** needs to pass timezone:

```typescript
const handleSubmit = async () => {
  const data = {
    // ... existing fields
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
  // ...
};
```

### 2. Appointment Display 📅

Update components to read from UTC fields:

```typescript
// When fetching appointments
const appointments = await getAppointmentsByTimeRange(...);

// Convert UTC to user's timezone for display
const userTimezone = await getCurrentUserTimezone();
appointments.forEach(apt => {
  if (apt.start_at) {
    const { date, time } = convertUTCToLocal(apt.start_at, userTimezone);
    apt.displayDate = date;
    apt.displayTime = time;
  }
});
```

### 3. Onboarding Process 🚀

Add timezone detection:

```typescript
// In onboarding component
const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

// Show confirmation
("We've detected your timezone as America/Los_Angeles (PST). Is this correct?");

// Save to database
await updateUserTimezone(userId, confirmedTimezone);
```

### 4. Other Components 📝

- **Orders**: Update due date handling to use UTC
- **Garments**: Update event/due date handling to use UTC
- **Shop Hours**: Consider timezone for business hours
- **Email Notifications**: Format times in recipient's timezone

## Testing Checklist

- [ ] Create appointment in PST, verify UTC storage in database
- [ ] View same appointment from EST account
- [ ] Create appointment near midnight, verify correct date
- [ ] Test daylight saving time transitions
- [ ] Verify past appointment validation works correctly

## Migration Path

1. **Phase 1** (Current): Dual-write to both fields
2. **Phase 2**: Update all read operations to use UTC fields
3. **Phase 3**: Stop writing to legacy fields
4. **Phase 4**: Drop legacy columns (after confirming everything works)

## Key Decisions Made

1. **Default Timezone**: Using 'America/New_York' as default
2. **Dual-Write**: Keeping legacy fields during transition
3. **Shop vs User Timezone**: Appointments use shop timezone by default
4. **Due Dates**: Stored at noon in shop timezone (for dates without times)

## Next Steps

1. Update `AppointmentDialog.tsx` to send timezone
2. Update calendar/list views to display using UTC fields
3. Add timezone selection to onboarding
4. Test thoroughly across timezones
