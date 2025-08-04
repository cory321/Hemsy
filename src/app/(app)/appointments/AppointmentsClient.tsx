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
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  format,
} from 'date-fns';
import { Calendar } from '@/components/appointments/Calendar';
import { CalendarDesktop } from '@/components/appointments/CalendarDesktop';
import { AppointmentDialog } from '@/components/appointments/AppointmentDialog';
import { AppointmentDetailsDialog } from '@/components/appointments/AppointmentDetailsDialog';
import { getAppointments } from '@/lib/actions/appointments';
import type { Appointment } from '@/types';

interface AppointmentsClientProps {
  initialAppointments: Appointment[];
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
}

export function AppointmentsClient({
  initialAppointments,
  shopHours,
  calendarSettings,
}: AppointmentsClientProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [appointments, setAppointments] = useState(initialAppointments);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [currentView] = useState<'month' | 'week' | 'day' | 'list'>('month');

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setDetailsDialogOpen(true);
  };

  const handleDateClick = (date: Date, time?: string) => {
    setSelectedDate(date);
    setSelectedTime(time || null);
    setAppointmentDialogOpen(true);
  };

  const handleEditAppointment = () => {
    setDetailsDialogOpen(false);
    setAppointmentDialogOpen(true);
  };

  const refreshAppointments = useCallback(async () => {
    try {
      let startDate: string;
      let endDate: string;
      const now = new Date();

      switch (currentView) {
        case 'month':
          startDate = format(startOfMonth(now), 'yyyy-MM-dd');
          endDate = format(endOfMonth(now), 'yyyy-MM-dd');
          break;
        case 'week':
          startDate = format(startOfWeek(now), 'yyyy-MM-dd');
          endDate = format(endOfWeek(now), 'yyyy-MM-dd');
          break;
        case 'day':
          startDate = format(now, 'yyyy-MM-dd');
          endDate = format(now, 'yyyy-MM-dd');
          break;
        case 'list':
          // For list view, get a wider range
          startDate = format(startOfMonth(now), 'yyyy-MM-dd');
          endDate = format(
            endOfMonth(new Date(now.getFullYear(), now.getMonth() + 3)),
            'yyyy-MM-dd'
          );
          break;
      }

      const data = await getAppointments(startDate, endDate, currentView);
      setAppointments(data);
    } catch (error) {
      console.error('Failed to refresh appointments:', error);
    }
  }, [currentView]);

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
              variant="contained"
              color="primary"
              size="large"
            >
              New Appointment
            </Button>
          )}
        </Box>

        {/* Calendar */}
        {isMobile ? (
          <Calendar
            appointments={appointments}
            shopHours={shopHours}
            onAppointmentClick={handleAppointmentClick}
            onDateClick={handleDateClick}
            onRefresh={refreshAppointments}
          />
        ) : (
          <CalendarDesktop
            appointments={appointments}
            shopHours={shopHours}
            onAppointmentClick={handleAppointmentClick}
            onDateClick={handleDateClick}
            onRefresh={refreshAppointments}
          />
        )}

        {/* Mobile FAB only */}
        {isMobile && (
          <Fab
            color="primary"
            aria-label="add appointment"
            sx={{
              position: 'fixed',
              bottom: 80,
              right: 16,
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

        {/* Dialogs */}
        <AppointmentDialog
          open={appointmentDialogOpen}
          onClose={() => {
            setAppointmentDialogOpen(false);
            setSelectedAppointment(null);
            setSelectedDate(null);
            setSelectedTime(null);
            refreshAppointments();
          }}
          appointment={selectedAppointment}
          {...(selectedDate && { selectedDate })}
          selectedTime={selectedTime}
          shopHours={shopHours}
          existingAppointments={appointments}
          calendarSettings={calendarSettings}
        />

        {selectedAppointment && (
          <AppointmentDetailsDialog
            open={detailsDialogOpen}
            onClose={() => {
              setDetailsDialogOpen(false);
              setSelectedAppointment(null);
              refreshAppointments();
            }}
            appointment={selectedAppointment}
            onEdit={handleEditAppointment}
          />
        )}
      </Box>
    </Container>
  );
}
