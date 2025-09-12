/**
 * Shared utility functions for calculating payment amounts consistently across the application
 * Ensures proper accounting for refunds in all payment calculations
 */

export interface PaymentInfo {
  id: string;
  amount_cents: number;
  refunded_amount_cents: number;
  status: string;
  type?: 'payment' | 'refund'; // Optional to maintain backward compatibility
}

export interface PaymentCalculationResult {
  totalPaid: number;
  totalRefunded: number;
  netPaid: number;
  amountDue: number;
  percentage: number;
  paymentStatus: 'unpaid' | 'partial' | 'paid' | 'overpaid';
}

/**
 * Calculate payment totals and amount due, properly accounting for refunds
 * This is the single source of truth for payment calculations
 */
export function calculatePaymentStatus(
  totalAmount: number,
  payments: PaymentInfo[]
): PaymentCalculationResult {
  // Filter out refund transactions to avoid double-counting
  // Refunds are already tracked in the payment's refunded_amount_cents field
  const paymentTransactions = payments.filter((p) => p.type !== 'refund');

  // Calculate total paid amount from completed and partially refunded payments
  // Note: We include partially_refunded and refunded statuses because these are still valid payments
  // The refund amount is tracked separately in the refunded_amount_cents field
  const totalPaid = paymentTransactions
    .filter(
      (p) =>
        p.status === 'completed' ||
        p.status === 'partially_refunded' ||
        p.status === 'refunded'
    )
    .reduce((sum, p) => sum + p.amount_cents, 0);

  // Calculate total refunded amount from completed and partially/fully refunded payments
  const totalRefunded = paymentTransactions
    .filter(
      (p) =>
        p.status === 'completed' ||
        p.status === 'partially_refunded' ||
        p.status === 'refunded'
    )
    .reduce((sum, p) => sum + (p.refunded_amount_cents || 0), 0);

  // Net paid amount after refunds
  const netPaid = totalPaid - totalRefunded;

  // Amount due (negative means credit/overpayment)
  const amountDue = totalAmount - netPaid;

  // Calculate percentage for progress indicators
  const percentage = totalAmount > 0 ? (netPaid / totalAmount) * 100 : 0;

  // Determine payment status
  let paymentStatus: 'unpaid' | 'partial' | 'paid' | 'overpaid';
  if (totalAmount === 0 || netPaid === 0) {
    paymentStatus = 'unpaid';
  } else if (netPaid >= totalAmount) {
    paymentStatus = netPaid > totalAmount ? 'overpaid' : 'paid';
  } else {
    paymentStatus = 'partial';
  }

  return {
    totalPaid,
    totalRefunded,
    netPaid,
    amountDue,
    percentage,
    paymentStatus,
  };
}

/**
 * Format the payment calculation result for display
 */
export function getPaymentStatusDisplay(result: PaymentCalculationResult) {
  const { paymentStatus, percentage, amountDue } = result;

  if (paymentStatus === 'overpaid') {
    return {
      label: 'Refund Required',
      color: 'warning' as const,
      message: `Customer has a credit of ${formatCentsAsCurrency(Math.abs(amountDue))}`,
    };
  }

  if (paymentStatus === 'paid') {
    return {
      label: 'Paid in Full',
      color: 'success' as const,
      message: 'Order fully paid',
    };
  }

  if (paymentStatus === 'partial') {
    return {
      label: `${Math.round(percentage)}% Paid`,
      color: percentage >= 75 ? 'info' : ('warning' as const),
      message: `${formatCentsAsCurrency(result.netPaid)} paid of total`,
    };
  }

  return {
    label: 'Unpaid',
    color: 'error' as const,
    message: 'No payments received',
  };
}

/**
 * Format cents as currency (USD)
 */
export function formatCentsAsCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format((cents || 0) / 100);
}
