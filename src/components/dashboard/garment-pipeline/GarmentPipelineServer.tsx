import { Suspense } from 'react';
import { Stack } from '@mui/material';
import {
  getGarmentStageCounts,
  getActiveGarments,
} from '@/lib/actions/dashboard';
import { GarmentPipeline } from './GarmentPipeline';
import { GarmentPipelineLoading } from './GarmentPipelineLoading';
import { ReadyForPickupSection } from './ReadyForPickupSection';

async function GarmentPipelineData() {
  try {
    const [stageCounts, activeGarments] = await Promise.all([
      getGarmentStageCounts(),
      getActiveGarments(),
    ]);

    return (
      <Stack spacing={3}>
        <GarmentPipeline
          stageCounts={stageCounts}
          activeGarments={activeGarments}
        />
        <ReadyForPickupSection
          totalCount={stageCounts['Ready For Pickup'] || 0}
        />
      </Stack>
    );
  } catch (error) {
    console.error('Failed to fetch garment pipeline data:', error);
    // Return empty state on error
    return (
      <Stack spacing={3}>
        <GarmentPipeline stageCounts={{}} activeGarments={[]} />
        <ReadyForPickupSection totalCount={0} />
      </Stack>
    );
  }
}

export function GarmentPipelineServer() {
  return (
    <Suspense fallback={<GarmentPipelineLoading />}>
      <GarmentPipelineData />
    </Suspense>
  );
}
