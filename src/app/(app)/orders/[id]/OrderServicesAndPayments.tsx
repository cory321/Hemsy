'use client';

import { Box, Card, CardContent, Typography } from '@mui/material';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import EnhancedInvoiceLineItems from '@/components/invoices/EnhancedInvoiceLineItems';
import PaymentManagement from '@/components/invoices/PaymentManagement';
import { restoreRemovedService } from '@/lib/actions/garments';
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
    status: string;
    stripe_payment_intent_id?: string | null;
    created_at: string | null;
    processed_at?: string | null;
    notes?: string | null;
  }>;
  orderStatus?: string | null;
  paidAt?: string | null;
}

export default function OrderServicesAndPayments({
  garmentServices,
  garments,
  invoice,
  payments,
  orderStatus,
  paidAt,
}: OrderServicesAndPaymentsProps) {
  const router = useRouter();

  const handleRestoreService = async (serviceId: string, garmentId: string) => {
    try {
      const result = await restoreRemovedService({
        garmentServiceId: serviceId,
        garmentId: garmentId,
      });
      if (result.success) {
        toast.success('Service restored successfully');
        router.refresh(); // Refresh the page to show updated data
      } else {
        toast.error(result.error || 'Failed to restore service');
      }
    } catch (error) {
      toast.error('Failed to restore service');
    }
  };

  const handlePaymentUpdate = () => {
    // Refresh the page to show updated payment information
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
    ...(service.description && { description: service.description }),
    is_removed: service.is_removed || false,
    ...(service.removed_at && { removed_at: service.removed_at }),
    ...(service.removal_reason && { removal_reason: service.removal_reason }),
  }));

  return (
    <Box sx={{ mt: 4 }}>
      {/* Services Section */}
      {lineItems.length > 0 && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              All Services for this Order
            </Typography>
            <EnhancedInvoiceLineItems
              items={lineItems}
              garments={garments}
              showRemoved={true}
              onRestoreItem={handleRestoreService}
              readonly={false}
              payments={payments}
              orderStatus={orderStatus}
              paidAt={paidAt}
              {...(garmentServices[0]?.garments?.order_id && {
                orderId: garmentServices[0].garments.order_id,
              })}
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
            status: payment.status,
            ...(payment.stripe_payment_intent_id && {
              stripe_payment_intent_id: payment.stripe_payment_intent_id,
            }),
            created_at: payment.created_at || '',
            ...(payment.processed_at && { processed_at: payment.processed_at }),
            ...(payment.notes && { notes: payment.notes }),
          }))}
          onPaymentUpdate={handlePaymentUpdate}
        />
      )}
    </Box>
  );
}
