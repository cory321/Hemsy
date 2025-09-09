import { Suspense } from 'react';
import {
  Box,
  Card,
  CardContent,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardAlertsClient } from '@/components/dashboard/alerts';
import { AppointmentsFocus } from '@/components/dashboard/todays-focus';
import { GarmentPipeline } from '@/components/dashboard/garment-pipeline';
import { BusinessOverviewClient } from '@/components/dashboard/business-overview';
import { ReadyForPickupSectionClient } from '@/components/dashboard/garment-pipeline/ReadyForPickupSectionClient';
import { getDashboardDataOptimized } from '@/lib/actions/dashboard-optimized';

// Refined color palette
const refinedColors = {
  background: '#FFFEFC',
};

// Loading component for suspense boundary
function DashboardLoading() {
  return (
    <>
      {/* Main Content Grid Skeleton */}
      <Grid container spacing={3}>
        {/* Left Column - Business Overview Skeleton */}
        <Grid size={{ xs: 12, lg: 3 }}>
          <Stack spacing={3}>
            {/* Business Health Skeleton */}
            <Card elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Business Health
                </Typography>
                <Skeleton variant="rectangular" height={120} />
              </CardContent>
            </Card>
            {/* Quick Actions Skeleton */}
            <Card elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Quick Actions
                </Typography>
                <Stack spacing={2}>
                  <Skeleton variant="rectangular" height={40} />
                  <Skeleton variant="rectangular" height={40} />
                  <Skeleton variant="rectangular" height={40} />
                </Stack>
              </CardContent>
            </Card>
            {/* Recent Activity Skeleton */}
            <Card elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Recent Activity
                </Typography>
                <Stack spacing={1}>
                  <Skeleton variant="text" />
                  <Skeleton variant="text" />
                  <Skeleton variant="text" />
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* Center Column - Garment Pipeline Skeleton */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Stack spacing={3}>
            <Card elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 4, fontWeight: 600 }}>
                  Garment Pipeline
                </Typography>
                {/* Pipeline Overview Skeleton */}
                <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton
                      key={i}
                      variant="rectangular"
                      height={80}
                      sx={{ flex: 1 }}
                    />
                  ))}
                </Stack>
                {/* Highest Priority Garments Skeleton */}
                <Typography variant="subtitle1" sx={{ mb: 3, fontWeight: 600 }}>
                  Highest Priority Garments
                </Typography>
                <Stack spacing={2}>
                  <Skeleton variant="rectangular" height={60} />
                  <Skeleton variant="rectangular" height={60} />
                  <Skeleton variant="rectangular" height={60} />
                </Stack>
              </CardContent>
            </Card>
            {/* Ready for Pickup Skeleton */}
            <Card elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Ready For Pickup
                </Typography>
                <Stack spacing={2}>
                  <Skeleton variant="rectangular" height={60} />
                  <Skeleton variant="rectangular" height={60} />
                  <Skeleton variant="rectangular" height={60} />
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* Right Column - Appointments Focus Skeleton */}
        <Grid size={{ xs: 12, lg: 3 }}>
          <Card elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Appointments
              </Typography>
              {/* Next Appointment Skeleton */}
              <Stack spacing={3}>
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Next Appointment
                  </Typography>
                  <Skeleton variant="rectangular" height={80} />
                </Box>
                {/* Week Overview Skeleton */}
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    This Week
                  </Typography>
                  <Skeleton variant="rectangular" height={100} />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}

// Async component that fetches all data in parallel
async function DashboardContent() {
  try {
    // Single optimized call that fetches all dashboard data
    const data = await getDashboardDataOptimized();

    // Transform shop hours for client components
    const transformedShopHours = data.shopHours.map((hour) => ({
      day_of_week: hour.day_of_week,
      open_time: hour.open_time,
      close_time: hour.close_time,
      is_closed: hour.is_closed ?? false,
    }));

    // Transform calendar settings for client components
    const transformedCalendarSettings = {
      buffer_time_minutes: data.calendarSettings.buffer_time_minutes ?? 0,
      default_appointment_duration:
        data.calendarSettings.default_appointment_duration ?? 30,
    };

    return (
      <>
        {/* Alert Section - Only renders if there are alerts */}
        {(data.overdueData.count > 0 || data.dueTodayData.count > 0) && (
          <DashboardAlertsClient
            overdueData={data.overdueData}
            dueTodayData={data.dueTodayData}
          />
        )}

        {/* Main Content Grid */}
        <Grid container spacing={3}>
          {/* Left Column - Business Overview */}
          <Grid size={{ xs: 12, lg: 3 }}>
            <BusinessOverviewClient
              shopId={data.shop.id}
              shopHours={transformedShopHours}
              calendarSettings={transformedCalendarSettings}
              businessHealthData={data.businessHealthData}
              recentActivity={data.recentActivity || []}
            />
          </Grid>

          {/* Center Column - Garment Pipeline */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <Stack spacing={3}>
              <GarmentPipeline
                stageCounts={data.stageCounts}
                activeGarments={data.activeGarments}
              />
              {data.readyForPickupGarments &&
                data.readyForPickupGarments.length > 0 && (
                  <ReadyForPickupSectionClient
                    garments={data.readyForPickupGarments.slice(0, 3)}
                    totalCount={data.stageCounts['Ready For Pickup'] || 0}
                  />
                )}
            </Stack>
          </Grid>

          {/* Right Column - Appointments Focus */}
          <Grid size={{ xs: 12, lg: 3 }}>
            <AppointmentsFocus
              nextAppointment={data.nextAppointment}
              todayAppointments={data.todayAppointments}
              weekData={data.weekOverviewData}
              weekSummaryStats={data.weekSummaryStats}
              shopHours={transformedShopHours}
              calendarSettings={transformedCalendarSettings}
            />
          </Grid>
        </Grid>
      </>
    );
  } catch (error) {
    console.error('Error loading dashboard:', error);
    // Return empty state on error
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <p>Error loading dashboard. Please refresh the page.</p>
      </Box>
    );
  }
}

export function DashboardServerOptimized() {
  return (
    <Box sx={{ bgcolor: refinedColors.background, minHeight: '100vh', p: 3 }}>
      {/* Header */}
      <DashboardHeader />

      {/* Dashboard content with suspense boundary */}
      <Suspense fallback={<DashboardLoading />}>
        <DashboardContent />
      </Suspense>
    </Box>
  );
}
