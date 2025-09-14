import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
} from 'date-fns';
import {
  safeParseDate,
  safeParseDateTime,
  isDateTimeInPast,
  formatDateForDatabase,
} from './date-time-utils';

// Generate calendar days for month view
export function generateMonthDays(date: Date) {
  const start = startOfWeek(startOfMonth(date));
  const end = endOfWeek(endOfMonth(date));
  const days = [];

  let current = start;
  while (current <= end) {
    days.push(new Date(current));
    current = addDays(current, 1);
  }

  return days;
}

// Generate calendar days for week view
export function generateWeekDays(date: Date) {
  const start = startOfWeek(date);
  const days = [];

  for (let i = 0; i < 7; i++) {
    days.push(new Date(addDays(start, i)));
  }

  return days;
}

// Format time for display
export function formatTime(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  const period = (hours ?? 0) >= 12 ? 'PM' : 'AM';
  const displayHours = (hours ?? 0) % 12 || 12;
  return `${displayHours}:${(minutes ?? 0).toString().padStart(2, '0')} ${period}`;
}

// Convert 24-hour time to 12-hour format
export function to12HourFormat(time24: string): string {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = (hours ?? 0) >= 12 ? 'PM' : 'AM';
  const hours12 = (hours ?? 0) % 12 || 12;
  return `${hours12}:${(minutes ?? 0).toString().padStart(2, '0')} ${period}`;
}

// Convert 12-hour time to 24-hour format
export function to24HourFormat(time12: string): string {
  const match = time12.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return time12;

  const [, hours, minutes, period] = match;
  let hours24 = parseInt(hours!);

  if (period!.toUpperCase() === 'PM' && hours24 !== 12) {
    hours24 += 12;
  } else if (period!.toUpperCase() === 'AM' && hours24 === 12) {
    hours24 = 0;
  }

  return `${hours24.toString().padStart(2, '0')}:${minutes!}`;
}

// Get time slots for appointment scheduling
export function generateTimeSlots(
  interval: number = 15,
  startHour: number = 8,
  endHour: number = 18,
  endMinute: number = 0
): string[] {
  const slots = [];

  for (let hour = startHour; hour <= endHour; hour++) {
    const maxMinute = hour === endHour ? endMinute : 60;
    for (let minute = 0; minute < maxMinute; minute += interval) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(time);
    }
  }

  return slots;
}

// Check if two time ranges overlap
export function timeRangesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const toMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return (hours ?? 0) * 60 + (minutes ?? 0);
  };

  const start1Min = toMinutes(start1);
  const end1Min = toMinutes(end1);
  const start2Min = toMinutes(start2);
  const end2Min = toMinutes(end2);

  return start1Min < end2Min && end1Min > start2Min;
}

// Add minutes to time string
export function addMinutesToTime(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number);
  const totalMinutes = (hours ?? 0) * 60 + (mins ?? 0) + minutes;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMinutes = totalMinutes % 60;

  return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
}

// Get duration in minutes between two times
export function getDurationMinutes(startTime: string, endTime: string): number {
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);

  const startTotalMinutes = (startHours ?? 0) * 60 + (startMinutes ?? 0);
  const endTotalMinutes = (endHours ?? 0) * 60 + (endMinutes ?? 0);

  return endTotalMinutes - startTotalMinutes;
}

// Format duration for display
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  }

  return `${hours}h ${mins}min`;
}

// Get appointment color based on type
export function getAppointmentColor(type: string): string {
  const colors = {
    consultation: '#A08DA9', // Orange
    fitting: '#8da88e', // Blue
    pickup: '#994D65', // Green
    delivery: '#E1A98F', // Purple
    other: '#7c99ad', // Grey
  };

  return colors[type as keyof typeof colors] || colors.other;
}

// Day names
export const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

// Get day name from day number
export function getDayName(dayNumber: number): string {
  return DAYS_OF_WEEK[dayNumber] || '';
}

