/**
 * Comprehensive date and time utilities for consistent handling across the application
 * Handles timezone-aware date formatting, time comparisons, and common date operations
 */

import { format } from 'date-fns';

// ============================================================================
// Date Formatting Utilities
// ============================================================================

/**
 * Convert a Date to YYYY-MM-DD format in local timezone
 * This avoids timezone issues with toISOString() which converts to UTC
 */
export function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse a date string (YYYY-MM-DD) to a Date object in local timezone
 * Prevents UTC conversion issues by explicitly setting time to midnight local
 */
export function parseDateString(dateStr: string): Date {
  // Add time component to ensure local timezone parsing
  return new Date(dateStr + 'T00:00:00');
}

/**
 * Get today's date in YYYY-MM-DD format (local timezone)
 */
export function getTodayString(): string {
  return formatDateToYYYYMMDD(new Date());
}

/**
 * Get the current time in HH:MM format (24-hour)
 */
export function getCurrentTimeString(): string {
  const now = new Date();
  return now.toTimeString().split(' ')[0]?.slice(0, 5) || '00:00';
}

/**
 * Get the current time with seconds in HH:MM:SS format (24-hour)
 */
export function getCurrentTimeWithSeconds(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

// ============================================================================
// Time String Utilities
// ============================================================================

/**
 * Convert a time string (HH:MM:SS or HH:MM) to HH:MM format
 */
export function normalizeTimeToHHMM(
  timeStr: string | null | undefined
): string {
  if (!timeStr) return '00:00';
  return timeStr.slice(0, 5);
}

/**
 * Convert hours and minutes to HH:MM format
 */
export function formatTimeHHMM(hours: number, minutes: number): string {
  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}`;
}

/**
 * Parse time string to hours and minutes
 */
export function parseTimeString(timeStr: string): {
  hours: number;
  minutes: number;
} {
  const [hoursStr, minutesStr] = timeStr.split(':');
  return {
    hours: parseInt(hoursStr || '0', 10),
    minutes: parseInt(minutesStr || '0', 10),
  };
}

// ============================================================================
// Date/Time Comparison Utilities
// ============================================================================

/**
 * Check if a date string represents today
 */
export function isDateToday(dateStr: string): boolean {
  const date = parseDateString(dateStr);
  const today = new Date();
  return formatDateToYYYYMMDD(date) === formatDateToYYYYMMDD(today);
}

/**
 * Check if a date string represents a future date
 */
export function isDateInFuture(dateStr: string): boolean {
  const date = parseDateString(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date > today;
}

/**
 * Check if a date string represents a past date
 */
export function isDateInPast(dateStr: string): boolean {
  const date = parseDateString(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

/**
 * Check if current time is within a time range
 * @param startTime Start time in HH:MM or HH:MM:SS format
 * @param endTime End time in HH:MM or HH:MM:SS format
 * @param currentTime Optional current time to check (defaults to now)
 */
export function isTimeInRange(
  startTime: string,
  endTime: string,
  currentTime?: string
): boolean {
  const current = currentTime || getCurrentTimeString();
  const start = normalizeTimeToHHMM(startTime);
  const end = normalizeTimeToHHMM(endTime);
  const curr = normalizeTimeToHHMM(current);

  return curr >= start && curr <= end;
}

/**
 * Check if a time has passed (comparing to current time)
 */
export function isTimePast(timeStr: string, currentTime?: string): boolean {
  const current = currentTime || getCurrentTimeString();
  const time = normalizeTimeToHHMM(timeStr);
  const curr = normalizeTimeToHHMM(current);

  return curr > time;
}

/**
 * Check if a time is in the future (comparing to current time)
 */
export function isTimeFuture(timeStr: string, currentTime?: string): boolean {
  const current = currentTime || getCurrentTimeString();
  const time = normalizeTimeToHHMM(timeStr);
  const curr = normalizeTimeToHHMM(current);

  return curr < time;
}

// ============================================================================
// Appointment-specific Utilities
// ============================================================================

/**
 * Check if an appointment is currently happening
 */
export function isAppointmentHappeningNow(
  appointmentDate: string,
  startTime: string,
  endTime: string | null | undefined
): boolean {
  // Check if it's today
  if (!isDateToday(appointmentDate)) {
    return false;
  }

  // Use start time as end time if not provided
  const actualEndTime = endTime || startTime;

  // Check if current time is within the appointment window
  return isTimeInRange(startTime, actualEndTime);
}

/**
 * Check if an appointment is in the past
 */
export function isAppointmentPast(
  appointmentDate: string,
  endTime: string | null | undefined
): boolean {
  // If date is in the past, appointment is past
  if (isDateInPast(appointmentDate)) {
    return true;
  }

  // If date is today, check if end time has passed
  if (isDateToday(appointmentDate)) {
    const actualEndTime = endTime || '23:59';
    return isTimePast(actualEndTime);
  }

  // Date is in future
  return false;
}

/**
 * Check if an appointment is in the future
 */
export function isAppointmentFuture(
  appointmentDate: string,
  startTime: string
): boolean {
  // If date is in the future, appointment is future
  if (isDateInFuture(appointmentDate)) {
    return true;
  }

  // If date is today, check if start time is in the future
  if (isDateToday(appointmentDate)) {
    return isTimeFuture(startTime);
  }

  // Date is in past
  return false;
}

/**
 * Get appointment status based on date and time
 */
export type AppointmentStatus = 'past' | 'happening-now' | 'future';

export function getAppointmentStatus(
  appointmentDate: string,
  startTime: string,
  endTime: string | null | undefined
): AppointmentStatus {
  if (isAppointmentHappeningNow(appointmentDate, startTime, endTime)) {
    return 'happening-now';
  }

  if (isAppointmentPast(appointmentDate, endTime)) {
    return 'past';
  }

  return 'future';
}

// ============================================================================
// Time Duration Utilities
// ============================================================================

/**
 * Add minutes to a time string
 */
export function addMinutesToTime(
  timeStr: string,
  minutesToAdd: number
): string {
  const { hours, minutes } = parseTimeString(timeStr);
  const totalMinutes = hours * 60 + minutes + minutesToAdd;
  const newHours = Math.floor(totalMinutes / 60) % 24; // Handle day overflow
  const newMinutes = totalMinutes % 60;
  return formatTimeHHMM(newHours, newMinutes);
}

/**
 * Calculate duration between two time strings (in minutes)
 */
export function getTimeDifferenceInMinutes(
  startTime: string,
  endTime: string
): number {
  const start = parseTimeString(startTime);
  const end = parseTimeString(endTime);

  const startMinutes = start.hours * 60 + start.minutes;
  const endMinutes = end.hours * 60 + end.minutes;

  // Handle cases where end time is on the next day
  if (endMinutes < startMinutes) {
    return 24 * 60 - startMinutes + endMinutes;
  }

  return endMinutes - startMinutes;
}

// ============================================================================
// Date Range Utilities
// ============================================================================

/**
 * Check if a date falls within a date range
 */
export function isDateInRange(
  dateStr: string,
  startDate: string,
  endDate: string
): boolean {
  const date = parseDateString(dateStr);
  const start = parseDateString(startDate);
  const end = parseDateString(endDate);

  return date >= start && date <= end;
}

/**
 * Get an array of dates between start and end (inclusive)
 */
export function getDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = parseDateString(startDate);
  const end = parseDateString(endDate);

  while (current <= end) {
    dates.push(formatDateToYYYYMMDD(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

// ============================================================================
// Formatting for Display
// ============================================================================

/**
 * Format date for display (e.g., "Jan 15, 2024")
 */
export function formatDateDisplay(dateStr: string): string {
  return format(parseDateString(dateStr), 'MMM d, yyyy');
}

/**
 * Format date short (e.g., "Jan 15")
 */
export function formatDateShort(dateStr: string): string {
  return format(parseDateString(dateStr), 'MMM d');
}

/**
 * Format time for display in 12-hour format (e.g., "2:30 PM")
 */
export function formatTime12Hour(timeStr: string): string {
  const { hours, minutes } = parseTimeString(timeStr);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Format time range for display (e.g., "2:30 PM - 3:00 PM")
 */
export function formatTimeRange(
  startTime: string,
  endTime: string | null | undefined
): string {
  const start = formatTime12Hour(startTime);
  if (!endTime || endTime === startTime) {
    return start;
  }
  const end = formatTime12Hour(endTime);
  return `${start} - ${end}`;
}

// ============================================================================
// Common Date Patterns
// ============================================================================

/**
 * Get due date info with urgency status
 */
export interface DueDateInfo {
  date: string;
  shortDate: string;
  daysUntilDue: number;
  isPast: boolean;
  isUrgent: boolean;
  isToday: boolean;
  isTomorrow: boolean;
}

export function getDueDateInfo(dueDateStr: string | null): DueDateInfo | null {
  if (!dueDateStr) return null;

  const dueDate = parseDateString(dueDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);

  const diffTime = dueDate.getTime() - today.getTime();
  const daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return {
    date: formatDateDisplay(dueDateStr),
    shortDate: formatDateShort(dueDateStr),
    daysUntilDue,
    isPast: daysUntilDue < 0,
    isUrgent: daysUntilDue >= 0 && daysUntilDue <= 3,
    isToday: daysUntilDue === 0,
    isTomorrow: daysUntilDue === 1,
  };
}
