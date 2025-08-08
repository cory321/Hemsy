'use client';

import { useMemo, useState } from 'react';
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
import type { Appointment, AppointmentStatus } from '@/types';
import { useInfiniteClientAppointments } from '../../lib/queries/client-appointment-queries';
import { AppointmentsList } from './AppointmentsList';
import { AppointmentFilters } from './AppointmentFilters';

export interface ClientAppointmentsSectionProps {
  clientId: string;
  clientName: string;
  shopId: string;
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
  shopId,
}: ClientAppointmentsSectionProps) {
  const [filters, setFilters] = useState<FilterState>({
    statuses: ['pending', 'confirmed'],
    showPast: false,
    showUpcoming: true,
    showCanceled: false,
  });

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

  return (
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

          {/* Placeholder action - wiring to creation flow will be added later */}
          <IconButton
            color="primary"
            size="small"
            aria-label="new appointment"
            disabled
          >
            <AddIcon />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 2 }} />

        <AppointmentFilters filters={filters} onChange={setFilters} />

        {upcomingQuery.isLoading && pastQuery.isLoading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
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
  );
}

export default ClientAppointmentsSection;
