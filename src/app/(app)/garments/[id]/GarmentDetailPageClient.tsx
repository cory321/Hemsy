'use client';

import { GarmentProvider } from '@/contexts/GarmentContext';
import { Container, Box } from '@mui/material';
import { Toaster } from 'sonner';
import GarmentDetailContent from './GarmentDetailContent';

interface GarmentDetailPageClientProps {
  garment: any;
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

export default function GarmentDetailPageClient({
  garment,
  shopId,
  shopHours,
  calendarSettings,
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
            shopId={shopId}
            shopHours={shopHours}
            calendarSettings={calendarSettings}
            {...(from !== undefined && { from })}
            {...(orderId !== undefined && { orderId })}
          />
        </Box>
      </Container>
      <Toaster position="bottom-center" richColors />
    </GarmentProvider>
  );
}
