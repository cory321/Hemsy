'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { ensureUserAndShop } from './users';
import type { Tables, TablesInsert } from '@/types/supabase';
import {
  sendOrderCreatedEmail,
  sendPaymentRequestEmail,
} from './emails/invoice-emails';

// Types
export interface PaginatedInvoices {
  data: Array<
    Tables<'invoices'> & {
      client: Tables<'clients'>;
      order: Tables<'orders'>;
      payments: Tables<'payments'>[];
    }
  >;
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface InvoicesFilters {
  search?: string;
  status?: 'pending' | 'partially_paid' | 'paid' | 'cancelled' | 'refunded';
  clientId?: string;
  orderId?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'created_at' | 'invoice_number' | 'amount_cents' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface InvoiceLineItem {
  service_id?: string; // Optional for backward compatibility, required for payment allocation
  name: string;
  description?: string;
  quantity: number;
  unit_price_cents: number;
  line_total_cents: number;
}

// Validation schemas
const CreateInvoiceSchema = z.object({
  orderId: z.string().uuid(),
  depositAmountCents: z.number().int().min(0).optional(),
  description: z.string().optional(),
  dueDate: z.string().optional(),
});

const RecordPaymentSchema = z.object({
  invoiceId: z.string().uuid(),
  paymentType: z.enum(['deposit', 'remainder', 'full']),
  paymentMethod: z.enum(['stripe', 'cash', 'external_pos']),
  amountCents: z.number().int().positive(),
  externalReference: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * Get paginated invoices with filters
 */
export async function getInvoicesPaginated(
  page = 1,
  pageSize = 10,
  filters?: InvoicesFilters
): Promise<PaginatedInvoices> {
  const { shop } = await ensureUserAndShop();
  const supabase = await createSupabaseClient();

  // Build the base query
  let query = supabase
    .from('invoices')
    .select(
      `
      *,
      client:clients!inner(*),
      order:orders!inner(*),
      payments(*)
    `,
      { count: 'exact' }
    )
    .eq('shop_id', shop.id);

  // Apply filters
  if (filters?.search) {
    const searchTerm = `%${filters.search}%`;
    query = query.or(
      `invoice_number.ilike.${searchTerm},client.first_name.ilike.${searchTerm},client.last_name.ilike.${searchTerm},client.email.ilike.${searchTerm}`
    );
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.clientId) {
    query = query.eq('client_id', filters.clientId);
  }

  if (filters?.orderId) {
    query = query.eq('order_id', filters.orderId);
  }

  if (filters?.dateFrom) {
    query = query.gte('created_at', filters.dateFrom);
  }

  if (filters?.dateTo) {
    query = query.lte('created_at', filters.dateTo);
  }

  // Apply sorting
  const sortBy = filters?.sortBy || 'created_at';
  const sortOrder = filters?.sortOrder || 'desc';
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  // Apply pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    console.error('Error fetching invoices:', error);
    throw new Error('Failed to fetch invoices');
  }

  const totalPages = Math.ceil((count || 0) / pageSize);

  return {
    data: data || [],
    count: count || 0,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Get single invoice with full details
 */
export async function getInvoiceById(invoiceId: string) {
  const { shop } = await ensureUserAndShop();
  const supabase = await createSupabaseClient();

  const { data, error } = await supabase
    .from('invoices')
    .select(
      `
      *,
      client:clients(*),
      order:orders(*),
      shop:shops(*),
      payments(*),
      invoice_status_history(*)
    `
    )
    .eq('id', invoiceId)
    .eq('shop_id', shop.id)
    .single();

  if (error) {
    console.error('Error fetching invoice:', error);
    throw new Error('Failed to fetch invoice');
  }

  // Fetch garment services for this invoice's order
  const { data: garmentServices, error: servicesError } = await supabase
    .from('garment_services')
    .select(
      `
      id,
      garment_id,
      name,
      description,
      quantity,
      unit_price_cents,
      line_total_cents,
      is_removed,
      removed_at,
      removed_by,
      removal_reason,
      garments!inner(
        id,
        name,
        order_id
      )
    `
    )
    .eq('garments.order_id', data.order_id)
    .order('created_at', { ascending: true });

  if (servicesError) {
    console.error('Error fetching garment services:', servicesError);
    // Don't throw error, just log it and continue without services
  }

  // Transform garment services into invoice line items format
  const lineItems =
    garmentServices?.map((service) => ({
      id: (service as any).id,
      garment_id: (service as any).garment_id,
      name: (service as any).name,
      description: (service as any).description,
      quantity: (service as any).quantity,
      unit_price_cents: (service as any).unit_price_cents,
      line_total_cents: (service as any).line_total_cents,
      is_removed: (service as any).is_removed,
      removed_at: (service as any).removed_at,
      removed_by: (service as any).removed_by,
      removal_reason: (service as any).removal_reason,
      garment_name: (service as any).garments.name,
    })) || [];

  return {
    ...data,
    garment_services: lineItems,
  };
}

/**
 * Create invoice for an order
 */
export async function createInvoice(
  params: z.infer<typeof CreateInvoiceSchema>
) {
  try {
    const { shop, user } = await ensureUserAndShop();
    const validated = CreateInvoiceSchema.parse(params);
    const supabase = await createSupabaseClient();

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, client:clients(*), garments(*, garment_services(*))')
      .eq('id', validated.orderId)
      .eq('shop_id', shop.id)
      .single();

    if (orderError || !order) {
      throw new Error('Order not found');
    }

    if (!order.client) {
      throw new Error('Order has no client');
    }

    // Build line items from garments and services (exclude soft-deleted services)
    const lineItems: InvoiceLineItem[] = [];
    for (const garment of order.garments) {
      for (const service of garment.garment_services) {
        // For now, include all services (removal logic will be added later)
        // if (service.is_removed) {
        //   continue;
        // }

        lineItems.push({
          service_id: service.id, // Include service_id for payment allocation
          name: `${garment.name} - ${service.name}`,
          ...(service.description && { description: service.description }),
          quantity: service.quantity,
          unit_price_cents: service.unit_price_cents,
          line_total_cents:
            service.line_total_cents ||
            service.quantity * service.unit_price_cents,
        });
      }
    }

    // Calculate invoice amount from line items to ensure consistency
    const calculatedTotal = lineItems.reduce(
      (sum, item) => sum + item.line_total_cents,
      0
    );

    // Use the database function to create invoice with atomic number generation
    const { data: invoice, error } = await supabase.rpc(
      'create_invoice_with_number',
      {
        p_shop_id: shop.id,
        p_order_id: validated.orderId,
        p_client_id: order.client.id,
        p_amount_cents: calculatedTotal, // Use calculated total instead of order.total_cents
        p_deposit_amount_cents: validated.depositAmountCents || 0,
        p_line_items: JSON.parse(JSON.stringify(lineItems)),
        ...(validated.description && { p_description: validated.description }),
      }
    );

    if (error) {
      console.error('Error creating invoice:', error);
      throw new Error('Failed to create invoice');
    }

    // Link services to invoice (critical for payment allocation)
    const serviceIds = lineItems
      .map((item) => item.service_id)
      .filter((id): id is string => id !== undefined);

    if (serviceIds.length > 0) {
      const { error: linkError } = await supabase
        .from('garment_services')
        .update({ invoice_id: invoice.id })
        .in('id', serviceIds);

      if (linkError) {
        console.error('Error linking services to invoice:', linkError);
        // Continue - don't fail invoice creation, but log the error
      }
    }

    // Log status history
    await supabase.from('invoice_status_history').insert({
      invoice_id: invoice.id,
      new_status: 'pending',
      changed_by: user.id,
      reason: 'Invoice created',
    });

    // Send order created email
    try {
      await sendOrderCreatedEmail(invoice.id);
    } catch (emailError) {
      console.error('Failed to send order created email:', emailError);
      // Don't fail invoice creation if email fails
    }

    revalidatePath('/invoices');
    revalidatePath(`/orders/${validated.orderId}`);

    return { success: true, data: invoice };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map((e) => e.message).join(', '),
      };
    }
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to create invoice',
    };
  }
}

/**
 * Cancel an invoice
 */
export async function cancelInvoice(invoiceId: string, reason?: string) {
  try {
    const { shop, user } = await ensureUserAndShop();
    const supabase = await createSupabaseClient();

    // Get current invoice
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('status')
      .eq('id', invoiceId)
      .eq('shop_id', shop.id)
      .single();

    if (fetchError || !invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.status === 'paid') {
      throw new Error('Cannot cancel a paid invoice');
    }

    if (invoice.status === 'cancelled') {
      throw new Error('Invoice is already cancelled');
    }

    // Update invoice status
    const { error } = await supabase
      .from('invoices')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId)
      .eq('shop_id', shop.id);

    if (error) {
      console.error('Error cancelling invoice:', error);
      throw new Error('Failed to cancel invoice');
    }

    // Log status history
    await supabase.from('invoice_status_history').insert({
      invoice_id: invoiceId,
      previous_status: invoice.status,
      new_status: 'cancelled',
      changed_by: user.id,
      reason: reason || 'Invoice cancelled by user',
    });

    revalidatePath('/invoices');
    revalidatePath(`/invoices/${invoiceId}`);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to cancel invoice',
    };
  }
}

