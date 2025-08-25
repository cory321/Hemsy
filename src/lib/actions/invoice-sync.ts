import { createClient } from '@/lib/supabase/admin';
import { ensureUserAndShop } from '@/lib/auth/user-shop';
import { revalidatePath } from 'next/cache';

/**
 * Recalculates and updates invoice totals based on current garment services
 * This should be called whenever services are added/removed/updated on garments
 */
export async function syncInvoiceWithGarmentServices(orderId: string) {
  try {
    const { shop } = await ensureUserAndShop();
    const supabase = createClient();

    // Get the order and its invoice
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(
        `
        id,
        shop_id,
        invoices (
          id,
          status,
          amount_cents,
          deposit_amount_cents
        )
      `
      )
      .eq('id', orderId)
      .eq('shop_id', shop.id)
      .single();

    if (orderError || !order) {
      throw new Error('Order not found');
    }

    if (!order.invoices || order.invoices.length === 0) {
      // No invoice exists yet - this is fine, invoice will be created when needed
      return { success: true, message: 'No invoice to update' };
    }

    const invoice = order.invoices[0]; // Assuming one invoice per order
    if (!invoice) {
      return { success: true, message: 'No invoice to update' };
    }

    // Calculate total from all ACTIVE garment services in this order (exclude removed services)
    const { data: services, error: servicesError } = await supabase
      .from('garment_services')
      .select(
        `
        line_total_cents,
        is_removed,
        garments!inner(order_id)
      `
      )
      .eq('garments.order_id', orderId)
      .eq('is_removed', false); // Only include active services

    if (servicesError) {
      throw new Error('Failed to fetch garment services');
    }

    // Calculate new total
    const newTotalCents =
      services?.reduce((total, service) => {
        return total + ((service as any).line_total_cents || 0);
      }, 0) || 0;

    // Only update if the total has changed
    if (newTotalCents !== invoice.amount_cents) {
      // Calculate new deposit amount (50% of new total, or keep existing if higher)
      const suggestedDepositCents = Math.round(newTotalCents * 0.5);
      const newDepositCents = Math.max(
        invoice.deposit_amount_cents || 0,
        suggestedDepositCents
      );

      // Update invoice
      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          amount_cents: newTotalCents,
          deposit_amount_cents: newDepositCents,
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoice.id);

      if (updateError) {
        throw new Error('Failed to update invoice');
      }

      // Recalculate invoice status based on payments
      await recalculateInvoiceStatus(invoice.id);

      // Log the change
      await supabase.from('invoice_status_history').insert({
        invoice_id: invoice.id,
        previous_status: invoice.status,
        new_status: invoice.status, // Will be updated by recalculateInvoiceStatus
        changed_by: 'system',
        reason: `Services updated - total changed from $${(invoice.amount_cents / 100).toFixed(2)} to $${(newTotalCents / 100).toFixed(2)}`,
        metadata: {
          old_amount_cents: invoice.amount_cents,
          new_amount_cents: newTotalCents,
          old_deposit_cents: invoice.deposit_amount_cents,
          new_deposit_cents: newDepositCents,
        },
      });

      // Revalidate relevant pages
      revalidatePath(`/orders/${orderId}`);
      revalidatePath(`/invoices/${invoice.id}`);

      return {
        success: true,
        message: `Invoice updated - total changed from $${(invoice.amount_cents / 100).toFixed(2)} to $${(newTotalCents / 100).toFixed(2)}`,
        oldTotal: invoice.amount_cents,
        newTotal: newTotalCents,
      };
    }

    return { success: true, message: 'Invoice total unchanged' };
  } catch (error) {
    console.error('Error syncing invoice with garment services:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Recalculates invoice status based on current payments
 */
async function recalculateInvoiceStatus(invoiceId: string) {
  const supabase = createClient();

  // Get invoice and its payments
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select(
      `
      id,
      amount_cents,
      status,
      payments!inner(
        amount_cents,
        status
      )
    `
    )
    .eq('id', invoiceId)
    .single();

  if (invoiceError || !invoice) return;

  // Calculate total paid (only completed payments)
  const totalPaid =
    invoice.payments
      ?.filter((p) => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount_cents, 0) || 0;

  // Determine new status
  let newStatus = invoice.status;
  if (totalPaid >= invoice.amount_cents) {
    newStatus = 'paid';
  } else if (totalPaid > 0) {
    newStatus = 'partially_paid';
  } else {
    newStatus = 'pending';
  }

  // Update status if changed
  if (newStatus !== invoice.status) {
    await supabase
      .from('invoices')
      .update({ status: newStatus })
      .eq('id', invoiceId);
  }
}

/**
 * Gets the current invoice balance information for an order
 */
export async function getInvoiceBalance(orderId: string) {
  try {
    const { shop } = await ensureUserAndShop();
    const supabase = createClient();

    const { data: order, error } = await supabase
      .from('orders')
      .select(
        `
        id,
        invoices (
          id,
          amount_cents,
          deposit_amount_cents,
          status,
          payments (
            amount_cents,
            status
          )
        )
      `
      )
      .eq('id', orderId)
      .eq('shop_id', shop.id)
      .single();

    if (error || !order || !order.invoices?.[0]) {
      return { success: false, error: 'Invoice not found' };
    }

    const invoice = order.invoices[0];
    const totalPaid =
      invoice.payments
        ?.filter((p) => p.status === 'completed')
        .reduce((sum, p) => sum + p.amount_cents, 0) || 0;

    const totalRefunded =
      invoice.payments
        ?.filter((p) => p.status === 'completed')
        .reduce((sum, p) => sum + ((p as any).refunded_amount_cents || 0), 0) ||
      0;

    const netPaid = totalPaid - totalRefunded;
    const balanceDue = invoice.amount_cents - netPaid;
    const depositRequired = invoice.deposit_amount_cents || 0;
    const depositPaid = Math.min(totalPaid, depositRequired);
    const depositRemaining = Math.max(0, depositRequired - totalPaid);

    return {
      success: true,
      balance: {
        invoiceId: invoice.id,
        totalAmount: invoice.amount_cents,
        totalPaid,
        totalRefunded,
        netPaid,
        balanceDue,
        depositRequired,
        depositPaid,
        depositRemaining,
        status: invoice.status,
        canStartWork: depositPaid >= depositRequired,
        hasRefunds: totalRefunded > 0,
        hasCredit: balanceDue < 0,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
