'use client';

import { Box } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardAlerts } from '@/components/dashboard/alerts';
import { AppointmentsFocus } from '@/components/dashboard/todays-focus';
import { GarmentPipeline } from '@/components/dashboard/garment-pipeline';
import { BusinessOverviewServer } from '@/components/dashboard/business-overview';
import {
  getTodayAppointmentsDetailed,
  getNextAppointment,
  getGarmentStageCounts,
  getActiveGarments,
  type ActiveGarment,
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
  const [stageCounts, setStageCounts] = useState<Record<string, number>>({});
  const [activeGarments, setActiveGarments] = useState<ActiveGarment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [next, today, stages, active] = await Promise.all([
          getNextAppointment(),
          getTodayAppointmentsDetailed(),
          getGarmentStageCounts(),
          getActiveGarments(),
        ]);
        setNextAppointment(next);
        setTodayAppointments(today);
        setStageCounts(stages);
        setActiveGarments(active);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
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
          <BusinessOverviewServer />
        </Grid>

        {/* Center Column - Garment Pipeline */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <GarmentPipeline
            stageCounts={stageCounts}
            activeGarments={activeGarments}
          />
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