/**
 * Record a manual payment (cash or external POS)
 */
export async function recordManualPayment(
  params: z.infer<typeof RecordPaymentSchema>
) {
  try {
    const { user } = await ensureUserAndShop();
    const validated = RecordPaymentSchema.parse(params);
    const supabase = await createSupabaseClient();

    // Use database function for atomic payment processing
    const { error } = await supabase.rpc('process_manual_payment', {
      p_invoice_id: validated.invoiceId,
      p_payment_type: validated.paymentType,
      p_payment_method: validated.paymentMethod,
      p_amount_cents: validated.amountCents,
      ...(validated.externalReference && {
        p_external_reference: validated.externalReference,
      }),
      ...(validated.notes && { p_notes: validated.notes }),
      p_user_id: user.id,
    });

    if (error) {
      console.error('Error recording payment:', error);
      throw new Error('Failed to record payment');
    }

    revalidatePath('/invoices');
    revalidatePath(`/invoices/${validated.invoiceId}`);

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map((e) => e.message).join(', '),
      };
    }
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to record payment',
    };
  }
}

/**
 * Get invoice statistics for dashboard
 */
export async function getInvoiceStats() {
  const { shop } = await ensureUserAndShop();
  const supabase = await createSupabaseClient();

  const [
    { data: pendingInvoices },
    { data: overdueInvoices },
    { data: monthlyRevenue },
  ] = await Promise.all([
    // Pending invoices count and amount
    supabase
      .from('invoices')
      .select('amount_cents')
      .eq('shop_id', shop.id)
      .in('status', ['pending', 'partially_paid']),

    // Overdue invoices
    supabase
      .from('invoices')
      .select('amount_cents')
      .eq('shop_id', shop.id)
      .in('status', ['pending', 'partially_paid'])
      .lt('due_date', new Date().toISOString()),

    // This month's paid invoices
    supabase
      .from('invoices')
      .select('amount_cents')
      .eq('shop_id', shop.id)
      .eq('status', 'paid')
      .gte(
        'updated_at',
        new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          1
        ).toISOString()
      ),
  ]);

  const pendingTotal =
    pendingInvoices?.reduce((sum, inv) => sum + inv.amount_cents, 0) || 0;
  const overdueTotal =
    overdueInvoices?.reduce((sum, inv) => sum + inv.amount_cents, 0) || 0;
  const monthlyTotal =
    monthlyRevenue?.reduce((sum, inv) => sum + inv.amount_cents, 0) || 0;

  return {
    pendingCount: pendingInvoices?.length || 0,
    pendingAmountCents: pendingTotal,
    overdueCount: overdueInvoices?.length || 0,
    overdueAmountCents: overdueTotal,
    monthlyRevenueCents: monthlyTotal,
  };
}

