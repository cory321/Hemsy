'use client';

import { Box, Button, Grid } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Link from 'next/link';
import GarmentImageSection from './GarmentImageSection';
import GarmentRightColumnOptimistic from './GarmentRightColumnOptimistic';
import ReadyForPickupBanner from '@/components/garments/ReadyForPickupBanner';
import { useGarment } from '@/contexts/GarmentContext';

interface GarmentDetailContentProps {
  clientName: string;
  from?: string;
  orderId?: string;
}

export default function GarmentDetailContent({
  clientName,
  from,
  orderId,
}: GarmentDetailContentProps) {
  const { garment } = useGarment();

  return (
    <>
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
        <Grid item xs={12} md={4}>
          <GarmentImageSection clientName={clientName} />
        </Grid>

        {/* Right Column - Details */}
        <Grid item xs={12} md={8}>
          <GarmentRightColumnOptimistic clientName={clientName} />
        </Grid>
      </Grid>
    </>
  );
}
