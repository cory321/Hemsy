import CreditBalanceBanner from './CreditBalanceBanner';
import {
  calculatePaymentStatus,
  type PaymentInfo,
} from '@/lib/utils/payment-calculations';

interface CreditBalanceCheckProps {
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

function formatUSD(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export default function CreditBalanceCheck({
  garmentServices,
  payments,
  discountCents,
  taxCents,
}: CreditBalanceCheckProps) {
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

  // Only show banner if actually overpaid based on active total
  if (calcPaymentStatus === 'overpaid') {
    const creditAmount = -amountDue; // amountDue is negative when overpaid
    return (
      <CreditBalanceBanner creditAmountFormatted={formatUSD(creditAmount)} />
    );
  }

  return null;
}