/**
 * Get payment link by token (public - no auth required)
 */
export async function getPaymentLinkByToken(token: string) {
  const supabase = await createSupabaseClient();

  const { data: paymentLink, error } = await supabase
    .from('payment_links')
    .select(
      `
      *,
      invoice:invoices(
        *,
        client:clients(first_name, last_name, email),
        shop:shops(name, email, phone_number, mailing_address),
        order:orders(order_number),
        payments(*)
      )
    `
    )
    .eq('token', token)
    .eq('status', 'active')
    .single();

  if (error || !paymentLink) {
    return null;
  }

  // Check if expired
  if (new Date(paymentLink.expires_at) < new Date()) {
    return null;
  }

  return paymentLink;
}

/**
 * Generate public payment link for an invoice
 */
export async function generatePaymentLink(
  invoiceId: string,
  expiresInDays = 7
) {
  try {
    const { shop } = await ensureUserAndShop();
    const supabase = await createSupabaseClient();

    // Verify invoice exists and is payable
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('status')
      .eq('id', invoiceId)
      .eq('shop_id', shop.id)
      .single();

    if (invoiceError || !invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.status === 'paid') {
      throw new Error('Invoice is already paid');
    }

    if (invoice.status === 'cancelled') {
      throw new Error('Cannot generate payment link for cancelled invoice');
    }

    // Generate unique token
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Create payment link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const url = `${baseUrl}/pay/${token}`;

    const { data: paymentLink, error } = await supabase
      .from('payment_links')
      .insert({
        invoice_id: invoiceId,
        token,
        url,
        expires_at: expiresAt.toISOString(),
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating payment link:', error);
      throw new Error('Failed to create payment link');
    }

    // Send payment request email with link
    try {
      await sendPaymentRequestEmail(invoiceId);
    } catch (emailError) {
      console.error('Failed to send payment link email:', emailError);
      // Don't fail if email sending fails
    }

    return { success: true, data: paymentLink };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to generate payment link',
    };
  }
}
