/**
 * UTC-based date and time utilities for consistent timezone handling
 *
 * This module provides functions to convert between local time (in any timezone)
 * and UTC for storage in the database.
 */

import { toZonedTime, fromZonedTime, format as formatTz } from 'date-fns-tz';
import { parseISO } from 'date-fns';

/**
 * Convert a local date and time to UTC for database storage
 * @param date - Date in YYYY-MM-DD format
 * @param time - Time in HH:MM format
 * @param timezone - IANA timezone string (e.g., 'America/Los_Angeles')
 * @returns Date object in UTC
 */
export function convertLocalToUTC(
  date: string,
  time: string,
  timezone: string
): Date {
  // Combine date and time
  const dateTimeStr = `${date}T${time}:00`;

  // Parse as local time in the given timezone and convert to UTC
  const localDate = new Date(dateTimeStr);
  return fromZonedTime(localDate, timezone);
}

/**
 * Convert a UTC date to local date and time components
 * @param utcDate - Date object or ISO string in UTC
 * @param timezone - IANA timezone string
 * @returns Object with date and time strings in local timezone
 */
export function convertUTCToLocal(
  utcDate: Date | string,
  timezone: string
): { date: string; time: string } {
  // Ensure we have a Date object
  const dateObj = typeof utcDate === 'string' ? parseISO(utcDate) : utcDate;

  // Convert UTC to the specified timezone
  const localDate = toZonedTime(dateObj, timezone);

  return {
    date: formatTz(localDate, 'yyyy-MM-dd', { timeZone: timezone }),
    time: formatTz(localDate, 'HH:mm', { timeZone: timezone }),
  };
}

/**
 * Format a UTC date for display in a specific timezone
 * @param utcDate - Date object or ISO string in UTC
 * @param timezone - IANA timezone string
 * @param formatStr - date-fns format string
 * @returns Formatted date string in the specified timezone
 */
export function formatInTimezone(
  utcDate: Date | string,
  timezone: string,
  formatStr: string
): string {
  const dateObj = typeof utcDate === 'string' ? parseISO(utcDate) : utcDate;
  return formatTz(toZonedTime(dateObj, timezone), formatStr, {
    timeZone: timezone,
  });
}

/**
 * Get the current date and time in a specific timezone
 * @param timezone - IANA timezone string
 * @returns Object with current date and time in the specified timezone
 */
export function getCurrentDateTimeInTimezone(timezone: string): {
  date: string;
  time: string;
} {
  const now = new Date();
  return convertUTCToLocal(now, timezone);
}

/**
 * Check if a date/time in a specific timezone is in the past
 * @param date - Date in YYYY-MM-DD format
 * @param time - Time in HH:MM format
 * @param timezone - IANA timezone string
 * @returns true if the date/time is in the past
 */
export function isDateTimeInPastForTimezone(
  date: string,
  time: string,
  timezone: string
): boolean {
  const targetUTC = convertLocalToUTC(date, time, timezone);
  return targetUTC.getTime() < Date.now();
}

/**
 * Validate that a date/time is in the future for a specific timezone
 * @param date - Date in YYYY-MM-DD format
 * @param time - Time in HH:MM format
 * @param timezone - IANA timezone string
 * @throws Error if the date/time is in the past
 */
export function validateFutureDateTimeForTimezone(
  date: string,
  time: string,
  timezone: string
): void {
  if (isDateTimeInPastForTimezone(date, time, timezone)) {
    throw new Error('Cannot create appointments in the past');
  }
}

/**
 * Get timezone offset in minutes for a specific date
 * This accounts for daylight saving time
 * @param timezone - IANA timezone string
 * @param date - Optional date to check (defaults to now)
 * @returns Offset in minutes (negative for west of UTC)
 */
export function getTimezoneOffset(
  timezone: string,
  date: Date = new Date()
): number {
  // Create a date in the target timezone
  const tzDate = toZonedTime(date, timezone);

  // Get the offset by comparing UTC and local representations
  const utcStr = date.toISOString();
  const localStr = formatTz(tzDate, "yyyy-MM-dd'T'HH:mm:ss", {
    timeZone: timezone,
  });

  // Parse both and calculate difference
  const utcTime = new Date(utcStr).getTime();
  const localTime = new Date(localStr + 'Z').getTime(); // Add Z to parse as UTC

  return (localTime - utcTime) / (60 * 1000); // Convert to minutes
}

/**
 * Common timezone presets for North America
 */
export const TIMEZONE_PRESETS = {
  'US/Eastern': 'America/New_York',
  'US/Central': 'America/Chicago',
  'US/Mountain': 'America/Denver',
  'US/Pacific': 'America/Los_Angeles',
  'US/Alaska': 'America/Anchorage',
  'US/Hawaii': 'Pacific/Honolulu',
} as const;

/**
 * Get a user-friendly timezone name
 * @param timezone - IANA timezone string
 * @returns Friendly name (e.g., "Pacific Time")
 */
export function getTimezoneFriendlyName(timezone: string): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'long',
  });

  const parts = formatter.formatToParts(now);
  const timeZoneName = parts.find((part) => part.type === 'timeZoneName');

  return timeZoneName?.value || timezone;
}
