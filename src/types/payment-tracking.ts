// Payment and refund tracking types
export type OrderStatus =
  | 'new'
  | 'active'
  | 'ready'
  | 'completed'
  | 'cancelled';

export type PaymentStatus = 'unpaid' | 'partially_paid' | 'paid' | 'overpaid';

// DEPRECATED: Service-level payment status no longer used
// Payment status is now tracked at order/invoice level only

export type InvoiceType = 'initial' | 'additional' | 'deposit' | 'adjustment';

export type RefundType = 'full' | 'partial' | 'credit';

export type PaymentMethod = 'stripe' | 'cash' | 'external_pos';

// DEPRECATED: Service payment allocation no longer used
// Payments are now tracked at invoice level only
export interface ServicePaymentAllocation {
  id: string;
  payment_id: string;
  garment_service_id: string;
  invoice_id: string;
  allocated_amount_cents: number;
  payment_method: PaymentMethod;
  refunded_amount_cents: number;
  last_refunded_at?: string;
  created_at: string;
}

// DEPRECATED: Service refund history no longer used
// Refunds are now tracked at payment/invoice level only
export interface ServiceRefundHistory {
  id: string;
  garment_service_id: string;
  payment_id?: string;
  refund_amount_cents: number;
  refund_reason: string;
  refund_type: RefundType;
  stripe_refund_id?: string;
  external_reference?: string;
  created_by: string;
  created_at: string;
}

// Updated service interface without payment tracking fields
export interface ServiceWithOrderPaymentInfo {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unit_price_cents: number;
  line_total_cents: number;
  description?: string | null;
  is_done?: boolean;
  invoice_id?: string;
  // Order-level payment info
  orderPaymentStatus?: PaymentStatus;
  orderPaidAmount?: number;
  orderTotalAmount?: number;
  hasPaidInvoices?: boolean;
}

// DEPRECATED: Service payment breakdown no longer used
// Payment breakdown is now at invoice level
export interface PaymentBreakdown {
  totalPaid: number;
  totalRefunded: number;
  byMethod: Record<
    string,
    {
      paid: number;
      refunded: number;
      available: number;
    }
  >;
}

export interface OrderDraft {
  clientId?: string;
  garments: Array<{
    name: string;
    notes?: string;
    eventDate?: string;
    dueDate?: string;
    services: Array<{
      serviceId?: string;
      name: string;
      description?: string;
      quantity: number;
      unit: string;
      unitPriceCents: number;
    }>;
  }>;
  taxPercent: number;
  discountCents: number;
  paymentIntent?: {
    collectNow: boolean;
    method?: 'stripe' | 'cash' | 'external_pos';
    depositAmount?: number;
    dueDate?: Date;
    notes?: string;
    stripeDetails?: {
      paymentMethodId?: string;
    };
    externalReference?: string;
  };
}
