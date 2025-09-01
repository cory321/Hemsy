import { Box } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardAlerts } from '@/components/dashboard/alerts';
import { AppointmentsFocusServer } from '@/components/dashboard/todays-focus';
import { GarmentPipelineServer } from '@/components/dashboard/garment-pipeline/GarmentPipelineServer';
import { BusinessOverviewServer } from '@/components/dashboard/business-overview';

// Refined color palette
const refinedColors = {
  background: '#FFFEFC',
};

export function DashboardServer() {
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
          <GarmentPipelineServer />
        </Grid>

        {/* Right Column - Appointments Focus */}
        <Grid size={{ xs: 12, lg: 3 }}>
          <AppointmentsFocusServer />
        </Grid>
      </Grid>
    </Box>
  );
}
