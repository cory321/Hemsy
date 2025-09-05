import type { Appointment } from '@/types';
import {
  isToday,
  isTomorrow,
  isThisWeek,
  format,
  parseISO,
  addWeeks,
  startOfWeek,
  endOfWeek,
  isWithinInterval,
} from 'date-fns';

export interface AppointmentGroup {
  label: string;
  appointments: Appointment[];
  isCollapsed?: boolean;
}

// Helper function to check if a date is within next week
function isWithinNextWeek(date: Date): boolean {
  const today = new Date();
  const nextWeekStart = startOfWeek(addWeeks(today, 1), { weekStartsOn: 1 });
  const nextWeekEnd = endOfWeek(addWeeks(today, 1), { weekStartsOn: 1 });

  return isWithinInterval(date, { start: nextWeekStart, end: nextWeekEnd });
}

export function groupAppointmentsByDate(
  appointments: Appointment[]
): Record<string, AppointmentGroup> {
  const groups: Record<string, AppointmentGroup> = {};

  // Sort appointments by date and time
  const sortedAppointments = [...appointments].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.start_time.localeCompare(b.start_time);
  });

  sortedAppointments.forEach((appointment) => {
    const appointmentDate = parseISO(appointment.date);
    let groupKey: string;
    let label: string;
    let isCollapsed = false;

    if (isToday(appointmentDate)) {
      groupKey = 'today';
      label = `TODAY - ${format(appointmentDate, 'MMMM d, yyyy')}`;
    } else if (isTomorrow(appointmentDate)) {
      groupKey = 'tomorrow';
      label = `TOMORROW - ${format(appointmentDate, 'MMMM d, yyyy')}`;
    } else if (isThisWeek(appointmentDate, { weekStartsOn: 1 })) {
      groupKey = 'this-week';
      label = 'THIS WEEK';
      isCollapsed = true;
    } else if (isWithinNextWeek(appointmentDate)) {
      groupKey = 'next-week';
      label = 'NEXT WEEK';
      isCollapsed = true;
    } else if (appointmentDate < new Date()) {
      // Group past appointments by month
      groupKey = format(appointmentDate, 'yyyy-MM');
      label = format(appointmentDate, 'MMMM yyyy');
      isCollapsed = true;
    } else {
      // Future appointments beyond next week
      groupKey = format(appointmentDate, 'yyyy-MM');
      label = format(appointmentDate, 'MMMM yyyy');
      isCollapsed = true;
    }

    if (!groups[groupKey]) {
      groups[groupKey] = {
        label,
        appointments: [],
        isCollapsed,
      };
    }

    groups[groupKey]!.appointments.push(appointment);
  });

  return groups;
}

export function getAppointmentTimeDisplay(appointment: Appointment): string {
  // Convert 24-hour time to 12-hour AM/PM format
  const formatTime = (time: string): string => {
    const parts = time.split(':');
    // Handle both HH:MM and HH:MM:SS formats
    if (parts.length < 2 || !parts[0] || !parts[1]) return time; // Return original if format is unexpected

    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);

    if (isNaN(hours) || isNaN(minutes)) return time; // Return original if parsing fails

    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  return `${formatTime(appointment.start_time)} - ${formatTime(appointment.end_time)}`;
}

export function getAppointmentStatusColor(status: string): string {
  switch (status) {
    case 'confirmed':
      return 'success';
    case 'pending':
      return 'warning';
    case 'canceled':
    case 'no_show':
      return 'error';
    case 'declined':
      return 'default';
    default:
      return 'default';
  }
}

export function getAppointmentStatusIcon(status: string): string {
  switch (status) {
    case 'confirmed':
      return '●'; // Filled circle
    case 'pending':
      return '○'; // Empty circle
    case 'canceled':
    case 'no_show':
      return '✗'; // X mark
    case 'declined':
      return '✓'; // Checkmark
    default:
      return '○';
  }
}
