import { Suspense } from 'react';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import {
  getAppointments,
  getShopHours,
  getCalendarSettings,
} from '@/lib/actions/appointments';
import { getAllClients } from '@/lib/actions/clients';
import { AppointmentsClient } from './AppointmentsClient';
import { CircularProgress, Box } from '@mui/material';

export default async function AppointmentsPage() {
  // Fetch initial data
  const now = new Date();
  const startDate = format(startOfMonth(now), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(now), 'yyyy-MM-dd');

  const [appointments, shopHours, calendarSettings, clients] =
    await Promise.all([
      getAppointments(startDate, endDate, 'month'),
      getShopHours(),
      getCalendarSettings(),
      getAllClients(),
    ]);

  return (
    <Suspense
      fallback={
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      }
    >
      <AppointmentsClient
        initialAppointments={appointments}
        shopHours={shopHours}
        calendarSettings={calendarSettings}
        clients={clients}
      />
    </Suspense>
  );
}
