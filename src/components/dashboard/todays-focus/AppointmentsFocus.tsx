'use client';

import { useState, useMemo } from 'react';
import { Stack, Card, CardContent, Typography } from '@mui/material';
import { NextAppointmentCard } from './NextAppointmentCard';
import { TodaySchedule } from './TodaySchedule';
import { WeekOverview } from './WeekOverview';
import { AppointmentDetailsDialog } from '@/components/appointments/AppointmentDetailsDialog';
import { AppointmentDialog } from '@/components/appointments/AppointmentDialog';
import { useRouter } from 'next/navigation';
import { useInterval } from '@/lib/hooks/useInterval';
import { useAppointments } from '@/providers/AppointmentProvider';
import { useQueryClient } from '@tanstack/react-query';
import type { Appointment } from '@/types';
import type { WeekDayData, WeekSummaryStats } from '@/lib/actions/dashboard';
import {
  formatDateToYYYYMMDD,
  getCurrentTimeString,
  normalizeTimeToHHMM,
  isAppointmentHappeningNow,
  isAppointmentPast,
} from '@/lib/utils/date-time-utils';

interface AppointmentsFocusProps {
  nextAppointment: Appointment | null;
  todayAppointments: Appointment[];
  weekData?: WeekDayData[];
  weekSummaryStats?: WeekSummaryStats;
  shopHours?: Array<{
    day_of_week: number;
    open_time: string | null;
    close_time: string | null;
    is_closed: boolean;
  }>;
  calendarSettings?: {
    buffer_time_minutes: number;
    default_appointment_duration: number;
  };
}

export function AppointmentsFocus({
  nextAppointment,
  todayAppointments,
  weekData,
  weekSummaryStats,
  shopHours = [],
  calendarSettings = {
    buffer_time_minutes: 0,
    default_appointment_duration: 30,
  },
}: AppointmentsFocusProps) {
  const router = useRouter();
  const { updateAppointment } = useAppointments();
  const queryClient = useQueryClient();
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute with automatic cleanup
  useInterval(
    () => setCurrentTime(new Date()),
    60000, // Update every minute
    false // Don't run immediately (we already have initial state)
  );

  // Determine the actual next/current appointment and its status
  const { displayAppointment, isHappeningNow } = useMemo(() => {
    if (!nextAppointment && todayAppointments.length === 0) {
      return { displayAppointment: null, isHappeningNow: false };
    }

    // Filter today's appointments to only include current and future ones
    const relevantAppointments = todayAppointments.filter((apt) => {
      // Exclude past appointments
      return !isAppointmentPast(apt.date, apt.end_time);
    });

    // Sort by date and start time
    relevantAppointments.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.start_time.localeCompare(b.start_time);
    });

    // Get the first relevant appointment (could be current or next)
    const firstRelevant = relevantAppointments[0] || nextAppointment;

    if (!firstRelevant) {
      return { displayAppointment: null, isHappeningNow: false };
    }

    // Check if this appointment is happening now
    const isHappeningNow = isAppointmentHappeningNow(
      firstRelevant.date,
      firstRelevant.start_time,
      firstRelevant.end_time
    );

    return { displayAppointment: firstRelevant, isHappeningNow };
  }, [nextAppointment, todayAppointments]);
  // Note: currentTime triggers re-renders but isn't directly used in the memo calculation.
  // The time-based functions (isAppointmentPast, isAppointmentHappeningNow) use new Date() internally.

  return (
    <Stack spacing={3}>
      {/* Next Appointment Card */}
      <Card elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            Appointments
          </Typography>

          <NextAppointmentCard
            appointment={displayAppointment}
            isHappeningNow={isHappeningNow}
            onCall={() => {
              if (displayAppointment?.client?.phone_number) {
                window.open(
                  `tel:${displayAppointment.client.phone_number}`,
                  '_self'
                );
              }
            }}
            onLocation={() => console.log('Location clicked')}
            onViewDetails={() => {
              if (displayAppointment) {
                setSelectedAppointment(displayAppointment);
                setDetailsDialogOpen(true);
              }
            }}
            onViewClient={() => {
              if (displayAppointment?.client?.id) {
                router.push(`/clients/${displayAppointment.client.id}`);
              }
            }}
            onCopyPhone={() => {
              if (displayAppointment?.client?.phone_number) {
                navigator.clipboard?.writeText(
                  displayAppointment.client.phone_number
                );
                console.log('Phone copied to clipboard');
              }
            }}
            onSendEmail={() => {
              if (displayAppointment?.client?.email) {
                window.open(
                  `mailto:${displayAppointment.client.email}`,
                  '_self'
                );
              }
            }}
          />

          <TodaySchedule appointments={todayAppointments} />
        </CardContent>
      </Card>

      {/* This Week Overview */}
      <Card elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
        <CardContent>
          <WeekOverview
            {...(weekData && { weekData })}
            {...(weekSummaryStats && { summaryStats: weekSummaryStats })}
          />
        </CardContent>
      </Card>

      {/* Appointment Details Dialog */}
      {selectedAppointment && (
        <AppointmentDetailsDialog
          open={detailsDialogOpen}
          onClose={() => {
            setDetailsDialogOpen(false);
            setSelectedAppointment(null);
          }}
          appointment={selectedAppointment}
          onEdit={(appointment, isReschedule, sendEmailDefault) => {
            // Close details dialog and open edit dialog
            setDetailsDialogOpen(false);
            setSelectedAppointment(appointment);
            setEditDialogOpen(true);
          }}
        />
      )}

      {/* Appointment Edit Dialog */}
      {selectedAppointment && (
        <AppointmentDialog
          open={editDialogOpen}
          onClose={() => {
            setEditDialogOpen(false);
            setSelectedAppointment(null);
          }}
          appointment={selectedAppointment}
          isReschedule={true}
          rescheduleSendEmailDefault={true}
          selectedDate={new Date(selectedAppointment.date)}
          selectedTime={selectedAppointment.start_time}
          shopHours={shopHours}
          existingAppointments={todayAppointments}
          calendarSettings={calendarSettings}
          onCreate={async () => {
            // Handle create - shouldn't happen in reschedule mode
            setEditDialogOpen(false);
            setSelectedAppointment(null);
          }}
          onUpdate={async (data) => {
            try {
              await updateAppointment(selectedAppointment.id, {
                id: selectedAppointment.id,
                date: data.date,
                startTime: data.startTime,
                endTime: data.endTime,
                type: data.type,
                notes: data.notes || undefined,
                sendEmail: data.sendEmail,
              });

              // Refresh dashboard data
              await queryClient.invalidateQueries({
                queryKey: ['appointments'],
              });
              await queryClient.invalidateQueries({ queryKey: ['dashboard'] });

              setEditDialogOpen(false);
              setSelectedAppointment(null);
            } catch (error) {
              console.error('Failed to update appointment:', error);
            }
          }}
        />
      )}
    </Stack>
  );
}
