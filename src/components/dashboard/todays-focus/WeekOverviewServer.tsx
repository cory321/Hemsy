import { Suspense } from 'react';
import {
  getWeekOverviewData,
  getWeekSummaryStats,
} from '@/lib/actions/dashboard';
import { WeekOverview } from './WeekOverview';
import { Skeleton, Stack, Box } from '@mui/material';

function WeekOverviewLoading() {
  return (
    <Stack spacing={3}>
      {/* Header skeleton */}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Skeleton variant="text" width={100} height={32} />
        <Skeleton variant="text" width={120} height={24} />
      </Stack>

      {/* Week grid skeleton */}
      <Box>
        {/* Day headers */}
        <Stack direction="row" spacing={0.5} sx={{ mb: 1 }}>
          {[...Array(7)].map((_, i) => (
            <Box key={i} sx={{ flex: 1, textAlign: 'center' }}>
              <Skeleton variant="text" width="100%" height={20} />
            </Box>
          ))}
        </Stack>

        {/* Date cells */}
        <Stack direction="row" spacing={0.5}>
          {[...Array(7)].map((_, i) => (
            <Box key={i} sx={{ flex: 1 }}>
              <Skeleton
                variant="rectangular"
                sx={{ aspectRatio: '1', borderRadius: 1.5 }}
              />
            </Box>
          ))}
        </Stack>
      </Box>

      {/* Summary stats skeleton */}
      <Stack spacing={2}>
        <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 2 }} />
        <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 2 }} />
        <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 2 }} />
      </Stack>
    </Stack>
  );
}

async function WeekOverviewData() {
  try {
    const [weekData, summaryStats] = await Promise.all([
      getWeekOverviewData(),
      getWeekSummaryStats(),
    ]);

    return <WeekOverview weekData={weekData} summaryStats={summaryStats} />;
  } catch (error) {
    console.error('Failed to fetch week overview data:', error);
    // Return component with default data on error
    return <WeekOverview />;
  }
}

export function WeekOverviewServer() {
  return (
    <Suspense fallback={<WeekOverviewLoading />}>
      <WeekOverviewData />
    </Suspense>
  );
}
