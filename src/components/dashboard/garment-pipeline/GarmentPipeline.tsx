'use client';

import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  Typography,
  Divider,
  Stack,
  Button,
  Box,
} from '@mui/material';
import { ArrowForward as ArrowForwardIcon } from '@mui/icons-material';
import { PipelineOverview } from './PipelineOverview';
import { ActiveGarmentItem } from './ActiveGarmentItem';
import type { ActiveGarment } from '@/lib/actions/dashboard';

interface GarmentPipelineProps {
  stageCounts: Record<string, number>;
  activeGarments: ActiveGarment[];
}

export function GarmentPipeline({
  stageCounts,
  activeGarments,
}: GarmentPipelineProps) {
  const router = useRouter();

  const handleStageClick = (stage: string) => {
    // Map stage names to URL-friendly parameters
    const stageToUrlParam: Record<string, string> = {
      New: 'new',
      'In Progress': 'in-progress',
      'Ready For Pickup': 'ready-for-pickup',
      Done: 'done',
    };

    const urlParam = stageToUrlParam[stage];
    if (urlParam) {
      router.push(`/garments?stage=${urlParam}`);
    }
  };

  const handleUpdateStatus = (garmentId: string) => {
    router.push(`/garments/${garmentId}`);
  };

  const handleViewAllGarments = () => {
    router.push('/garments');
  };

  return (
    <Card elevation={0} sx={{ border: '1px solid #e0e0e0', height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 4, fontWeight: 600 }}>
          Garment Pipeline
        </Typography>

        {/* Visual Pipeline Overview */}
        <PipelineOverview
          stageCounts={stageCounts}
          onStageClick={handleStageClick}
        />

        <Divider sx={{ my: 3 }} />

        {/* Highest Priority Garments*/}
        <Typography variant="subtitle1" sx={{ mb: 3, fontWeight: 600 }}>
          Highest Priority Garments
        </Typography>

        {activeGarments.length > 0 ? (
          <Stack spacing={2}>
            {activeGarments.map((garment, index) => (
              <ActiveGarmentItem
                key={garment.id}
                garment={garment}
                priority={index === 0} // First item gets priority styling
                onUpdateStatus={() => handleUpdateStatus(garment.id)}
              />
            ))}
          </Stack>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No active garments at the moment
            </Typography>
          </Box>
        )}

        <Button
          fullWidth
          variant="text"
          sx={{ mt: 3 }}
          endIcon={<ArrowForwardIcon />}
          onClick={handleViewAllGarments}
        >
          View all garments
        </Button>
      </CardContent>
    </Card>
  );
}
