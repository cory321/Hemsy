'use client';

import { useMemo, useState, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  IconButton,
  Skeleton,
  Typography,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AddIcon from '@mui/icons-material/Add';
import Link from 'next/link';
import type { Appointment, AppointmentStatus, Client } from '@/types';
import { useInfiniteClientAppointments } from '../../lib/queries/client-appointment-queries';
import { AppointmentsList } from './AppointmentsList';
import { AppointmentFilters } from './AppointmentFilters';
import { AppointmentDialog } from '../appointments/AppointmentDialog';
import { useAppointments } from '@/providers/AppointmentProvider';

export interface ClientAppointmentsSectionProps {
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

export interface FilterState {
  statuses: AppointmentStatus[];
  showPast: boolean;
  showUpcoming: boolean;
  showCanceled: boolean;
}

export function ClientAppointmentsSection({
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
}: ClientAppointmentsSectionProps) {
  const [filters, setFilters] = useState<FilterState>({
    statuses: ['pending', 'confirmed'],
    showPast: false,
    showUpcoming: true,
    showCanceled: false,
  });
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);

  // Get createAppointment function from the AppointmentProvider
  const { createAppointment } = useAppointments();

  const upcomingQuery = useInfiniteClientAppointments(shopId, clientId, {
    includeCompleted: true,
    statuses: filters.statuses,
    timeframe: 'upcoming',
    pageSize: 10,
  });

  const pastQuery = useInfiniteClientAppointments(shopId, clientId, {
    includeCompleted: true,
    statuses: filters.statuses,
    timeframe: 'past',
    pageSize: 10,
  });

  const groupedAppointments = useMemo(() => {
    const upcoming = (upcomingQuery.data?.pages ?? []).flatMap(
      (p) => p.appointments
    );
    const past = (pastQuery.data?.pages ?? []).flatMap((p) => p.appointments);

    const canceled: Appointment[] = [];
    const upcomingFiltered: Appointment[] = [];
    const pastFiltered: Appointment[] = [];

    for (const apt of upcoming) {
      if (apt.status === 'canceled' || apt.status === 'no_show')
        canceled.push(apt);
      else upcomingFiltered.push(apt);
    }
    for (const apt of past) {
      if (apt.status === 'canceled' || apt.status === 'no_show')
        canceled.push(apt);
      else pastFiltered.push(apt);
    }

    return { upcoming: upcomingFiltered, past: pastFiltered, canceled };
  }, [upcomingQuery.data?.pages, pastQuery.data?.pages]);

  const totalCount =
    (upcomingQuery.data?.pages?.[0]?.total ?? 0) +
    (pastQuery.data?.pages?.[0]?.total ?? 0);

  // Create a client object to prefill in the appointment dialog
  const prefilledClient = useMemo(() => {
    // Parse first and last name from the full name
    const nameParts = clientName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    return {
      id: clientId,
      first_name: firstName,
      last_name: lastName,
      // Use the actual client values passed as props
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

  // Handle appointment creation
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
        // Error is handled in the provider
        console.error('Failed to create appointment:', error);
      }
    },
    [shopId, createAppointment]
  );

  // Handle opening the appointment dialog
  const handleOpenAppointmentDialog = useCallback(() => {
    setAppointmentDialogOpen(true);
  }, []);

  return (
    <>
      <Card elevation={2} sx={{ mt: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography
              variant="h6"
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <CalendarMonthIcon color="primary" />
              Appointments ({totalCount})
            </Typography>

            <IconButton
              color="primary"
              size="small"
              aria-label="new appointment"
              onClick={handleOpenAppointmentDialog}
            >
              <AddIcon />
            </IconButton>
          </Box>

          <Divider sx={{ mb: 2 }} />

          <AppointmentFilters filters={filters} onChange={setFilters} />

          {upcomingQuery.isLoading && pastQuery.isLoading ? (
            <Box
              sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}
            >
              <Skeleton variant="rounded" height={56} />
              <Skeleton variant="rounded" height={56} />
              <Skeleton variant="rounded" height={56} />
            </Box>
          ) : upcomingQuery.error || pastQuery.error ? (
            <Typography color="error" sx={{ mt: 2 }}>
              Failed to load appointments
            </Typography>
          ) : (
            <AppointmentsList
              upcoming={groupedAppointments.upcoming}
              past={groupedAppointments.past}
              canceled={groupedAppointments.canceled}
              filters={filters}
            />
          )}

          {/* Load More Controls */}
          <Box
            sx={{
              mt: 2,
              display: 'flex',
              gap: 2,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            {filters.showPast && pastQuery.hasNextPage && (
              <Button
                variant="outlined"
                onClick={() => pastQuery.fetchNextPage()}
                disabled={pastQuery.isFetchingNextPage}
              >
                {pastQuery.isFetchingNextPage ? 'Loading…' : 'Load more past'}
              </Button>
            )}

            {/* Dedicated paginated view for past */}
            {filters.showPast && (
              <Button
                component={Link}
                href={`/clients/${clientId}/appointments?page=1`}
                variant="text"
              >
                View all past
              </Button>
            )}
          </Box>
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
        existingAppointments={[
          ...groupedAppointments.upcoming,
          ...groupedAppointments.past,
          ...groupedAppointments.canceled,
        ]}
      />
    </>
  );
}

export default ClientAppointmentsSection;
