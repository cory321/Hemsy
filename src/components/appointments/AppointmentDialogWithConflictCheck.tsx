'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { AppointmentDialog } from './AppointmentDialog';
import { getAppointmentsByTimeRange } from '@/lib/actions/appointments';
import type { Appointment, Client } from '@/types';

interface AppointmentDialogWithConflictCheckProps {
  open: boolean;
  onClose: () => void;
  shopId: string;
  appointment?: Appointment | null;
  isReschedule?: boolean;
  rescheduleSendEmailDefault?: boolean;
  selectedDate?: Date;
  selectedTime?: string | null;
  prefilledClient?: Client | null;
  shopHours?: ReadonlyArray<{
    day_of_week: number;
    open_time: string | null;
    close_time: string | null;
    is_closed: boolean;
  }>;
  calendarSettings?: {
    buffer_time_minutes: number;
    default_appointment_duration: number;
    allow_overlapping_appointments?: boolean;
  };
  onCreate?: (data: {
    clientId: string;
    date: string;
    startTime: string;
    endTime: string;
    type: 'consultation' | 'fitting' | 'pickup' | 'delivery' | 'other';
    notes?: string;
    sendEmail?: boolean;
    timezone?: string;
  }) => Promise<void>;
  onUpdate?: (data: {
    clientId: string;
    date: string;
    startTime: string;
    endTime: string;
    type: 'consultation' | 'fitting' | 'pickup' | 'delivery' | 'other';
    notes?: string;
    status?: string;
    sendEmail?: boolean;
    timezone?: string;
  }) => Promise<void>;
}

/**
 * Smart wrapper around AppointmentDialog that automatically fetches
 * appointments for conflict checking based on the selected date
 */
export function AppointmentDialogWithConflictCheck({
  open,
  onClose,
  shopId,
  appointment,
  isReschedule = false,
  rescheduleSendEmailDefault,
  selectedDate,
  selectedTime,
  prefilledClient,
  shopHours = [],
  calendarSettings = {
    buffer_time_minutes: 0,
    default_appointment_duration: 30,
  },
  onCreate,
  onUpdate,
}: AppointmentDialogWithConflictCheckProps) {
  // Track the current date being viewed in the dialog
  const [dialogDate, setDialogDate] = useState<Date>(() => {
    if (appointment) {
      return new Date(appointment.date);
    }
    if (selectedDate) {
      return selectedDate;
    }
    return new Date();
  });

  // Update dialog date when props change
  useEffect(() => {
    if (open) {
      if (appointment) {
        setDialogDate(new Date(appointment.date));
      } else if (selectedDate) {
        setDialogDate(selectedDate);
      }
    }
  }, [open, appointment, selectedDate]);

  // Calculate date range for fetching appointments (fetch week around selected date)
  const { startDate, endDate } = useMemo(() => {
    const date = dayjs(dialogDate);
    // Fetch appointments for a week around the selected date to handle edge cases
    const start = date.subtract(3, 'day').format('YYYY-MM-DD');
    const end = date.add(3, 'day').format('YYYY-MM-DD');
    return { startDate: start, endDate: end };
  }, [dialogDate]);

  // Fetch appointments for conflict checking
  const { data: existingAppointments = [], isLoading } = useQuery({
    queryKey: ['appointments', 'conflict-check', shopId, startDate, endDate],
    queryFn: async () => {
      try {
        const appointments = await getAppointmentsByTimeRange(
          shopId,
          startDate,
          endDate
        );
        return appointments;
      } catch (error) {
        console.error(
          'Failed to fetch appointments for conflict check:',
          error
        );
        return [];
      }
    },
    enabled: open && !!shopId,
    // Keep data fresh for conflict checking
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // Filter appointments to only include those on the selected date
  const appointmentsForSelectedDate = useMemo(() => {
    const dateStr = dayjs(dialogDate).format('YYYY-MM-DD');
    return existingAppointments.filter((apt) => apt.date === dateStr);
  }, [existingAppointments, dialogDate]);

  // Handle date change in the dialog
  const handleDateChange = (newDate: Date) => {
    setDialogDate(newDate);
  };

  return (
    <AppointmentDialog
      open={open}
      onClose={onClose}
      appointment={appointment || null}
      isReschedule={isReschedule}
      rescheduleSendEmailDefault={rescheduleSendEmailDefault || false}
      selectedDate={dialogDate}
      selectedTime={selectedTime || null}
      prefilledClient={prefilledClient || null}
      shopHours={shopHours}
      existingAppointments={appointmentsForSelectedDate}
      calendarSettings={calendarSettings}
      {...(onCreate ? { onCreate } : {})}
      {...(onUpdate ? { onUpdate } : {})}
      onDateChange={handleDateChange}
      isLoadingAppointments={isLoading}
    />
  );
}
