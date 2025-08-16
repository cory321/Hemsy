'use client';

import { GarmentProvider } from '@/contexts/GarmentContext';
import { Container, Box, Button, Grid } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Link from 'next/link';
import GarmentImageSection from './GarmentImageSection';
import GarmentRightColumnOptimistic from './GarmentRightColumnOptimistic';
import { Toaster } from 'sonner';

interface GarmentDetailPageClientProps {
  garment: any;
  from?: string;
  orderId?: string;
}

export default function GarmentDetailPageClient({
  garment,
  from,
  orderId,
}: GarmentDetailPageClientProps) {
  // Format client name
  const clientName = garment.order?.client
    ? `${garment.order.client.first_name} ${garment.order.client.last_name}`
    : 'Unknown Client';

  return (
    <GarmentProvider initialGarment={garment}>
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, mb: 4 }}>
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
        </Box>
      </Container>
      <Toaster position="bottom-center" richColors />
    </GarmentProvider>
  );
}
