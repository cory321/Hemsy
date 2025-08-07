# Calendar Reducer Implementation Example

This document shows how to implement the new reducer-based calendar architecture in your application.

## 1. Update the Layout to Include Provider

First, wrap your application with the `AppointmentProvider`:

```tsx
// src/app/(app)/layout.tsx

import { AppointmentProvider } from '@/providers/AppointmentProvider';
import { auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { getUserWithShop } from '@/lib/actions/users';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const userWithShop = await getUserWithShop();
  if (!userWithShop?.shop) redirect('/onboarding');

  return (
    <AppointmentProvider shopId={userWithShop.shop.id}>
      {/* Your existing layout wrapper components */}
      {children}
    </AppointmentProvider>
  );
}
```

## 2. Update the Appointments Page

Replace `CalendarWithQuery` with `CalendarWithReducer`:

```tsx
// src/app/(app)/appointments/AppointmentsClient.tsx

'use client';

import { CalendarWithReducer } from '@/components/appointments/CalendarWithReducer';
import { ShopHours } from '@/types';

interface AppointmentsClientProps {
  shopId: string;
  shopHours: ShopHours[];
  calendarSettings: {
    buffer_time_minutes: number;
    default_appointment_duration: number;
  };
}

export function AppointmentsClient({
  shopId,
  shopHours,
  calendarSettings,
}: AppointmentsClientProps) {
  return (
    <CalendarWithReducer
      shopId={shopId}
      shopHours={shopHours}
      calendarSettings={calendarSettings}
      initialView="month"
    />
  );
}
```

## 3. Using the Appointment Context in Other Components

Components that need to access appointment data can use the `useAppointments` hook:

```tsx
// Example: Dashboard component showing today's appointments

'use client';

import { useAppointments } from '@/providers/AppointmentProvider';
import { format } from 'date-fns';
import { useEffect } from 'react';

export function TodayAppointments({ shopId }: { shopId: string }) {
  const { loadAppointments, getAppointmentsForDateRange } = useAppointments();

  const today = format(new Date(), 'yyyy-MM-dd');

  // Load today's appointments
  useEffect(() => {
    loadAppointments(shopId, {
      startDate: today,
      endDate: today,
    });
  }, [loadAppointments, shopId, today]);

  // Get appointments from the store
  const appointments = getAppointmentsForDateRange(today, today);

  return (
    <div>
      <h2>Today's Appointments ({appointments.length})</h2>
      {appointments.map((appointment) => (
        <div key={appointment.id}>
          {appointment.start_time} - {appointment.client?.first_name}{' '}
          {appointment.client?.last_name}
        </div>
      ))}
    </div>
  );
}
```

## 4. Updating Appointment Notes (Example)

Here's how to update appointment notes with proper optimistic updates:

```tsx
// Example: Notes editor component

'use client';

import { useState } from 'react';
import { useAppointments } from '@/providers/AppointmentProvider';
import { Button, TextField } from '@mui/material';

export function AppointmentNotesEditor({
  appointmentId: string,
  currentNotes: string | null
}) {
  const { updateAppointment } = useAppointments();
  const [notes, setNotes] = useState(currentNotes || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);

    try {
      // This will trigger optimistic update
      await updateAppointment(appointmentId, {
        id: appointmentId,
        notes: notes || null,
      });

      // Success is handled by the provider with a toast
    } catch (error) {
      // Error is also handled by the provider
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <TextField
        multiline
        rows={4}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        disabled={saving}
      />
      <Button
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? 'Saving...' : 'Save Notes'}
      </Button>
    </div>
  );
}
```

## 5. Real-time Updates

The provider automatically handles real-time updates from Supabase. When another user creates, updates, or cancels an appointment, it will automatically appear in all connected clients:

```tsx
// No code needed! Real-time is built-in

// When User A creates an appointment:
await createAppointment(shopId, appointmentData);

// When User A cancels an appointment:
await cancelAppointment(appointmentId);

// User B will automatically see the changes appear
// without any additional code or refresh
```

## 6. Advanced Usage: Custom Date Range

For reports or custom views, you can load specific date ranges:

```tsx
// Example: Monthly report component

'use client';

import { useAppointments } from '@/providers/AppointmentProvider';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { useEffect, useState } from 'react';

export function MonthlyReport({ shopId: string, month: Date }) {
  const { loadAppointments, getAppointmentsForDateRange, isDateRangeLoaded } =
    useAppointments();

  const [loading, setLoading] = useState(false);

  const monthStart = format(startOfMonth(month), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(month), 'yyyy-MM-dd');

  useEffect(() => {
    // Check if data is already loaded
    if (!isDateRangeLoaded(monthStart, monthEnd)) {
      setLoading(true);
      loadAppointments(shopId, {
        startDate: monthStart,
        endDate: monthEnd,
      }).finally(() => setLoading(false));
    }
  }, [loadAppointments, shopId, monthStart, monthEnd, isDateRangeLoaded]);

  const appointments = getAppointmentsForDateRange(monthStart, monthEnd);

  // Calculate statistics
  const stats = {
    total: appointments.length,
    confirmed: appointments.filter((a) => a.status === 'confirmed').length,
    pending: appointments.filter((a) => a.status === 'pending').length,
    cancelled: appointments.filter((a) => a.status === 'canceled').length,
  };

  if (loading) return <div>Loading report...</div>;

  return (
    <div>
      <h2>Monthly Report - {format(month, 'MMMM yyyy')}</h2>
      <ul>
        <li>Total Appointments: {stats.total}</li>
        <li>Confirmed: {stats.confirmed}</li>
        <li>Pending: {stats.pending}</li>
        <li>Cancelled: {stats.cancelled}</li>
      </ul>
    </div>
  );
}
```

