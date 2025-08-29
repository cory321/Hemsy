'use client';

import { Box } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardAlerts } from '@/components/dashboard/alerts';
import { AppointmentsFocus } from '@/components/dashboard/todays-focus';
import { GarmentPipeline } from '@/components/dashboard/garment-pipeline';
import { BusinessOverview } from '@/components/dashboard/business-overview';
import {
  getTodayAppointmentsDetailed,
  getNextAppointment,
} from '@/lib/actions/dashboard';
import { useEffect, useState } from 'react';
import type { Appointment } from '@/types';

// Refined color palette
const refinedColors = {
  background: '#FFFEFC',
};

export function Dashboard() {
  const [nextAppointment, setNextAppointment] = useState<Appointment | null>(
    null
  );
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAppointmentData() {
      try {
        const [next, today] = await Promise.all([
          getNextAppointment(),
          getTodayAppointmentsDetailed(),
        ]);
        setNextAppointment(next);
        setTodayAppointments(today);
      } catch (error) {
        console.error('Failed to fetch appointment data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAppointmentData();
  }, []);

  return (
    <Box sx={{ bgcolor: refinedColors.background, minHeight: '100vh', p: 3 }}>
      {/* Header */}
      <DashboardHeader />

      {/* Alert Section */}
      <DashboardAlerts />

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Left Column - Business Overview */}
        <Grid size={{ xs: 12, lg: 3 }}>
          <BusinessOverview />
        </Grid>

        {/* Center Column - Garment Pipeline */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <GarmentPipeline />
        </Grid>

        {/* Right Column - Appointments Focus */}
        <Grid size={{ xs: 12, lg: 3 }}>
          <AppointmentsFocus
            nextAppointment={nextAppointment}
            todayAppointments={todayAppointments}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
