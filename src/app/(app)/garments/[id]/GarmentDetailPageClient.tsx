'use client';

import { GarmentProvider } from '@/contexts/GarmentContext';
import { Container, Box } from '@mui/material';
import { Toaster } from 'sonner';
import GarmentDetailContent from './GarmentDetailContent';

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
          <GarmentDetailContent
            clientName={clientName}
            from={from}
            orderId={orderId}
          />
        </Box>
      </Container>
      <Toaster position="bottom-center" richColors />
    </GarmentProvider>
  );
}
