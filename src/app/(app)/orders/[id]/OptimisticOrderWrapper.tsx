'use client';

import { useState, useOptimistic, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import OrderServicesAndPayments from './OrderServicesAndPayments';
import {
  calculatePaymentStatus,
  type PaymentInfo,
} from '@/lib/utils/payment-calculations';

interface Payment {
  id: string;
  payment_type: string;
  payment_method: string;
  amount_cents: number;
  refunded_amount_cents?: number;
  status: string;
  created_at: string;
  stripe_payment_intent_id?: string;
  notes?: string;
}

interface OptimisticOrderWrapperProps {
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
  initialPayments: Payment[];
  orderStatus: string | null;
  paidAt: string | null;
  clientEmail?: string;
  orderId: string;
  orderTotal: number;
}

type OptimisticAction =
  | { type: 'ADD_PAYMENT'; payment: Payment }
  | { type: 'ADD_REFUND'; paymentId: string; refundAmount: number }
  | { type: 'REMOVE_PAYMENT'; paymentId: string };

function optimisticPaymentReducer(
  payments: Payment[],
  action: OptimisticAction
): Payment[] {
  switch (action.type) {
    case 'ADD_PAYMENT':
      return [...payments, action.payment];

    case 'ADD_REFUND':
      return payments.map((payment) =>
        payment.id === action.paymentId
          ? {
              ...payment,
              refunded_amount_cents:
                (payment.refunded_amount_cents || 0) + action.refundAmount,
              status:
                (payment.refunded_amount_cents || 0) + action.refundAmount >=
                payment.amount_cents
                  ? 'refunded'
                  : 'partially_refunded',
            }
          : payment
      );

    case 'REMOVE_PAYMENT':
      return payments.filter((payment) => payment.id !== action.paymentId);

    default:
      return payments;
  }
}

export default function OptimisticOrderWrapper({
  garmentServices,
  garments,
  invoice,
  initialPayments,
  orderStatus,
  paidAt,
  clientEmail,
  orderId,
  orderTotal,
}: OptimisticOrderWrapperProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [optimisticPayments, addOptimisticPayment] = useOptimistic(
    initialPayments,
    optimisticPaymentReducer
  );

  // Calculate optimistic payment status using shared utility
  const paymentStatus = calculatePaymentStatus(
    orderTotal,
    (optimisticPayments as PaymentInfo[]) || []
  );

  const handleOptimisticPayment = async (
    paymentData: Omit<Payment, 'id' | 'created_at'>,
    serverAction: () => Promise<any>
  ) => {
    // Create optimistic payment with temporary ID
    const optimisticPayment: Payment = {
      ...paymentData,
      id: `temp-${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    startTransition(async () => {
      // Add optimistic payment immediately
      addOptimisticPayment({ type: 'ADD_PAYMENT', payment: optimisticPayment });

      try {
        // Execute the server action
        const result = await serverAction();

        if (result.success) {
          // Server action succeeded, refresh to get real data
          router.refresh();
        } else {
          // Server action failed, remove optimistic payment
          addOptimisticPayment({
            type: 'REMOVE_PAYMENT',
            paymentId: optimisticPayment.id,
          });
          toast.error(result.error || 'Payment failed');
        }
      } catch (error) {
        // Server action threw an error, remove optimistic payment
        addOptimisticPayment({
          type: 'REMOVE_PAYMENT',
          paymentId: optimisticPayment.id,
        });
        toast.error('Payment failed');
      }
    });
  };

  const handleOptimisticRefund = async (
    paymentId: string,
    refundAmount: number,
    serverAction: () => Promise<any>
  ) => {
    startTransition(async () => {
      // Add optimistic refund immediately
      addOptimisticPayment({ type: 'ADD_REFUND', paymentId, refundAmount });

      try {
        // Execute the server action
        const result = await serverAction();

        if (result.success) {
          // Server action succeeded, refresh to get real data
          router.refresh();
        } else {
          // Server action failed, we need to revert - refresh to get clean state
          router.refresh();
          toast.error(result.error || 'Refund failed');
        }
      } catch (error) {
        // Server action threw an error, refresh to get clean state
        router.refresh();
        toast.error('Refund failed');
      }
    });
  };

  return (
    <OrderServicesAndPayments
      garmentServices={garmentServices}
      garments={garments}
      invoice={invoice}
      payments={optimisticPayments}
      orderStatus={orderStatus}
      paidAt={paidAt}
      clientEmail={clientEmail}
      // Pass optimistic update functions
      onOptimisticPayment={handleOptimisticPayment}
      onOptimisticRefund={handleOptimisticRefund}
      // Pass payment status for display
      optimisticPaymentStatus={paymentStatus}
      isPending={isPending}
    />
  );
}
