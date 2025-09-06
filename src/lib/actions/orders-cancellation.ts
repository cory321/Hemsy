'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { ensureUserAndShop } from './users';
import type { Database } from '@/types/supabase';

// Input schemas for validation
const CancelOrderInputSchema = z.object({
  orderId: z.string().uuid(),
  cancellationReason: z.string().optional(),
  cancelledBy: z.string().uuid().optional(), // Defaults to current user
});

const RestoreOrderInputSchema = z.object({
  orderId: z.string().uuid(),
  restoredBy: z.string().uuid().optional(), // Defaults to current user
});

// Result types
export interface CancelOrderResult {
  success: boolean;
  order?: {
    id: string;
    status: Database['public']['Enums']['order_status'];
    order_number: string;
  };
  error?: string;
}

export interface RestoreOrderResult {
  success: boolean;
  order?: {
    id: string;
    status: Database['public']['Enums']['order_status'];
    order_number: string;
  };
  calculatedStatus?: Database['public']['Enums']['order_status'];
  error?: string;
}

type FieldErrors = Record<string, string[]>;

function toFieldErrors(error: unknown): FieldErrors {
  if (error instanceof z.ZodError) {
    const out: FieldErrors = {};
    for (const issue of error.issues) {
      const path = issue.path.join('.') || 'root';
      if (!out[path]) out[path] = [];
      out[path].push(issue.message);
    }
    return out;
  }

  if (error instanceof Error) {
    return { root: [error.message] };
  }

  return { root: ['Unexpected error'] };
}

/**
 * Cancel an order - sets status to 'cancelled' and prevents further service modifications
 */
export async function cancelOrder(
  rawInput: unknown
): Promise<CancelOrderResult | { success: false; errors: FieldErrors }> {
  try {
    const input = CancelOrderInputSchema.parse(rawInput);
    const { shop, user } = await ensureUserAndShop();
    const supabase = await createSupabaseClient();

    // Verify order exists and belongs to current shop
    const { data: existingOrder, error: fetchError } = await supabase
      .from('orders')
      .select('id, status, order_number, shop_id')
      .eq('id', input.orderId)
      .single();

    if (fetchError || !existingOrder) {
      return {
        success: false,
        error: 'Order not found or access denied',
      };
    }

    if (existingOrder.shop_id !== shop.id) {
      return {
        success: false,
        error: 'Order not found or access denied',
      };
    }

    // Check if order can be cancelled
    if (existingOrder.status === 'cancelled') {
      return {
        success: false,
        error: 'This order is already cancelled',
      };
    }

    if (existingOrder.status === 'completed') {
      return {
        success: false,
        error:
          'Completed orders cannot be cancelled. Use the refund process instead.',
      };
    }

    // Update order status to cancelled
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.orderId)
      .select('id, status, order_number')
      .single();

    if (updateError || !updatedOrder) {
      throw new Error(updateError?.message || 'Failed to cancel order');
    }

    // Log cancellation details (could extend with audit table in future)
    console.log('Order cancelled:', {
      orderId: input.orderId,
      orderNumber: existingOrder.order_number,
      cancelledBy: input.cancelledBy || user.id,
      reason: input.cancellationReason,
      timestamp: new Date().toISOString(),
      previousStatus: existingOrder.status,
    });

    // Revalidate relevant paths and invalidate caches
    try {
      // Add a small delay to ensure DB changes are propagated
      await new Promise((resolve) => setTimeout(resolve, 100));

      revalidatePath('/orders');
      revalidatePath(`/orders/${input.orderId}`);
      revalidatePath('/garments', 'page');
      revalidatePath('/dashboard');
      revalidateTag('garment-stage-counts');
    } catch (revalidateError) {
      // Non-critical error, continue
      console.warn('Revalidation error:', revalidateError);
    }

    return {
      success: true,
      order: updatedOrder,
    };
  } catch (error) {
    console.error('Order cancellation error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, errors: toFieldErrors(error) };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel order',
    };
  }
}

/**
 * Restore a cancelled order - removes cancelled status and recalculates status based on garment stages
 */
