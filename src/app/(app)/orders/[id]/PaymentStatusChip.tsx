import { Chip } from '@mui/material';
import { RemixIcon } from '@/components/dashboard/common';
import {
  calculatePaymentStatus,
  calculateActiveTotal,
  type PaymentInfo,
} from '@/lib/utils/payment-calculations';

interface PaymentStatusChipProps {
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

export default function PaymentStatusChip({
  garmentServices,
  payments,
  discountCents,
  taxCents,
}: PaymentStatusChipProps) {
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
  const { amountDue, paymentStatus: calcPaymentStatus } = paymentCalc;

  // Get display properties for the payment status
  const getPaymentStatus = () => {
    if (calcPaymentStatus === 'overpaid') {
      const creditAmount = -amountDue;
      return {
        label: 'Credit Balance',
        color: 'info' as const,
        isRefundRequired: true,
      };
    }

    if (activeTotal === 0 && paymentCalc.netPaid === 0) {
      return {
        label: 'No Charges',
        color: 'default' as const,
        isRefundRequired: false,
      };
    }

    if (calcPaymentStatus === 'paid') {
      return {
        label: 'Paid in Full',
        color: 'success' as const,
        isRefundRequired: false,
      };
    }

    if (calcPaymentStatus === 'partial') {
      const percentage = paymentCalc.percentage;
      return {
        label: `${Math.round(percentage)}% Paid`,
        color: 'info' as const,
        isRefundRequired: false,
      };
    }

    return {
      label: 'Unpaid',
      color: 'error' as const,
      isRefundRequired: false,
    };
  };

  const paymentStatus = getPaymentStatus();

  return (
    <Chip
      label={paymentStatus.label}
      color={paymentStatus.color}
      size="medium"
      {...(paymentStatus.isRefundRequired && {
        icon: <RemixIcon name="ri-alert-fill" size={16} color="#F3C165" />,
      })}
      sx={{
        fontWeight: 600,
        fontSize: '0.8rem',
        height: 32,
        backgroundColor:
          paymentStatus.label === 'Credit Balance'
            ? '#fff7e8'
            : /% Paid$/.test(paymentStatus.label)
              ? '#F3C165'
              : undefined,
        color:
          paymentStatus.label === 'Credit Balance' ||
          /% Paid$/.test(paymentStatus.label)
            ? 'black'
            : undefined,
        pl: 0.75,
        '& .MuiChip-icon': {
          ml: 0.25,
          mr: 0.25,
          fontSize: 16,
          lineHeight: 1,
          display: 'inline-flex',
          alignItems: 'center',
        },
        '& .MuiChip-label': {
          pl: 0.5,
          pr: 1.25,
        },
      }}
    />
  );
}
