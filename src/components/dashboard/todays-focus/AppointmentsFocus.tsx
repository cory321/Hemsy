'use client';

import { useState } from 'react';
import { Stack, Card, CardContent, Typography } from '@mui/material';
import { NextAppointmentCard } from './NextAppointmentCard';
import { TodaySchedule } from './TodaySchedule';
import { WeekOverview } from './WeekOverview';
import { ReadyForPickup } from './ReadyForPickup';
import { AppointmentDetailsDialog } from '@/components/appointments/AppointmentDetailsDialog';
import { AppointmentDialog } from '@/components/appointments/AppointmentDialog';
import { useRouter } from 'next/navigation';
import type { Appointment } from '@/types';

interface AppointmentsFocusProps {
  nextAppointment: Appointment | null;
  todayAppointments: Appointment[];
}

export function AppointmentsFocus({
  nextAppointment,
  todayAppointments,
}: AppointmentsFocusProps) {
  const router = useRouter();
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);

  return (
    <Stack spacing={3}>
      {/* Next Appointment Card */}
      <Card elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            Appointments
          </Typography>

          <NextAppointmentCard
            appointment={nextAppointment}
            onCall={() => {
              if (nextAppointment?.client?.phone_number) {
                window.open(
                  `tel:${nextAppointment.client.phone_number}`,
                  '_self'
                );
              }
            }}
            onLocation={() => console.log('Location clicked')}
            onViewDetails={() => {
              if (nextAppointment) {
                setSelectedAppointment(nextAppointment);
                setDetailsDialogOpen(true);
              }
            }}
            onViewClient={() => {
              if (nextAppointment?.client?.id) {
                router.push(`/clients/${nextAppointment.client.id}`);
              }
            }}
            onCopyPhone={() => {
              if (nextAppointment?.client?.phone_number) {
                navigator.clipboard?.writeText(
                  nextAppointment.client.phone_number
                );
                console.log('Phone copied to clipboard');
              }
            }}
            onSendEmail={() => {
              if (nextAppointment?.client?.email) {
                window.open(`mailto:${nextAppointment.client.email}`, '_self');
              }
            }}
          />

          <TodaySchedule appointments={todayAppointments} />
        </CardContent>
      </Card>

      {/* This Week Overview */}
      <Card elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
        <CardContent>
          <WeekOverview onViewCalendar={() => console.log('View calendar')} />
        </CardContent>
      </Card>

      {/* Ready for Pickup */}
      <ReadyForPickup onSendReminders={() => console.log('Send reminders')} />

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
          shopHours={[]}
          existingAppointments={[]}
          calendarSettings={{
            buffer_time_minutes: 0,
            default_appointment_duration: 30,
          }}
          onCreate={async () => {
            // Handle create - shouldn't happen in reschedule mode
            setEditDialogOpen(false);
            setSelectedAppointment(null);
          }}
          onUpdate={async () => {
            // Handle update
            setEditDialogOpen(false);
            setSelectedAppointment(null);
          }}
        />
      )}
    </Stack>
  );
}
