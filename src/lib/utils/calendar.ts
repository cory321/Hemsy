import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
} from 'date-fns';

// Generate calendar days for month view
export function generateMonthDays(date: Date) {
  const start = startOfWeek(startOfMonth(date));
  const end = endOfWeek(endOfMonth(date));
  const days = [];

  let current = start;
  while (current <= end) {
    days.push(current);
    current = addDays(current, 1);
  }

  return days;
}

// Generate calendar days for week view
export function generateWeekDays(date: Date) {
  const start = startOfWeek(date);
  const days = [];

  for (let i = 0; i < 7; i++) {
    days.push(addDays(start, i));
  }

  return days;
}

// Format time for display
export function formatTime(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

// Convert 24-hour time to 12-hour format
export function to12HourFormat(time24: string): string {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
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
  endHour: number = 18
): string[] {
  const slots = [];

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += interval) {
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
    return hours * 60 + minutes;
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
  const totalMinutes = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMinutes = totalMinutes % 60;

  return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
}

// Get duration in minutes between two times
export function getDurationMinutes(startTime: string, endTime: string): number {
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);

  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;

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
    consultation: '#FF9800', // Orange
    fitting: '#2196F3', // Blue
    pickup: '#4CAF50', // Green
    delivery: '#9C27B0', // Purple
    other: '#757575', // Grey
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate < today;
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
  }>,
  duration: number = 30,
  bufferMinutes: number = 0
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
  const slots = generateTimeSlots(15, openHour, closeHour);

  // Filter out slots that would exceed closing time
  const availableSlots = slots.filter((slot) => {
    const endTime = addMinutesToTime(slot, duration);
    const [endHour, endMin] = endTime.split(':').map(Number);

    // Check if end time is before or at closing time
    if (
      endHour > closeHour ||
      (endHour === closeHour && endMin > closeMinute)
    ) {
      return false;
    }

    // Check conflicts with existing appointments (including buffer)
    for (const apt of existingAppointments) {
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