## 7. Canceling Appointments

Instead of deleting appointments, we cancel them to maintain an audit trail:

```tsx
// Example: Cancel appointment button

'use client';

import { useState } from 'react';
import { useAppointments } from '@/providers/AppointmentProvider';
import { Button } from '@mui/material';

export function CancelAppointmentButton({ appointmentId: string }) {
  const { cancelAppointment } = useAppointments();
  const [canceling, setCanceling] = useState(false);

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    setCanceling(true);

    try {
      // This updates the status to 'canceled'
      await cancelAppointment(appointmentId);

      // Success is handled by the provider with a toast
    } catch (error) {
      // Error is also handled by the provider
    } finally {
      setCanceling(false);
    }
  };

  return (
    <Button onClick={handleCancel} disabled={canceling} color="error">
      {canceling ? 'Canceling...' : 'Cancel Appointment'}
    </Button>
  );
}
```

## 8. Testing

The reducer architecture makes testing much easier:

```tsx
// __tests__/appointments-reducer.test.ts

import {
  appointmentReducer,
  initialAppointmentState,
  AppointmentActionType,
} from '@/lib/reducers/appointments-reducer';

describe('Appointment Reducer', () => {
  it('should handle CREATE_APPOINTMENT_OPTIMISTIC', () => {
    const tempId = 'temp-123';
    const appointment = {
      id: tempId,
      shop_id: 'shop-1',
      client_id: 'client-1',
      date: '2024-01-15',
      start_time: '10:00',
      end_time: '11:00',
      type: 'consultation' as const,
      status: 'pending' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const newState = appointmentReducer(initialAppointmentState, {
      type: AppointmentActionType.CREATE_APPOINTMENT_OPTIMISTIC,
      payload: { appointment, tempId },
    });

    expect(newState.appointments.get(tempId)).toEqual(appointment);
    expect(newState.optimisticUpdates.has(tempId)).toBe(true);
  });

  it('should prevent race conditions', () => {
    // Start loading request 1
    const state1 = appointmentReducer(initialAppointmentState, {
      type: AppointmentActionType.LOAD_APPOINTMENTS_START,
      payload: {
        dateRange: { startDate: '2024-01-01', endDate: '2024-01-31' },
        requestId: 'req-1',
      },
    });

    // Start loading request 2 (user navigated quickly)
    const state2 = appointmentReducer(state1, {
      type: AppointmentActionType.LOAD_APPOINTMENTS_START,
      payload: {
        dateRange: { startDate: '2024-02-01', endDate: '2024-02-28' },
        requestId: 'req-2',
      },
    });

    // Request 1 completes (but should be ignored)
    const state3 = appointmentReducer(state2, {
      type: AppointmentActionType.LOAD_APPOINTMENTS_SUCCESS,
      payload: {
        appointments: [],
        dateRange: { startDate: '2024-01-01', endDate: '2024-01-31' },
        requestId: 'req-1',
      },
    });

    // State should not have changed because req-1 is outdated
    expect(state3.appointments.size).toBe(0);
    expect(state3.loadedRanges).toHaveLength(0);
  });
});
```

## Migration Checklist

- [ ] Add `AppointmentProvider` to your layout
- [ ] Replace `CalendarWithQuery` with `CalendarWithReducer`
- [ ] Update components that use appointment data to use `useAppointments` hook
- [ ] Replace any delete operations with cancel operations
- [ ] Remove manual `router.refresh()` calls
- [ ] Remove manual React Query invalidations
- [ ] Update tests to use the reducer
- [ ] Test real-time updates work correctly
- [ ] Verify optimistic updates for create, update, and cancel operations

## Troubleshooting

### "useAppointments must be used within AppointmentProvider"

Make sure the `AppointmentProvider` is wrapping your component tree at a high enough level.

### Appointments not updating

Check that:

1. The shop ID is correct
2. Real-time subscriptions are enabled in Supabase
3. No errors in the browser console

### Performance issues

The provider automatically cleans up stale data every minute. If you're seeing performance issues:

1. Check if you're loading very large date ranges
2. Consider reducing the stale time for faster cleanup
3. Use the `clearStaleData` function manually if needed
