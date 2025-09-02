/**
 * Hook for displaying garments with proper timezone conversion
 *
 * This hook handles converting UTC garment dates to the user's local timezone
 * and provides formatted display strings.
 */

import { useMemo } from 'react';
import type { Tables } from '@/types/supabase';
import { useUserTimezone } from '@/hooks/useAppointmentDisplay';
import { convertUTCToLocal, formatInTimezone } from '@/lib/utils/date-time-utc';
import { format, parseISO } from 'date-fns';

export interface GarmentDisplay
  extends Omit<Tables<'garments'>, 'event_at' | 'due_at'> {
  // Local display values
  displayEventDate: string | null;
  displayDueDate: string | null;
  displayEventDateFormatted: string | null;
  displayDueDateFormatted: string | null;
  // Original UTC values (if available)
  eventAtUTC?: string | null;
  dueAtUTC?: string | null;
}

/**
 * Convert a single garment to display format
 */
function convertGarmentForDisplay(
  garment: Tables<'garments'> & {
    event_at?: string | null;
    due_at?: string | null;
  },
  timezone: string
): GarmentDisplay {
  // Check if we have UTC fields
  const hasEventUTC = !!(garment as any).event_at;
  const hasDueUTC = !!(garment as any).due_at;

  let displayEventDate = garment.event_date;
  let displayDueDate = garment.due_date;
  let displayEventDateFormatted: string | null = null;
  let displayDueDateFormatted: string | null = null;

  if (hasEventUTC && garment.event_at) {
    // Convert from UTC to local timezone
    const eventLocal = convertUTCToLocal(garment.event_at, timezone);
    displayEventDate = eventLocal.date;
  }

  if (hasDueUTC && garment.due_at) {
    // Convert from UTC to local timezone
    const dueLocal = convertUTCToLocal(garment.due_at, timezone);
    displayDueDate = dueLocal.date;
  }

  // Format the dates if available
  if (displayEventDate) {
    const dateObj = parseISO(displayEventDate);
    displayEventDateFormatted = format(dateObj, 'MMM d, yyyy');
  }

  if (displayDueDate) {
    const dateObj = parseISO(displayDueDate);
    displayDueDateFormatted = format(dateObj, 'MMM d, yyyy');
  }

  const { event_at, due_at, ...garmentWithoutUTC } = garment;

  return {
    ...garmentWithoutUTC,
    displayEventDate,
    displayDueDate,
    displayEventDateFormatted,
    displayDueDateFormatted,
    ...(hasEventUTC || hasDueUTC
      ? {
          ...(hasEventUTC && { eventAtUTC: garment.event_at }),
          ...(hasDueUTC && { dueAtUTC: garment.due_at }),
        }
      : {}),
  };
}

/**
 * Hook to convert garment for display with timezone support
 */
export function useGarmentDisplay(
  garment:
    | (Tables<'garments'> & {
        event_at?: string | null;
        due_at?: string | null;
      })
    | null
    | undefined
): {
  garment: GarmentDisplay | null;
  isLoading: boolean;
  timezone: string | null;
} {
  const { data: timezone, isLoading } = useUserTimezone();

  const displayGarment = useMemo(() => {
    if (!garment || !timezone) return null;
    return convertGarmentForDisplay(garment, timezone);
  }, [garment, timezone]);

  return {
    garment: displayGarment,
    isLoading,
    timezone: timezone || null,
  };
}

/**
 * Hook to convert multiple garments for display
 */
export function useGarmentsDisplay(
  garments: Array<
    Tables<'garments'> & { event_at?: string | null; due_at?: string | null }
  >
): {
  garments: GarmentDisplay[];
  isLoading: boolean;
  timezone: string | null;
} {
  const { data: timezone, isLoading } = useUserTimezone();

  const displayGarments = useMemo(() => {
    if (!timezone) return [];
    return garments.map((garment) =>
      convertGarmentForDisplay(garment, timezone)
    );
  }, [garments, timezone]);

  return {
    garments: displayGarments,
    isLoading,
    timezone: timezone || null,
  };
}

/**
 * Utility to check if garment is using UTC fields
 */
export function isGarmentUsingUTC(
  garment: Tables<'garments'> & {
    event_at?: string | null;
    due_at?: string | null;
  }
): boolean {
  return !!(garment as any).event_at || !!(garment as any).due_at;
}
