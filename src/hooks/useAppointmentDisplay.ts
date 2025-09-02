/**
 * Hook for displaying appointments with proper timezone conversion
 *
 * This hook handles converting UTC appointment times to the user's local timezone
 * and provides formatted display strings.
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Appointment } from '@/types';
import { getCurrentUserTimezone } from '@/lib/actions/user-timezone';
import { convertUTCToLocal, formatInTimezone } from '@/lib/utils/date-time-utc';
import { format, parseISO } from 'date-fns';

export interface AppointmentDisplay extends Appointment {
  // Local display values
  displayDate: string;
  displayStartTime: string;
  displayEndTime: string;
  displayDateTime: string;
  displayDateTimeFull: string;
  // Original UTC values (if available)
  startAtUTC?: string;
  endAtUTC?: string;
}

/**
 * Hook to get the current user's timezone
 */
export function useUserTimezone() {
  return useQuery({
    queryKey: ['user-timezone'],
    queryFn: getCurrentUserTimezone,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Convert a single appointment to display format
 */
function convertAppointmentForDisplay(
  appointment: Appointment,
  timezone: string
): AppointmentDisplay {
  // Check if we have UTC fields
  const hasUTCFields =
    !!(appointment as any).start_at && !!(appointment as any).end_at;

  let displayDate = appointment.date;
  let displayStartTime = appointment.start_time;
  let displayEndTime = appointment.end_time;

  if (hasUTCFields) {
    // Convert from UTC to local timezone
    const startUTC = (appointment as any).start_at;
    const endUTC = (appointment as any).end_at;

    const startLocal = convertUTCToLocal(startUTC, timezone);
    const endLocal = convertUTCToLocal(endUTC, timezone);

    displayDate = startLocal.date;
    displayStartTime = startLocal.time;
    displayEndTime = endLocal.time;
  }

  // Format display strings
  const dateObj = parseISO(displayDate);
  const displayDateTime = `${format(dateObj, 'MMM d')} at ${formatTime12Hour(displayStartTime)}`;
  const displayDateTimeFull = `${format(dateObj, 'EEEE, MMMM d, yyyy')} at ${formatTime12Hour(displayStartTime)} - ${formatTime12Hour(displayEndTime)}`;

  return {
    ...appointment,
    displayDate,
    displayStartTime,
    displayEndTime,
    displayDateTime,
    displayDateTimeFull,
    ...(hasUTCFields
      ? {
          startAtUTC: (appointment as any).start_at,
          endAtUTC: (appointment as any).end_at,
        }
      : {}),
  };
}

/**
 * Format time string to 12-hour format
 */
function formatTime12Hour(time: string): string {
  const parts = time.split(':');
  const hours = parseInt(parts[0] || '0', 10);
  const minutes = parseInt(parts[1] || '0', 10);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Hook to convert appointments for display with timezone support
 */
export function useAppointmentDisplay(
  appointment: Appointment | null | undefined
): {
  appointment: AppointmentDisplay | null;
  isLoading: boolean;
  timezone: string | null;
} {
  const { data: timezone, isLoading } = useUserTimezone();

  const displayAppointment = useMemo(() => {
    if (!appointment || !timezone) return null;
    return convertAppointmentForDisplay(appointment, timezone);
  }, [appointment, timezone]);

  return {
    appointment: displayAppointment,
    isLoading,
    timezone: timezone || null,
  };
}

/**
 * Hook to convert multiple appointments for display
 */
export function useAppointmentsDisplay(appointments: Appointment[]): {
  appointments: AppointmentDisplay[];
  isLoading: boolean;
  timezone: string | null;
} {
  const { data: timezone, isLoading } = useUserTimezone();

  const displayAppointments = useMemo(() => {
    if (!timezone) return [];
    return appointments.map((apt) =>
      convertAppointmentForDisplay(apt, timezone)
    );
  }, [appointments, timezone]);

  return {
    appointments: displayAppointments,
    isLoading,
    timezone: timezone || null,
  };
}

/**
 * Utility to check if appointment is using UTC fields
 */
export function isUsingUTC(appointment: Appointment): boolean {
  return !!(appointment as any).start_at && !!(appointment as any).end_at;
}
