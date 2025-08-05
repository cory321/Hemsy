'use client';

import { useState, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Fab,
  Button,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { CalendarWithQuery } from '@/components/appointments/CalendarWithQuery';
import { AppointmentDialog } from '@/components/appointments/AppointmentDialog';
import { AppointmentDetailsDialog } from '@/components/appointments/AppointmentDetailsDialog';
import {
  useCreateAppointment,
  useUpdateAppointment,
  useDeleteAppointment,
} from '@/lib/queries/appointment-queries';
import { useQueryClient } from '@tanstack/react-query';
import { appointmentKeys } from '@/lib/queries/appointment-keys';
import type { Appointment, Client } from '@/types';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface AppointmentsClientRefactoredProps {
  shopId: string;
  shopHours: Array<{
    day_of_week: number;
    open_time: string | null;
    close_time: string | null;
    is_closed: boolean;
  }>;
  calendarSettings: {
    buffer_time_minutes: number;
    default_appointment_duration: number;
  };
  clients: Client[];
}

export function AppointmentsClientRefactored({
  shopId,
  shopHours,
  calendarSettings,
  clients,
}: AppointmentsClientRefactoredProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Mutations
  const createMutation = useCreateAppointment({
    onSuccess: () => {
      toast.success('Appointment created successfully');
      setAppointmentDialogOpen(false);
      setSelectedDate(null);
      setSelectedTime(null);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create appointment');
    },
  });

  const updateMutation = useUpdateAppointment({
    onSuccess: () => {
      toast.success('Appointment updated successfully');
      setAppointmentDialogOpen(false);
      setDetailsDialogOpen(false);
      setSelectedAppointment(null);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update appointment');
    },
  });

  const deleteMutation = useDeleteAppointment({
    onSuccess: () => {
      toast.success('Appointment deleted successfully');
      setDetailsDialogOpen(false);
      setSelectedAppointment(null);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete appointment');
    },
  });

  const handleAppointmentClick = useCallback((appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setDetailsDialogOpen(true);
  }, []);

  const handleDateClick = useCallback((date: Date, time?: string) => {
    setSelectedDate(date);
    setSelectedTime(time || null);
    setSelectedAppointment(null);
    setAppointmentDialogOpen(true);
  }, []);

  const handleEditAppointment = useCallback(() => {
    setDetailsDialogOpen(false);
    setAppointmentDialogOpen(true);
  }, []);

  const handleCreateAppointment = useCallback(
    async (data: any) => {
      await createMutation.mutateAsync({
        shopId,
        clientId: data.clientId,
        title: data.title,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        type: data.type,
        notes: data.notes,
      });
    },
    [createMutation, shopId]
  );

  const handleUpdateAppointment = useCallback(
    async (data: any) => {
      if (!selectedAppointment) return;

      await updateMutation.mutateAsync({
        id: selectedAppointment.id,
        shopId,
        clientId: data.clientId,
        title: data.title,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        type: data.type,
        status: data.status,
        notes: data.notes,
        originalDate: selectedAppointment.date,
      });
    },
    [updateMutation, selectedAppointment, shopId]
  );

  const handleDeleteAppointment = useCallback(async () => {
    if (!selectedAppointment) return;

    await deleteMutation.mutateAsync({
      id: selectedAppointment.id,
      shopId,
      date: selectedAppointment.date,
    });
  }, [deleteMutation, selectedAppointment, shopId]);

  const handleRefresh = useCallback(() => {
    // Invalidate all appointment queries for this shop
    queryClient.invalidateQueries({
      queryKey: appointmentKeys.all,
    });
  }, [queryClient]);

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        {/* Page Header with New Appointment Button on Desktop */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Typography variant="h4" component="h1">
            Appointments
          </Typography>

          {/* Desktop New Appointment Button */}
          {!isMobile && (
            <Button
              startIcon={<AddIcon />}
              onClick={() => {
                setSelectedAppointment(null);
                setSelectedDate(null);
                setSelectedTime(null);
                setAppointmentDialogOpen(true);
              }}
            >
              New Appointment
            </Button>
          )}
        </Box>

        {/* Calendar with React Query */}
        <CalendarWithQuery
          shopId={shopId}
          shopHours={shopHours}
          onAppointmentClick={handleAppointmentClick}
          onDateClick={handleDateClick}
        />

        {/* Mobile Floating Action Button */}
        {isMobile && (
          <Fab
            color="primary"
            aria-label="add appointment"
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
              zIndex: 1000,
            }}
            onClick={() => {
              setSelectedAppointment(null);
              setSelectedDate(null);
              setSelectedTime(null);
              setAppointmentDialogOpen(true);
            }}
          >
            <AddIcon />
          </Fab>
        )}

        {/* Appointment Dialog */}
        <AppointmentDialog
          open={appointmentDialogOpen}
          onClose={() => {
            setAppointmentDialogOpen(false);
            setSelectedDate(null);
            setSelectedTime(null);
          }}
          onSubmit={
            selectedAppointment
              ? handleUpdateAppointment
              : handleCreateAppointment
          }
          appointment={selectedAppointment}
          clients={clients}
          defaultDate={selectedDate}
          defaultTime={selectedTime}
          defaultDuration={calendarSettings.default_appointment_duration}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />

        {/* Appointment Details Dialog */}
        {selectedAppointment && (
          <AppointmentDetailsDialog
            open={detailsDialogOpen}
            onClose={() => {
              setDetailsDialogOpen(false);
              setSelectedAppointment(null);
            }}
            appointment={selectedAppointment}
            onEdit={handleEditAppointment}
            onDelete={handleDeleteAppointment}
            isDeleting={deleteMutation.isPending}
          />
        )}
      </Box>
    </Container>
  );
}
