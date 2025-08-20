'use client';

import { Box } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardAlerts } from '@/components/dashboard/alerts';
import { TodaysFocus } from '@/components/dashboard/todays-focus';
import { GarmentPipeline } from '@/components/dashboard/garment-pipeline';
import { BusinessOverview } from '@/components/dashboard/business-overview';

// Refined color palette
const refinedColors = {
  background: '#FFFEFC',
};

export function Dashboard() {
  return (
    <Box sx={{ bgcolor: refinedColors.background, minHeight: '100vh', p: 3 }}>
      {/* Header */}
      <DashboardHeader />

      {/* Alert Section */}
      <DashboardAlerts />

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Left Column - Today's Focus */}
        <Grid size={{ xs: 12, lg: 3 }}>
          <TodaysFocus />
        </Grid>

        {/* Center Column - Garment Pipeline */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <GarmentPipeline />
        </Grid>

        {/* Right Column - Business Overview */}
        <Grid size={{ xs: 12, lg: 3 }}>
          <BusinessOverview />
        </Grid>
      </Grid>
    </Box>
  );
}
