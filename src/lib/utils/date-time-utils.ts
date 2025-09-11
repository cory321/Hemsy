/**
 * Consolidated date and time utilities for consistent timezone handling
 *
 * Core Strategy:
 * 1. All dates/times from the database are treated as "business local time"
 * 2. We parse them explicitly to avoid timezone ambiguity
 * 3. Comparisons are done in consistent timezone context
 * 4. Display formatting preserves the business date/time
 */

import { format, parseISO } from 'date-fns';

// ============================================================================
// Date Formatting Utilities (Safe Implementations)
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
 * Alias for formatDateToYYYYMMDD for consistency
 */
export function formatDateForDatabase(date: Date): string {
  return formatDateToYYYYMMDD(date);
}

/**
 * Parse a date string (YYYY-MM-DD) to a Date object in local timezone
 * Uses explicit component construction to avoid timezone issues
 */
export function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year!, month! - 1, day!, 0, 0, 0, 0);
}

/**
 * Alias for parseDateString with a more explicit name
 */
export function safeParseDate(dateStr: string): Date {
  return parseDateString(dateStr);
}

/**
 * Parse a date and time string to a Date object in local timezone
 * This ensures consistent behavior across different servers/timezones
 * @param dateStr Date in YYYY-MM-DD format
 * @param timeStr Time in HH:MM format
 */
export function parseDateTimeString(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);

  // Create date in local timezone with explicit components
  return new Date(year!, month! - 1, day!, hours || 0, minutes || 0, 0, 0);
}

/**
 * Alias for parseDateTimeString with a more explicit name
 */
export function safeParseDateTime(dateStr: string, timeStr: string): Date {
  return parseDateTimeString(dateStr, timeStr);
}

/**
 * Get today's date in YYYY-MM-DD format (local timezone)
 */
export function getTodayString(): string {
  return formatDateToYYYYMMDD(new Date());
}

/**
 * Alias for getTodayString
 */
export function getCurrentDateString(): string {
  return getTodayString();
}

/**
 * Get the current time in HH:MM format (24-hour)
 */
