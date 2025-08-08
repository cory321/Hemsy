'use client';

import { Box, Typography } from '@mui/material';
import { AppointmentListItem } from '@/components/clients/AppointmentListItem';
import type { Appointment } from '@/types';
import type { FilterState } from './ClientAppointmentsSection';

export interface AppointmentsListProps {
  upcoming: Appointment[];
  past: Appointment[];
  canceled: Appointment[];
  filters: FilterState;
}

export function AppointmentsList({
  upcoming,
  past,
  canceled,
  filters,
}: AppointmentsListProps) {
  const isEmpty = !upcoming?.length && !past?.length && !canceled?.length;

  if (isEmpty) {
    return (
      <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
        <Typography variant="body1">No appointments to display</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {filters.showUpcoming && upcoming.length > 0 && (
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Upcoming Appointments
          </Typography>
          <Box>
            {upcoming.map((apt) => (
              <AppointmentListItem key={apt.id} appointment={apt} />
            ))}
          </Box>
        </Box>
      )}

      {filters.showPast && past.length > 0 && (
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Past Appointments
          </Typography>
          <Box>
            {past.map((apt) => (
              <AppointmentListItem key={apt.id} appointment={apt} />
            ))}
          </Box>
        </Box>
      )}

      {filters.showCanceled && canceled.length > 0 && (
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Canceled & Rescheduled
          </Typography>
          <Box>
            {canceled.map((apt) => (
              <AppointmentListItem key={apt.id} appointment={apt} />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default AppointmentsList;
