'use client';

import { useMemo, useState, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  FormControl,
  Skeleton,
  Fade,
  Collapse,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import type { Appointment, AppointmentStatus, Client } from '@/types';
import { useInfiniteClientAppointments } from '@/lib/queries/client-appointment-queries';
import { AppointmentDialog } from '../appointments/AppointmentDialog';
import { useAppointments } from '@/providers/AppointmentProvider';
import { AppointmentTimelineGroup } from './AppointmentTimelineGroup';
import { groupAppointmentsByDate } from '@/lib/utils/appointment-grouping';

export interface ClientAppointmentsSectionV2Props {
  clientId: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAcceptEmail?: boolean;
  clientAcceptSms?: boolean;
  shopId: string;
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

type TimePeriodFilter =
  | 'upcoming'
  | 'today'
  | 'week'
  | 'month'
  | 'past'
  | 'all';
type StatusFilter =
  | 'all'
  | 'active'
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'canceled'
  | 'no_show';

const statusMap: Record<StatusFilter, AppointmentStatus[]> = {
  all: ['pending', 'confirmed', 'declined', 'canceled', 'no_show'],
  active: ['pending', 'confirmed'],
  pending: ['pending'],
  confirmed: ['confirmed'],
  completed: ['declined'], // Assuming 'declined' means completed in this context
  canceled: ['canceled'],
  no_show: ['no_show'],
};

export function ClientAppointmentsSectionV2({
  clientId,
  clientName,
  clientEmail = '',
  clientPhone = '',
  clientAcceptEmail = false,
  clientAcceptSms = false,
  shopId,
  shopHours = [],
  calendarSettings = {
    buffer_time_minutes: 0,
    default_appointment_duration: 30,
  },
}: ClientAppointmentsSectionV2Props) {
  const [timePeriod, setTimePeriod] = useState<TimePeriodFilter>('upcoming');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);

  const { createAppointment } = useAppointments();

  const upcomingQuery = useInfiniteClientAppointments(shopId, clientId, {
    includeCompleted: true,
    statuses: statusMap[statusFilter],
    timeframe: 'upcoming',
    pageSize: 20,
  });

  const pastQuery = useInfiniteClientAppointments(shopId, clientId, {
    includeCompleted: true,
    statuses: statusMap[statusFilter],
    timeframe: 'past',
    pageSize: 20,
  });

  // Select appointments based on time period - let server filtering do the heavy lifting
  const appointments = useMemo(() => {
    switch (timePeriod) {
      case 'upcoming':
        // Only use upcoming query results (server already filtered correctly)
        return upcomingQuery.data?.pages.flatMap((p) => p.appointments) || [];

      case 'past':
        // Only use past query results (server already filtered correctly)
        return pastQuery.data?.pages.flatMap((p) => p.appointments) || [];

      case 'all':
        // Combine both upcoming and past
        const allAppointments: Appointment[] = [];
        if (upcomingQuery.data) {
          allAppointments.push(
            ...upcomingQuery.data.pages.flatMap((p) => p.appointments)
          );
        }
        if (pastQuery.data) {
          allAppointments.push(
            ...pastQuery.data.pages.flatMap((p) => p.appointments)
          );
        }
        return allAppointments;

      case 'today':
      case 'week':
      case 'month': {
        // For these filters, combine both queries then apply client-side date filtering
        const allAppointments: Appointment[] = [];
        if (upcomingQuery.data) {
          allAppointments.push(
            ...upcomingQuery.data.pages.flatMap((p) => p.appointments)
          );
        }
        if (pastQuery.data) {
          allAppointments.push(
            ...pastQuery.data.pages.flatMap((p) => p.appointments)
          );
        }

        // Apply time period filtering
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return allAppointments.filter((apt) => {
          const aptDate = new Date(apt.date);
          aptDate.setHours(0, 0, 0, 0);

          switch (timePeriod) {
            case 'today':
              return aptDate.getTime() === today.getTime();
            case 'week': {
              // Get the start and end of the current week (Sunday to Saturday)
              const startOfWeek = new Date(today);
              const dayOfWeek = startOfWeek.getDay(); // 0 = Sunday, 1 = Monday, etc.
              startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek); // Go back to Sunday
              startOfWeek.setHours(0, 0, 0, 0);

              const endOfWeek = new Date(startOfWeek);
              endOfWeek.setDate(endOfWeek.getDate() + 6); // Saturday
              endOfWeek.setHours(23, 59, 59, 999);

              return aptDate >= startOfWeek && aptDate <= endOfWeek;
            }
            case 'month': {
              // Get the start and end of the current month
              const startOfMonth = new Date(
                today.getFullYear(),
                today.getMonth(),
                1
              );
              startOfMonth.setHours(0, 0, 0, 0);

              const endOfMonth = new Date(
                today.getFullYear(),
                today.getMonth() + 1,
                0
              );
              endOfMonth.setHours(0, 0, 0, 0); // This gives us the last day of current month at 00:00

              return aptDate >= startOfMonth && aptDate <= endOfMonth;
            }
            default:
              return false;
          }
        });
      }

      default:
        return [];
    }
  }, [upcomingQuery.data, pastQuery.data, timePeriod]);

  // Group appointments by date
  const groupedAppointments = useMemo(
    () => groupAppointmentsByDate(appointments),
    [appointments]
  );

  const totalCount = appointments.length;
  const isLoading = upcomingQuery.isLoading || pastQuery.isLoading;
  const hasError = upcomingQuery.error || pastQuery.error;

  // Create prefilled client for appointment dialog
  const prefilledClient = useMemo(() => {
    const nameParts = clientName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    return {
      id: clientId,
      first_name: firstName,
      last_name: lastName,
      email: clientEmail,
      phone_number: clientPhone,
      accept_email: clientAcceptEmail,
      accept_sms: clientAcceptSms,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      shop_id: shopId,
    } as Client;
  }, [
    clientId,
    clientName,
    clientEmail,
    clientPhone,
    clientAcceptEmail,
    clientAcceptSms,
    shopId,
  ]);

  const handleCreateAppointment = useCallback(
    async (data: {
      clientId: string;
      date: string;
      startTime: string;
      endTime: string;
      type: 'consultation' | 'fitting' | 'pickup' | 'delivery' | 'other';
      notes?: string;
      sendEmail?: boolean;
    }) => {
      try {
        await createAppointment(shopId, {
          shopId,
          clientId: data.clientId,
          date: data.date,
          startTime: data.startTime,
          endTime: data.endTime,
          type: data.type,
          notes: data.notes,
          sendEmail: data.sendEmail,
        });
        setAppointmentDialogOpen(false);
      } catch (error) {
        console.error('Failed to create appointment:', error);
      }
    },
    [shopId, createAppointment]
  );

  return (
    <>
      <Card elevation={2} sx={{ mt: 3, overflow: 'visible' }}>
        <CardContent>
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3,
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                minWidth: 0,
                flexShrink: 1,
              }}
            >
              <CalendarMonthIcon color="primary" />
              Appointments
              <Fade in={!isLoading} timeout={300}>
                <Typography component="span" color="text.secondary">
                  ({totalCount})
                </Typography>
              </Fade>
            </Typography>

            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setAppointmentDialogOpen(true)}
              sx={{
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: 3,
                },
              }}
            >
              Schedule New Appointment
            </Button>
          </Box>

          {/* Filters */}
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              mb: 3,
              flexWrap: 'wrap',
            }}
          >
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select
                value={timePeriod}
                onChange={(e) =>
                  setTimePeriod(e.target.value as TimePeriodFilter)
                }
                displayEmpty
                sx={{
                  '& .MuiSelect-select': {
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  },
                }}
              >
                <MenuItem value="upcoming">Upcoming</MenuItem>
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="week">This Week</MenuItem>
                <MenuItem value="month">This Month</MenuItem>
                <MenuItem value="past">Past</MenuItem>
                <MenuItem value="all">All Time</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as StatusFilter)
                }
                displayEmpty
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="active">Active Only</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="confirmed">Confirmed</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="canceled">Canceled</MenuItem>
                <MenuItem value="no_show">No Show</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Content */}
          {isLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Skeleton variant="text" width="30%" height={24} />
              <Skeleton variant="rounded" height={120} />
              <Skeleton variant="rounded" height={120} />
              <Skeleton variant="rounded" height={120} />
            </Box>
          ) : hasError ? (
            <Box
              sx={{
                py: 4,
                textAlign: 'center',
                color: 'error.main',
              }}
            >
              <Typography>Failed to load appointments</Typography>
            </Box>
          ) : appointments.length === 0 ? (
            <Box
              sx={{
                py: 6,
                textAlign: 'center',
                color: 'text.secondary',
              }}
            >
              <CalendarMonthIcon sx={{ fontSize: 48, mb: 2, opacity: 0.3 }} />
              <Typography variant="h6" gutterBottom>
                No appointments{' '}
                {timePeriod === 'upcoming' ? 'scheduled' : 'found'}
              </Typography>
              <Typography variant="body2" sx={{ mb: 3 }}>
                {timePeriod === 'upcoming'
                  ? `Schedule an appointment with ${clientName}`
                  : 'Try adjusting your filters'}
              </Typography>
              {timePeriod === 'upcoming' && (
                <Button
                  variant="outlined"
                  startIcon={<CalendarMonthIcon />}
                  onClick={() => setAppointmentDialogOpen(true)}
                >
                  Schedule Next Appointment
                </Button>
              )}
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {Object.entries(groupedAppointments).map(([dateKey, group]) => (
                <AppointmentTimelineGroup
                  key={dateKey}
                  dateKey={dateKey}
                  group={group}
                  shopId={shopId}
                  shopHours={shopHours}
                  calendarSettings={calendarSettings}
                  existingAppointments={appointments}
                />
              ))}
            </Box>
          )}

          {/* Load More */}
          {(upcomingQuery.hasNextPage || pastQuery.hasNextPage) && (
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Button
                variant="outlined"
                onClick={() => {
                  if (upcomingQuery.hasNextPage) upcomingQuery.fetchNextPage();
                  if (pastQuery.hasNextPage) pastQuery.fetchNextPage();
                }}
                disabled={
                  upcomingQuery.isFetchingNextPage ||
                  pastQuery.isFetchingNextPage
                }
              >
                {upcomingQuery.isFetchingNextPage ||
                pastQuery.isFetchingNextPage
                  ? 'Loading...'
                  : 'Load More'}
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Appointment Dialog */}
      <AppointmentDialog
        open={appointmentDialogOpen}
        onClose={() => setAppointmentDialogOpen(false)}
        onCreate={handleCreateAppointment}
        prefilledClient={prefilledClient}
        shopHours={shopHours}
        calendarSettings={calendarSettings}
        existingAppointments={appointments}
      />
    </>
  );
}

export default ClientAppointmentsSectionV2;