export function getCurrentTimeString(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
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

/**
 * Get current date and time for filtering upcoming appointments
 * Returns an object with current date string and time string
 */
export function getCurrentDateTime(): {
  dateStr: string;
  timeStr: string;
} {
  const now = new Date();
  return {
    dateStr: formatDateForDatabase(now),
    timeStr: formatTimeForDatabase(now),
  };
}

/**
 * Format a Date object to HH:MM for database storage
 */
export function formatTimeForDatabase(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Format a Date object to ISO string for timestamptz fields
 */
export function formatTimestampForDatabase(date: Date): string {
  return date.toISOString();
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
// Safe Comparison Functions
// ============================================================================

/**
 * Check if a date/time combination is in the past
 * Uses consistent local timezone comparison
 */
export function isDateTimeInPast(dateStr: string, timeStr: string): boolean {
  // Parse the target date/time
  const targetDateTime = safeParseDateTime(dateStr, timeStr);

  // Get current time in the same format (YYYY-MM-DD HH:MM)
  const now = new Date();
  const currentDateStr = formatDateForDatabase(now);
  const currentTimeStr = formatTimeForDatabase(now);
  const currentDateTime = safeParseDateTime(currentDateStr, currentTimeStr);

  // Compare the parsed dates (both created with same method)
  return targetDateTime.getTime() < currentDateTime.getTime();
}

/**
 * Check if a date/time combination is in the future
 */
export function isDateTimeInFuture(dateStr: string, timeStr: string): boolean {
  const dateTime = safeParseDateTime(dateStr, timeStr);
  const now = new Date();
  return dateTime.getTime() > now.getTime();
}

/**
 * Check if a date string represents today
 */
export function isDateToday(dateStr: string): boolean {
  const date = safeParseDate(dateStr);
  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
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

/**
 * Check if current time is within a time range on a given date
 */
export function isCurrentTimeInRange(
  date: string,
  startTime: string,
  endTime: string
): boolean {
  const start = safeParseDateTime(date, startTime);
  const end = safeParseDateTime(date, endTime);

  // Create current time using same parsing method for consistency
  const now = new Date();
  const currentDateStr = formatDateForDatabase(now);
  const currentTimeStr = formatTimeForDatabase(now);
  const current = safeParseDateTime(currentDateStr, currentTimeStr);

  return current >= start && current <= end;
}

/**
 * Get the number of days between two dates
 * Handles timezone correctly by comparing at midnight
 */
export function daysBetween(date1Str: string, date2Str: string): number {
  const date1 = safeParseDate(date1Str);
  const date2 = safeParseDate(date2Str);

  // Set both to midnight to get accurate day count
  date1.setHours(0, 0, 0, 0);
  date2.setHours(0, 0, 0, 0);

  const diffMs = date2.getTime() - date1.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
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
// Business Logic Helpers
// ============================================================================

/**
 * Validate that an appointment date/time is not in the past
 * Throws an error if the date/time is in the past
 */
export function validateFutureDateTime(dateStr: string, timeStr: string): void {
  if (isDateTimeInPast(dateStr, timeStr)) {
    throw new Error('Cannot create appointments in the past');
  }
}

/**
 * Standard appointment validation
 */
export function validateAppointmentDateTime(
  dateStr: string,
  startTimeStr: string,
  endTimeStr: string
): void {
  // Check not in past
  validateFutureDateTime(dateStr, startTimeStr);

  // Check end time is after start time
  const startTime = safeParseDateTime(dateStr, startTimeStr);
  const endTime = safeParseDateTime(dateStr, endTimeStr);

  if (endTime <= startTime) {
    throw new Error('End time must be after start time');
  }
}

/**
 * Get appointment status based on current time
 */
export function getAppointmentTimeStatus(
  dateStr: string,
  startTime: string,
  endTime: string
): 'past' | 'current' | 'future' {
  const now = new Date();
  const start = safeParseDateTime(dateStr, startTime);
  const end = safeParseDateTime(dateStr, endTime);

  if (now < start) return 'future';
  if (now > end) return 'past';
  return 'current';
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
// Display Helpers
// ============================================================================

/**
 * Format a date for user display (e.g., "Jan 15, 2024")
 * This function is timezone-safe and handles both date-only strings and full timestamps
 */
export function formatDateDisplay(dateStr: string): string {
  return format(parseDateString(dateStr), 'MMM d, yyyy');
}

/**
 * Alias for formatDateDisplay
 */
export function formatDateForDisplay(dateStr: string): string {
  return formatDateDisplay(dateStr);
}

/**
 * Timezone-safe date formatting that matches browser's toLocaleDateString()
 * but avoids timezone shifts by properly handling date-only vs timestamp strings
 *
 * This function:
 * - Returns 'Not set' for null/undefined values
 * - For date-only strings (YYYY-MM-DD): adds T12:00:00 to avoid timezone shifts
 * - For full timestamps: uses as-is
 * - Uses browser's toLocaleDateString() for consistent locale formatting
 */
export function formatDateSafe(dateString: string | null | undefined): string {
  if (!dateString) return 'Not set';

  try {
    // Check if it's already a full timestamp or just a date
    if (dateString.includes('T')) {
      // Full timestamp - use as-is
      return new Date(dateString).toLocaleDateString();
    } else {
      // Date only - add noon time to avoid timezone shifts
      return new Date(dateString + 'T12:00:00').toLocaleDateString();
    }
  } catch (error) {
    console.error('Invalid date in formatDateSafe:', dateString);
    return 'Invalid date';
  }
}

/**
 * Timezone-safe date formatting with custom format string
 * Uses the same timezone-safe logic as formatDateSafe but with custom formatting
 */
export function formatDateSafeCustom(
  dateString: string | null | undefined,
  formatString: string = 'MMM d, yyyy'
): string {
  if (!dateString) return 'Not set';

  try {
    let date: Date;

    // Check if it's already a full timestamp or just a date
    if (dateString.includes('T')) {
      // Full timestamp - use as-is
      date = new Date(dateString);
    } else {
      // Date only - add noon time to avoid timezone shifts
      date = new Date(dateString + 'T12:00:00');
    }

    return format(date, formatString);
  } catch (error) {
    console.error('Invalid date in formatDateSafeCustom:', dateString);
    return 'Invalid date';
  }
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
 * Alias for formatTime12Hour
 */
export function formatTimeForDisplay(timeStr: string): string {
  return formatTime12Hour(timeStr);
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

/**
 * Format a date and time for user display
 */
export function formatDateTimeForDisplay(
  dateStr: string,
  timeStr: string
): string {
  const date = safeParseDateTime(dateStr, timeStr);
  return format(date, 'MMM d, yyyy h:mm a');
}

// ============================================================================
// Specific Business Logic Functions
// ============================================================================

/**
 * Calculate days until a due date (negative if overdue)
 */
export function calculateDaysUntilDue(dueDateStr: string): number {
  const today = getCurrentDateString();
  return daysBetween(today, dueDateStr);
}

/**
 * Format a due date with relative information
 */
export function formatDueDateWithRelative(dueDateStr: string): string {
  const days = calculateDaysUntilDue(dueDateStr);

  if (days < 0) return `${Math.abs(days)} days overdue`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `Due in ${days} days`;
}

/**
 * Check if a shop is currently open based on hours
 */
export function isShopCurrentlyOpen(
  openTime: string,
  closeTime: string
): boolean {
  const today = getCurrentDateString();
  return isCurrentTimeInRange(today, openTime, closeTime);
}

// ============================================================================
// Common Date Patterns
// ============================================================================

/**
 * Get due date info with urgency status
 * @deprecated For garments, use getEnhancedGarmentDueDateInfo which considers service completion
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

/**
 * Get a formatted display string for a garment due date
 * Returns "Overdue", "Due Today", "Due Tomorrow", or the short date format
 * @deprecated Use getEnhancedGarmentDueDateDisplay which considers service completion
 */
export function getGarmentDueDateDisplay(
  dueDateStr: string | null | undefined
): string {
  if (!dueDateStr) return 'No due date';

  const dueDateInfo = getDueDateInfo(dueDateStr);
  if (!dueDateInfo) return 'No due date';

  if (dueDateInfo.isPast) return 'Overdue';
  if (dueDateInfo.isToday) return 'Due Today';
  if (dueDateInfo.isTomorrow) return 'Due Tomorrow';

  return dueDateInfo.shortDate;
}

/**
 * Check if a garment due date should be highlighted as urgent
 * Returns true for overdue items and items due today
 * @deprecated Use isGarmentOverdue from overdue-logic.ts which considers service completion
 */
export function isGarmentDueDateUrgent(
  dueDateStr: string | null | undefined
): boolean {
  if (!dueDateStr) return false;

  const dueDateInfo = getDueDateInfo(dueDateStr);
  if (!dueDateInfo) return false;

  return dueDateInfo.isPast || dueDateInfo.isToday;
}

// Re-export enhanced functions from overdue-logic for convenience
export {
  isGarmentOverdue,
  areAllServicesCompleted,
  getEnhancedDueDateInfo,
  isOrderOverdue,
  type EnhancedDueDateInfo,
  type GarmentOverdueInfo,
  type OrderOverdueInfo,
} from './overdue-logic';

/**
 * Enhanced display function that considers service completion
 * A garment with all services completed shows "Ready for Pickup" instead of "Overdue"
 */
export function getEnhancedGarmentDueDateDisplay(garment: {
  due_date?: string | null;
  stage?: string | null;
  garment_services?: Array<{
    id: string;
    is_done?: boolean | null;
    is_removed?: boolean | null;
  }> | null;
}): string {
  if (!garment.due_date) return 'No due date';

  const { getEnhancedDueDateInfo } = require('./overdue-logic');
  const enhancedInfo = getEnhancedDueDateInfo(garment);

  if (!enhancedInfo) return 'No due date';

  // If all services are completed and past due, show as Ready for Pickup
  if (enhancedInfo.isPast && enhancedInfo.allServicesCompleted) {
    return 'Ready for Pickup';
  }

  if (enhancedInfo.isOverdue) return 'Overdue';
  if (enhancedInfo.isToday) return 'Due Today';
  if (enhancedInfo.isTomorrow) return 'Due Tomorrow';

  return enhancedInfo.shortDate;
}

/**
 * Get a detailed display string for a garment due date
 * Returns specific information like "3 days overdue" or "Due in 5 days"
 */
export function getDetailedDueDateDisplay(
  dueDateStr: string | null | undefined
): string {
  const dueDateInfo = getDueDateInfo(dueDateStr || null);

  if (!dueDateInfo) return 'No due date';

  if (dueDateInfo.isPast) {
    const days = Math.abs(dueDateInfo.daysUntilDue);
    return `${days} day${days !== 1 ? 's' : ''} overdue`;
  }

  if (dueDateInfo.isToday) return 'Due today';
  if (dueDateInfo.isTomorrow) return 'Due tomorrow';

  return `Due in ${dueDateInfo.daysUntilDue} days`;
}

// ============================================================================
// Migration Helpers
// ============================================================================

/**
 * Parse any date string safely, handling various formats
 * Use this when migrating code that might have different date formats
 */
export function parseAnyDateSafely(dateStr: string): Date | null {
  try {
    // Try YYYY-MM-DD format first
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return safeParseDate(dateStr);
    }

    // Try ISO format
    if (dateStr.includes('T')) {
      return parseISO(dateStr);
    }

    // Try creating date directly as last resort
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Convert a date from one format to another safely
 */
export function convertDateFormat(
  dateStr: string,
  fromFormat: string,
  toFormat: string
): string {
  const date = parseAnyDateSafely(dateStr);
  if (!date) {
    throw new Error(`Invalid date: ${dateStr}`);
  }

  return format(date, toFormat);
}

// ============================================================================
// Debug Helpers (Development Only)
// ============================================================================

/**
 * Debug function to log date parsing results
 */
export function debugDateParsing(dateStr: string, timeStr?: string): void {
  if (process.env.NODE_ENV === 'production') return;

  console.group('Date Parsing Debug');
  console.log('Input:', { dateStr, timeStr });

  if (timeStr) {
    const parsed = safeParseDateTime(dateStr, timeStr);
    console.log('Parsed DateTime:', parsed);
    console.log('ISO String:', parsed.toISOString());
    console.log('Local String:', parsed.toString());
  } else {
    const parsed = safeParseDate(dateStr);
    console.log('Parsed Date:', parsed);
    console.log('ISO String:', parsed.toISOString());
    console.log('Local String:', parsed.toString());
  }

  console.groupEnd();
}

/**
 * Log timezone information for debugging
 */
export function logTimezoneInfo(): void {
  if (process.env.NODE_ENV === 'production') return;

  const now = new Date();
  console.group('Timezone Information');
  console.log('Current Time:', now.toString());
  console.log('ISO String:', now.toISOString());
  console.log('Timezone Offset:', now.getTimezoneOffset(), 'minutes');
  console.log('Timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
  console.groupEnd();
}
