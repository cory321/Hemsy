'use client';

import { Box, Card, CardContent, Typography, Alert } from '@mui/material';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import EnhancedInvoiceLineItems from '@/components/invoices/EnhancedInvoiceLineItems';
import PaymentManagement from '@/components/invoices/PaymentManagement';
import RecordPaymentDialog from '@/components/orders/RecordPaymentDialog';
import {
  calculatePaymentStatus,
  type PaymentInfo,
} from '@/lib/utils/payment-calculations';
import type { Database } from '@/types/supabase';

interface OrderServicesAndPaymentsProps {
  garmentServices: Array<{
    id: string;
    garment_id: string;
    name: string;
    description?: string | null;
    quantity: number;
    unit?: string;
    unit_price_cents: number;
    line_total_cents: number | null;
    is_done?: boolean;
    is_removed?: boolean | null;
    removed_at?: string | null;
    removed_by?: string | null;
    removal_reason?: string | null;
    garments: {
      id: string;
      name: string;
      order_id: string;
    };
  }>;
  garments: Array<{
    id: string;
    name: string;
    stage?: string | null;
    due_date?: string | null;
    image_cloud_id?: string | null;
    photo_url?: string | null;
    preset_icon_key?: string | null;
    preset_fill_color?: string | null;
  }>;
  invoice?: any;
  payments: Array<{
    id: string;
    payment_type: string;
    payment_method: string;
    amount_cents: number;
    refunded_amount_cents?: number;
    status: string;
    stripe_payment_intent_id?: string | null;
    created_at: string | null;
    processed_at?: string | null;
    notes?: string | null;
  }>;
  orderStatus?: string | null | undefined;
  paidAt?: string | null | undefined;
  clientEmail?: string | undefined; // Add client email for Stripe payments
  // Optimistic update functions
  onOptimisticPayment?: (
    paymentData: Omit<
      {
        id: string;
        payment_type: string;
        payment_method: string;
        amount_cents: number;
        refunded_amount_cents?: number;
        status: string;
        created_at: string;
        stripe_payment_intent_id?: string;
        notes?: string;
      },
      'id' | 'created_at'
    >,
    serverAction: () => Promise<any>
  ) => void;
  onOptimisticRefund?: (
    paymentId: string,
    refundAmount: number,
    serverAction: () => Promise<any>
  ) => void;
  optimisticPaymentStatus?: {
    totalPaid: number;
    totalRefunded: number;
    netPaid: number;
    amountDue: number;
    percentage: number;
  };
  isPending?: boolean;
  orderSubtotal?: number;
  discountCents?: number;
  taxCents?: number;
}

export default function OrderServicesAndPayments({
  garmentServices,
  garments,
  invoice,
  payments,
  orderStatus,
  paidAt,
  clientEmail,
  onOptimisticPayment,
  onOptimisticRefund,
  optimisticPaymentStatus,
  isPending,
  orderSubtotal,
  discountCents,
  taxCents,
}: OrderServicesAndPaymentsProps) {
  const router = useRouter();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  // Restoring services is disabled on the orders page; use the garment page instead.

  const handlePaymentUpdate = () => {
    // Refresh the page to show updated payment information
    router.refresh();
  };

  const handleRecordPayment = () => {
    // This should never be called if no invoice, but add safety check
    if (!invoice) {
      toast.error('Please create an invoice first to record payment');
      return;
    }
    setPaymentDialogOpen(true);
  };

  const handlePaymentSuccess = () => {
    setPaymentDialogOpen(false);
    router.refresh();
  };

  // Transform garment services to match EnhancedInvoiceLineItems format
  const lineItems = garmentServices.map((service) => ({
    id: service.id,
    garment_id: service.garment_id,
    name: service.name,
    quantity: service.quantity || 1,
    unit_price_cents: service.unit_price_cents || 0,
    line_total_cents: service.line_total_cents || service.unit_price_cents || 0,
    is_removed: service.is_removed || false,
    ...(service.removed_at && { removed_at: service.removed_at }),
    ...(service.removal_reason && { removal_reason: service.removal_reason }),
  }));

  // Calculate total amount due (including discount and tax)
  const subtotal = lineItems
    .filter((item) => !item.is_removed)
    .reduce((sum, item) => sum + (item.line_total_cents || 0), 0);

  // Apply discount and tax to get the actual total amount due
  const totalAmount = subtotal - (discountCents || 0) + (taxCents || 0);

  // Use optimistic payment status if available, otherwise calculate from payments
  const paymentCalculation =
    optimisticPaymentStatus ||
    calculatePaymentStatus(totalAmount, (payments as PaymentInfo[]) || []);

  const { totalPaid, totalRefunded, netPaid, amountDue } = paymentCalculation;

  return (
    <Box sx={{ mt: 4 }}>
      {/* Services Section */}
      {lineItems.length > 0 && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              All Services for this Order
            </Typography>
            {!invoice && amountDue > 0 && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  An invoice must be created before payments can be recorded.
                  Use the &ldquo;Create Invoice&rdquo; button above to generate
                  an invoice for this order.
                </Typography>
              </Alert>
            )}
            <EnhancedInvoiceLineItems
              items={lineItems}
              garments={garments}
              showRemoved={true}
              showRemovedIndicators={false}
              readonly={true}
              payments={payments}
              orderStatus={orderStatus}
              paidAt={paidAt}
              // Only allow recording payment if invoice exists
              onRecordPayment={invoice ? handleRecordPayment : undefined}
              {...(garmentServices[0]?.garments?.order_id && {
                orderId: garmentServices[0].garments.order_id,
              })}
              orderSubtotal={orderSubtotal}
              discountCents={discountCents}
              taxCents={taxCents}
            />
          </CardContent>
        </Card>
      )}

      {/* Payment History Section */}
      {payments.length > 0 && (
        <PaymentManagement
          payments={payments.map((payment) => ({
            id: payment.id,
            payment_type: payment.payment_type,
            payment_method: payment.payment_method,
            amount_cents: payment.amount_cents,
            ...(payment.refunded_amount_cents !== null &&
              payment.refunded_amount_cents !== undefined && {
                refunded_amount_cents: payment.refunded_amount_cents,
              }),
            status: payment.status,
            ...(payment.stripe_payment_intent_id && {
              stripe_payment_intent_id: payment.stripe_payment_intent_id,
            }),
            created_at: payment.created_at || '',
            ...(payment.processed_at && { processed_at: payment.processed_at }),
            ...(payment.notes && { notes: payment.notes }),
          }))}
          onPaymentUpdate={handlePaymentUpdate}
          {...(onOptimisticRefund && { onOptimisticRefund })}
        />
      )}

      {/* Record Payment Dialog */}
      {invoice && (
        <RecordPaymentDialog
          open={paymentDialogOpen}
          onClose={() => setPaymentDialogOpen(false)}
          orderId={garmentServices[0]?.garments?.order_id || ''}
          invoiceId={invoice.id}
          amountDue={amountDue}
          onPaymentSuccess={handlePaymentSuccess}
          clientEmail={clientEmail}
          {...(onOptimisticPayment && { onOptimisticPayment })}
        />
      )}
    </Box>
  );
}
