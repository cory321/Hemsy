import { Box, LinearProgress, Typography } from '@mui/material';
import {
  calculatePaymentStatus,
  type PaymentInfo,
} from '@/lib/utils/payment-calculations';

interface PaymentProgressBarProps {
  garmentServices: Array<{
    quantity: number;
    unit_price_cents: number;
    line_total_cents: number | null;
    is_removed?: boolean | null;
  }>;
  payments: PaymentInfo[];
  discountCents: number;
  taxCents: number;
}

export default function PaymentProgressBar({
  garmentServices,
  payments,
  discountCents,
  taxCents,
}: PaymentProgressBarProps) {
  // Calculate active total from garment services (excluding soft-deleted)
  const activeServicesSubtotal = garmentServices
    .filter((service) => !service.is_removed)
    .reduce((sum, service) => {
      const lineTotal =
        service.line_total_cents || service.quantity * service.unit_price_cents;
      return sum + lineTotal;
    }, 0);

  // Apply discount and tax to get active total
  const activeTotal = activeServicesSubtotal - discountCents + taxCents;

  // Calculate payment status using the active total
  const paymentCalc = calculatePaymentStatus(activeTotal, payments);
  const { percentage, paymentStatus: calcPaymentStatus } = paymentCalc;

  const isRefundRequired = calcPaymentStatus === 'overpaid';

  // Don't show progress bar if no charges or overpaid
  if (activeTotal === 0 || isRefundRequired) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          width: '100%',
          maxWidth: 420,
          mx: 'auto',
        }}
      >
        <LinearProgress
          variant="determinate"
          value={Math.min(percentage || 0, 100)}
          sx={{
            flex: 1,
            height: 8,
            borderRadius: 4,
            bgcolor: 'grey.200',
            '& .MuiLinearProgress-bar': {
              bgcolor:
                percentage >= 100
                  ? 'success.main'
                  : percentage >= 50
                    ? 'info.main'
                    : 'error.main',
              borderRadius: 4,
            },
          }}
        />
        <Typography
          variant="body2"
          sx={{
            minWidth: 40,
            fontWeight: 500,
            textAlign: 'right',
          }}
        >
          {Math.round(percentage || 0)}%
        </Typography>
      </Box>
    </Box>
  );
}
