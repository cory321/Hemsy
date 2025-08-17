'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Box, Paper, Typography, Button, Container } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { Calendar } from './Calendar';
import { CalendarDesktop } from './CalendarDesktop';
import { useCalendarAppointments } from '@/hooks/useCalendarAppointments';
import { useAppointments } from '@/providers/AppointmentProvider';
import { CalendarView } from '@/lib/queries/appointment-keys';
import { Appointment, ShopHours } from '@/types';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { AppointmentDialog } from './AppointmentDialog';
import { AppointmentDetailsDialog } from './AppointmentDetailsDialog';
import {
  CreateAppointmentData,
  UpdateAppointmentData,
} from '@/lib/actions/appointments';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

interface CalendarWithReducerProps {
  shopId: string;
  initialDate?: Date;
  initialView?: CalendarView;
  shopHours?: ShopHours[];
  calendarSettings?: {
    buffer_time_minutes: number;
    default_appointment_duration: number;
  };
  focusAppointmentId?: string;
}

interface DialogState {
  appointment?: Appointment;
  selectedDate?: Date;
  selectedTime?: string | undefined;
  isReschedule?: boolean;
  rescheduleSendEmailDefault?: boolean;
}

export function CalendarWithReducer({
  shopId,
  initialDate = new Date(),
  initialView = 'month',
  shopHours = [],
  calendarSettings = {
    buffer_time_minutes: 0,
    default_appointment_duration: 30,
  },
  focusAppointmentId,
}: CalendarWithReducerProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [view, setView] = useState<CalendarView>(initialView);
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [dialogState, setDialogState] = useState<DialogState>({});

  // Use the custom hook for calendar appointments
  const {
    appointments,
    isLoading,
    error,
    refetch,
    currentDate,
    setCurrentDate,
    navigateNext,
    navigatePrevious,
    navigateToDate,
  } = useCalendarAppointments({
    shopId,
    initialDate,
    view,
    prefetchAdjacent: true,
  });

  // Get CRUD operations from the appointment context
  const { createAppointment, updateAppointment } = useAppointments();

  // Handle appointment click
  const handleAppointmentClick = useCallback((appointment: Appointment) => {
    setDialogState({ appointment });
    setDetailsDialogOpen(true);
  }, []);

  // Handle date/time click for new appointment
  const handleDateClick = useCallback(
    (date: Date, time?: string) => {
      // If clicking from month or week view without a specific time, navigate to day view
      if ((view === 'month' || view === 'week') && !time) {
        // Navigate to the selected date
        navigateToDate(date);
        // Change to day view
        setView('day');
      } else {
        // In other views or when a specific time is provided, open the appointment dialog
        setDialogState({ selectedDate: date, selectedTime: time || undefined });
        setAppointmentDialogOpen(true);
      }
    },
    [view, navigateToDate]
  );

  // Handle edit from details dialog
  const handleEditAppointment = useCallback(
    (
      appointment: Appointment,
      isReschedule?: boolean,
      sendEmailDefault?: boolean
    ) => {
      setDetailsDialogOpen(false);
      setDialogState({
        appointment,
        isReschedule: isReschedule || false,
        ...(sendEmailDefault !== undefined
          ? { rescheduleSendEmailDefault: sendEmailDefault }
          : {}),
      });
      setAppointmentDialogOpen(true);
    },
    []
  );

  // Create appointment
  const handleCreateAppointment = useCallback(
    async (data: Omit<CreateAppointmentData, 'shopId'>) => {
      try {
        await createAppointment(shopId, { ...data, shopId });
        setAppointmentDialogOpen(false);
        setDialogState({});
      } catch (error) {
        // Error is handled in the provider
        console.error('Failed to create appointment:', error);
      }
    },
    [shopId, createAppointment]
  );

  // Update appointment
  const handleUpdateAppointment = useCallback(
    async (data: {
      clientId: string;
      date: string;
      startTime: string;
      endTime: string;
      type: 'consultation' | 'fitting' | 'pickup' | 'delivery' | 'other';
      notes?: string;
      status?: string;
      sendEmail?: boolean;
    }) => {
      if (!dialogState.appointment) return;

      try {
        await updateAppointment(dialogState.appointment.id, {
          id: dialogState.appointment.id,
          date: data.date,
          startTime: data.startTime,
          endTime: data.endTime,
          type: data.type,
          notes: data.notes,
          status: data.status as
            | 'pending'
            | 'declined'
            | 'confirmed'
            | 'canceled'
            | 'no_show'
            | undefined,
          sendEmail: data.sendEmail,
        });
        setAppointmentDialogOpen(false);
        setDialogState({});
      } catch (error) {
        // Error is handled in the provider
        console.error('Failed to update appointment:', error);
      }
    },
    [updateAppointment, dialogState.appointment]
  );

  // Handle view change
  const handleViewChange = useCallback((newView: CalendarView) => {
    setView(newView);
  }, []);

  // Refresh handler - refetch data for current view
  const handleRefresh = useCallback(
    (date?: Date) => {
      if (date) {
        // If a specific date is provided, navigate to it
        navigateToDate(date);
      }
      // Then refetch the data
      refetch();
    },
    [navigateToDate, refetch]
  );

  // Handle Add Appointment button click
  const handleAddAppointmentClick = useCallback(() => {
    setDialogState({ selectedDate: new Date() });
    setAppointmentDialogOpen(true);
  }, []);

  // Error display
  if (error && !isLoading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error" gutterBottom>
          Failed to load appointments
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      {/* Page Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          py: 3,
          mb: 2,
        }}
      >
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          Appointments
        </Typography>
        <Button
          startIcon={<AddIcon />}
          onClick={handleAddAppointmentClick}
          variant="contained"
          color="primary"
          size="large"
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
          }}
        >
          Add Appointment
        </Button>
      </Box>

      {/* Calendar */}
      {isMobile ? (
        <Calendar
          appointments={appointments}
          shopHours={shopHours}
          onAppointmentClick={handleAppointmentClick}
          onDateClick={handleDateClick}
          onRefresh={handleRefresh}
          isLoading={isLoading}
          currentDate={currentDate}
          view={view}
          onViewChange={handleViewChange}
          {...(focusAppointmentId && { focusAppointmentId })}
        />
      ) : (
        <CalendarDesktop
          appointments={appointments}
          shopHours={shopHours}
          onAppointmentClick={handleAppointmentClick}
          onDateClick={handleDateClick}
          onRefresh={handleRefresh}
          isLoading={isLoading}
          currentDate={currentDate}
          view={view}
          onViewChange={handleViewChange}
          {...(focusAppointmentId && { focusAppointmentId })}
        />
      )}

      {/* Create/Edit Dialog */}
      <AppointmentDialog
        open={appointmentDialogOpen}
        onClose={() => {
          setAppointmentDialogOpen(false);
          setDialogState({});
        }}
        appointment={dialogState.appointment || null}
        isReschedule={dialogState.isReschedule || false}
        rescheduleSendEmailDefault={dialogState.rescheduleSendEmailDefault}
        selectedDate={dialogState.selectedDate || new Date()}
        selectedTime={dialogState.selectedTime || null}
        shopHours={shopHours}
        existingAppointments={appointments}
        calendarSettings={calendarSettings}
        onCreate={handleCreateAppointment}
        onUpdate={handleUpdateAppointment}
        {...(appointmentDialogOpen
          ? ({ ['data-testid']: 'appointment-dialog' } as any)
          : {})}
      />

      {/* Details Dialog */}
      {dialogState.appointment && (
        <AppointmentDetailsDialog
          open={detailsDialogOpen}
          onClose={() => {
            setDetailsDialogOpen(false);
            setDialogState({});
          }}
          appointment={dialogState.appointment}
          onEdit={(apt, isRes, sendDefault) =>
            handleEditAppointment(apt, isRes, sendDefault)
          }
        />
      )}
    </Container>
  );
}
