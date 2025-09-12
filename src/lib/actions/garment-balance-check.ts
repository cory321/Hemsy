'use server';

import { createClient } from '@/lib/supabase/server';
import { ensureUserAndShop } from '@/lib/auth/user-shop';
import { calculateOrderBalance } from '@/lib/utils/order-balance-calculations';
import { z } from 'zod';

// Schema for balance check
const BalanceCheckSchema = z.object({
  garmentId: z.string().uuid(),
});

interface BalanceCheckResult {
  success: boolean;
  error?: string;
  isLastGarment?: boolean;
  hasOutstandingBalance?: boolean;
  balanceDue?: number; // in cents
  orderTotal?: number; // in cents
  paidAmount?: number; // in cents
  orderNumber?: string;
  clientName?: string;
  invoiceId?: string;
  clientEmail?: string;
}

/**
 * Checks if a garment is the last one in an order that needs work
 * and whether there's an outstanding balance on the order
 */
export async function checkGarmentBalanceStatus(
  input: z.infer<typeof BalanceCheckSchema>
): Promise<BalanceCheckResult> {
  try {
    const validatedInput = BalanceCheckSchema.parse(input);
    const { shop } = await ensureUserAndShop();
    const supabase = await createClient();

    // Get the garment with its order info
    const { data: garment, error: garmentError } = await supabase
      .from('garments')
      .select(
        `
        id,
        stage,
        order_id,
        orders!inner(
          shop_id
        )
      `
      )
      .eq('id', validatedInput.garmentId)
      .single();

    if (garmentError || !garment) {
      console.error('Error fetching garment:', garmentError);
      return { success: false, error: 'Garment not found' };
    }

    // Verify shop ownership
    if (garment.orders.shop_id !== shop.id) {
      return { success: false, error: 'Access denied' };
    }

    // Check if garment is in "Ready For Pickup" stage
    if (garment.stage !== 'Ready For Pickup') {
      return {
        success: true,
        isLastGarment: false,
        hasOutstandingBalance: false,
      };
    }

    // Use optimized RPC function to check if last garment
    let isLastGarment: boolean;

    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      'check_garment_balance_optimized' as any,
      {
        p_garment_id: validatedInput.garmentId,
        p_order_id: garment.order_id,
      }
    );

    if (rpcError) {
      console.error('Error checking garment status:', rpcError);
      // Fallback to original logic if RPC fails
      const { data: otherGarments, error: otherGarmentsError } = await supabase
        .from('garments')
        .select('id, stage')
        .eq('order_id', garment.order_id)
        .neq('id', validatedInput.garmentId);

      if (otherGarmentsError) {
        console.error('Error fetching other garments:', otherGarmentsError);
        return { success: false, error: 'Failed to check order garments' };
      }

      const hasOtherActiveGarments = otherGarments?.some(
        (g) =>
          g.stage === 'New' ||
          g.stage === 'In Progress' ||
          g.stage === 'Ready For Pickup'
      );

      isLastGarment = !hasOtherActiveGarments;
    } else {
      // Use RPC result
      isLastGarment = (rpcResult as any)?.isLastGarment ?? false;
    }

    // If not the last garment, no need to check balance
    if (!isLastGarment) {
      return {
        success: true,
        isLastGarment: false,
        hasOutstandingBalance: false,
      };
    }

    // Use the unified order balance calculation
    const balanceResult = await calculateOrderBalance(garment.order_id);

    if (!balanceResult.success) {
      return { success: false, error: balanceResult.error || 'Unknown error' };
    }

    const hasOutstandingBalance = (balanceResult.balanceDue || 0) > 0;

    return {
      success: true,
      isLastGarment: true,
      hasOutstandingBalance,
      balanceDue: balanceResult.balanceDue || 0,
      orderTotal: balanceResult.orderTotal || 0,
      paidAmount: balanceResult.paidAmount || 0,
      orderNumber: balanceResult.orderNumber || '',
      clientName: balanceResult.clientName || '',
      ...(balanceResult.invoiceId && { invoiceId: balanceResult.invoiceId }),
      ...(balanceResult.clientEmail && {
        clientEmail: balanceResult.clientEmail,
      }),
    };
  } catch (error) {
    console.error('Error in checkGarmentBalanceStatus:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

/**
 * Server-side function to prefetch balance status for a garment
 * Used in Server Components to avoid client-side fetching
 */
export async function prefetchGarmentBalanceStatus(
  garmentId: string,
  shopId: string
): Promise<BalanceCheckResult | null> {
  try {
    // Direct call for server-side prefetching
    return await checkGarmentBalanceStatus({ garmentId });
  } catch (error) {
    console.error('Error prefetching balance status:', error);
    return null;
  }
}

// Schema for deferred payment logging
const DeferredPaymentSchema = z.object({
  garmentId: z.string().uuid(),
  orderId: z.string().uuid(),
  balanceDue: z.number(),
  reason: z.string().optional(),
});

/**
 * Logs when a garment is marked as picked up with outstanding balance
 * This helps track business metrics around deferred payments
 */
export async function logDeferredPaymentPickup(
  input: z.infer<typeof DeferredPaymentSchema>
): Promise<{ success: boolean; error?: string }> {
  try {
    const validatedInput = DeferredPaymentSchema.parse(input);
    const { user, shop } = await ensureUserAndShop();
    const supabase = await createClient();

    // Log to garment history with special note about deferred payment
    const { error: historyError } = await supabase
      .from('garment_history')
      .insert({
        garment_id: validatedInput.garmentId,
        changed_by: user.id,
        field_name: 'pickup_with_balance',
        old_value: `Balance due: $${(validatedInput.balanceDue / 100).toFixed(2)}`,
        new_value: 'Picked up without payment',
        change_type: 'special_action',
        notes: validatedInput.reason || 'Payment deferred at pickup',
      });

    if (historyError) {
      console.error('Error logging deferred payment:', historyError);
      // Don't fail the operation, just log the error
    }

    // Also update the order notes for visibility
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('notes')
      .eq('id', validatedInput.orderId)
      .single();

    const existingNotes = existingOrder?.notes || '';
    const newNote = `[${new Date().toLocaleDateString()}] Garment picked up with outstanding balance of $${(validatedInput.balanceDue / 100).toFixed(2)}. ${validatedInput.reason || 'Payment to be collected later.'}`;
    const updatedNotes = existingNotes
      ? `${existingNotes}\n\n${newNote}`
      : newNote;

    const { error: orderNoteError } = await supabase
      .from('orders')
      .update({ notes: updatedNotes })
      .eq('id', validatedInput.orderId);

    if (orderNoteError) {
      console.error('Error adding order note:', orderNoteError);
      // Don't fail the operation, just log the error
    }

    return { success: true };
  } catch (error) {
    console.error('Error in logDeferredPaymentPickup:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to log deferred payment',
    };
  }
}
