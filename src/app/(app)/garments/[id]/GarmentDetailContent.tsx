'use client';

import { Box, Button } from '@mui/material';
import Grid from '@mui/material/Grid2';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Link from 'next/link';
import GarmentImageSection from './GarmentImageSection';
import GarmentRightColumnOptimistic from './GarmentRightColumnOptimistic';
import ReadyForPickupBanner from '@/components/garments/ReadyForPickupBanner';
import { useGarment } from '@/contexts/GarmentContext';
import GarmentCompletionCelebration from '@/components/garments/GarmentCompletionCelebration';

interface GarmentDetailContentProps {
  clientName: string;
  shopId?: string | undefined;
  shopHours?:
    | ReadonlyArray<{
        day_of_week: number;
        open_time: string | null;
        close_time: string | null;
        is_closed: boolean;
      }>
    | undefined;
  calendarSettings?:
    | {
        buffer_time_minutes: number;
        default_appointment_duration: number;
      }
    | undefined;
  from?: string;
  orderId?: string;
}

export default function GarmentDetailContent({
  clientName,
  shopId,
  shopHours,
  calendarSettings,
  from,
  orderId,
}: GarmentDetailContentProps) {
  const { garment } = useGarment();

  return (
    <>
      <GarmentCompletionCelebration />
      {from === 'order' && orderId ? (
        <Box sx={{ mb: 2 }}>
          <Button
            component={Link}
            href={`/orders/${orderId}`}
            variant="text"
            startIcon={<ArrowBackIcon />}
            aria-label={`Back to Order ${orderId}`}
          >
            Back to Order
          </Button>
        </Box>
      ) : null}

      {/* Show Ready for Pickup Banner when stage is "Ready For Pickup" */}
      {garment.stage === 'Ready For Pickup' && (
        <ReadyForPickupBanner
          garmentId={garment.id}
          garmentName={garment.name || 'Garment'}
        />
      )}

      <Grid container spacing={3}>
        {/* Left Column - Image and Stage */}
        <Grid size={{ xs: 12, md: 4 }}>
          <GarmentImageSection
            clientName={clientName}
            shopId={shopId}
            shopHours={shopHours}
            calendarSettings={calendarSettings}
          />
        </Grid>

        {/* Right Column - Details */}
        <Grid size={{ xs: 12, md: 8 }}>
          <GarmentRightColumnOptimistic clientName={clientName} />
        </Grid>
      </Grid>

      {/* TODO: Services and Payment History sections will be added once database schema is updated */}
      {/* For now, these sections are commented out due to database schema issues */}
    </>
  );
}