// Check if shop is open on a specific date
export function isShopOpen(
  date: Date,
  shopHours: Array<{
    day_of_week: number;
    open_time: string | null;
    close_time: string | null;
    is_closed: boolean;
  }>
): boolean {
  const dayOfWeek = date.getDay();
  const hours = shopHours.find((h) => h.day_of_week === dayOfWeek);

  return hours ? !hours.is_closed : true;
}

// Check if a date is in the past (before today)
export function isPastDate(date: Date): boolean {
  const dateStr = formatDateForDatabase(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = safeParseDate(dateStr);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate < today;
}

// Check if a specific date/time (local) is in the past relative to now
export function isPastDateTime(date: Date, time: string): boolean {
  const dateStr = formatDateForDatabase(date);
  return isDateTimeInPast(dateStr, time);
}

// Check if appointment can be created on a date
export function canCreateAppointment(
  date: Date,
  shopHours: Array<{
    day_of_week: number;
    open_time: string | null;
    close_time: string | null;
    is_closed: boolean;
  }>
): boolean {
  // Cannot create appointments in the past
  if (isPastDate(date)) {
    return false;
  }

  // Cannot create appointments on closed days
  if (!isShopOpen(date, shopHours)) {
    return false;
  }

  return true;
}

// Check if appointment can be created at a specific time on a date
export function canCreateAppointmentAt(
  date: Date,
  time: string,
  shopHours: Array<{
    day_of_week: number;
    open_time: string | null;
    close_time: string | null;
    is_closed: boolean;
  }>
): boolean {
  if (!canCreateAppointment(date, shopHours)) return false;
  if (isPastDateTime(date, time)) return false;
  return true;
}

// Get available time slots for a date
export function getAvailableTimeSlots(
  date: Date,
  shopHours: Array<{
    day_of_week: number;
    open_time: string | null;
    close_time: string | null;
    is_closed: boolean;
  }>,
  existingAppointments: Array<{
    start_time: string;
    end_time: string;
    status?: string;
  }>,
  duration: number = 30,
  bufferMinutes: number = 0,
  allowOverlapping: boolean = false
): string[] {
  const dayOfWeek = date.getDay();
  const hours = shopHours.find((h) => h.day_of_week === dayOfWeek);

  // If shop is closed or no hours defined, return empty
  if (!hours || hours.is_closed || !hours.open_time || !hours.close_time) {
    return [];
  }

  // Generate all possible slots
  const [openHour] = hours.open_time.split(':').map(Number);
  const [closeHour, closeMinute] = hours.close_time.split(':').map(Number);
  const slots = generateTimeSlots(15, openHour, closeHour, closeMinute);

  // Filter out slots that would exceed closing time
  const availableSlots = slots.filter((slot) => {
    const endTime = addMinutesToTime(slot, duration);
    const [endHour, endMin] = endTime.split(':').map(Number);

    // Check if end time is after closing time (allow ending exactly at closing time)
    if (
      (endHour ?? 0) > (closeHour ?? 0) ||
      ((endHour ?? 0) === (closeHour ?? 0) &&
        (endMin ?? 0) > (closeMinute ?? 0))
    ) {
      return false;
    }

    // Filter out slots in the past for the current day
    const now = new Date();
    const isSameDay =
      now.getFullYear() === date.getFullYear() &&
      now.getMonth() === date.getMonth() &&
      now.getDate() === date.getDate();
    if (isSameDay && isPastDateTime(date, slot)) {
      return false;
    }

    // Skip conflict checking entirely if overlapping is allowed
    if (allowOverlapping) {
      return true;
    }

    // Check conflicts with existing appointments (including buffer)
    for (const apt of existingAppointments) {
      // Skip canceled, declined, and no-show appointments - they don't block slots
      if (
        apt.status === 'canceled' ||
        apt.status === 'no_show' ||
        apt.status === 'declined'
      ) {
        continue;
      }

      const aptStartWithBuffer = addMinutesToTime(
        apt.start_time,
        -bufferMinutes
      );
      const aptEndWithBuffer = addMinutesToTime(apt.end_time, bufferMinutes);

      if (
        timeRangesOverlap(slot, endTime, aptStartWithBuffer, aptEndWithBuffer)
      ) {
        return false;
      }
    }

    return true;
  });

  return availableSlots;
}
