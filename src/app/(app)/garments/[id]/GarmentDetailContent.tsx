'use client';

import { Box, Button } from '@mui/material';
import Grid from '@mui/material/Grid2';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Link from 'next/link';
import GarmentImageSection from './GarmentImageSection';
import GarmentRightColumn from './GarmentRightColumn';
import GarmentHistorySection from './GarmentHistorySection';
import ReadyForPickupBanner from '@/components/garments/ReadyForPickupBanner';
import CancelledOrderBanner from '@/components/garments/CancelledOrderBanner';
import BalanceConfirmationDialog from '@/components/garments/BalanceConfirmationDialog';
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
  const {
    garment,
    balanceDialogOpen,
    balanceCheckData,
    closeBalanceDialog,
    handlePickupWithoutPayment,
    handlePaymentAndPickup,
  } = useGarment();

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

      {/* Show Cancelled Order Banner when order is cancelled */}
      {garment.order?.status === 'cancelled' && (
        <CancelledOrderBanner
          orderNumber={garment.order.order_number}
          orderId={garment.order.id}
        />
      )}

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
          <GarmentRightColumn clientName={clientName} />
        </Grid>
      </Grid>

      {/* Change History - Full Width Table */}
      <GarmentHistorySection garmentId={garment.id} />

      {/* Balance Confirmation Dialog */}
      {balanceCheckData && (
        <BalanceConfirmationDialog
          open={balanceDialogOpen}
          onClose={closeBalanceDialog}
          onConfirmWithoutPayment={handlePickupWithoutPayment}
          onPaymentSuccess={handlePaymentAndPickup}
          balanceDue={balanceCheckData.balanceDue}
          orderTotal={balanceCheckData.orderTotal}
          paidAmount={balanceCheckData.paidAmount}
          orderNumber={balanceCheckData.orderNumber}
          clientName={balanceCheckData.clientName}
          orderId={garment.order_id || ''}
          invoiceId={balanceCheckData.invoiceId}
          clientEmail={balanceCheckData.clientEmail}
        />
      )}
    </>
  );
}