export async function restoreOrder(
  rawInput: unknown
): Promise<RestoreOrderResult | { success: false; errors: FieldErrors }> {
  try {
    const input = RestoreOrderInputSchema.parse(rawInput);
    const { shop, user } = await ensureUserAndShop();
    const supabase = await createSupabaseClient();

    // Verify order exists, belongs to current shop, and is cancelled
    const { data: existingOrder, error: fetchError } = await supabase
      .from('orders')
      .select('id, status, order_number, shop_id')
      .eq('id', input.orderId)
      .single();

    if (fetchError || !existingOrder) {
      return {
        success: false,
        error: 'Order not found or access denied',
      };
    }

    if (existingOrder.shop_id !== shop.id) {
      return {
        success: false,
        error: 'Order not found or access denied',
      };
    }

    if (existingOrder.status !== 'cancelled') {
      return {
        success: false,
        error: 'Only cancelled orders can be restored',
      };
    }

    // Get garments to calculate the correct status
    const { data: garments, error: garmentsError } = await supabase
      .from('garments')
      .select('stage')
      .eq('order_id', input.orderId);

    if (garmentsError) {
      throw new Error('Failed to fetch garments for status calculation');
    }

    // Calculate the correct order status based on garment stages
    let calculatedStatus: Database['public']['Enums']['order_status'] = 'new';

    if (garments && garments.length > 0) {
      const stages = garments.map((g) => g.stage);

      // If all garments are Done, order is completed
      if (stages.every((stage) => stage === 'Done')) {
        calculatedStatus = 'completed';
      }
      // If all garments are Ready For Pickup, order is ready
      else if (
        stages.every(
          (stage) => stage === 'Ready For Pickup' || stage === 'Done'
        )
      ) {
        calculatedStatus = 'ready_for_pickup';
      }
      // If any garment is In Progress or Ready For Pickup, order is active
      else if (
        stages.some(
          (stage) => stage === 'In Progress' || stage === 'Ready For Pickup'
        )
      ) {
        calculatedStatus = 'active';
      }
      // Otherwise, order is new (all garments are New)
    }

    // Update order status to calculated status
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        status: calculatedStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.orderId)
      .select('id, status, order_number')
      .single();

    if (updateError || !updatedOrder) {
      throw new Error(updateError?.message || 'Failed to restore order');
    }

    // Log restoration details
    console.log('Order restored:', {
      orderId: input.orderId,
      orderNumber: existingOrder.order_number,
      restoredBy: input.restoredBy || user.id,
      timestamp: new Date().toISOString(),
      previousStatus: 'cancelled',
      newStatus: calculatedStatus,
    });

    // Revalidate relevant paths and invalidate caches
    try {
      // Add a small delay to ensure DB changes are propagated
      await new Promise((resolve) => setTimeout(resolve, 100));

      revalidatePath('/orders');
      revalidatePath(`/orders/${input.orderId}`);
      revalidatePath('/garments', 'page');
      revalidatePath('/dashboard');
      revalidateTag('garment-stage-counts');
    } catch (revalidateError) {
      // Non-critical error, continue
      console.warn('Revalidation error:', revalidateError);
    }

    return {
      success: true,
      order: updatedOrder,
      calculatedStatus,
    };
  } catch (error) {
    console.error('Order restoration error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, errors: toFieldErrors(error) };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to restore order',
    };
  }
}

/**
 * Check if services can be modified for a given garment
 * Returns false if the garment's order is cancelled
 */
export async function canModifyGarmentServices(
  garmentId: string
): Promise<boolean> {
  try {
    const { shop } = await ensureUserAndShop();
    const supabase = await createSupabaseClient();

    // Get the order status for this garment
    const { data: garment, error } = await supabase
      .from('garments')
      .select(
        `
        order:orders!inner(
          status,
          shop_id
        )
      `
      )
      .eq('id', garmentId)
      .single();

    if (error || !garment) {
      // If we can't find the garment, be conservative and deny modifications
      return false;
    }

    // Verify the garment belongs to the current shop
    if (garment.order.shop_id !== shop.id) {
      return false;
    }

    // Return false if order is cancelled, true otherwise
    return garment.order.status !== 'cancelled';
  } catch (error) {
    console.error(
      'Error checking garment service modification permissions:',
      error
    );
    // Be conservative and deny modifications on error
    return false;
  }
}
