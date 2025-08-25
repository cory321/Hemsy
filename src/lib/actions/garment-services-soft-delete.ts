import { createClient } from '@/lib/supabase/server';
import { ensureUserAndShop } from '@/lib/auth/user-shop';
import { revalidatePath } from 'next/cache';
import { syncInvoiceWithGarmentServices } from './invoice-sync';

/**
 * Soft delete a service from a garment (marks as removed but keeps for invoice history)
 */
export async function softRemoveServiceFromGarment(input: {
  garmentId: string;
  garmentServiceId: string;
  removalReason?: string;
}) {
  try {
    const { shop, user } = await ensureUserAndShop();
    const supabase = await createClient();

    // Get service details before soft deletion
    const { data: service, error: fetchError } = await supabase
      .from('garment_services')
      .select(
        `
				*,
				garments!inner(
					orders!inner(id, shop_id)
				)
			`
      )
      .eq('id', input.garmentServiceId)
      .single();

    if (
      fetchError ||
      !service ||
      service.garment_id !== input.garmentId ||
      service.garments.orders.shop_id !== shop.id
    ) {
      throw new Error('Service not found');
    }

    // Check if already removed
    if ((service as any).is_removed) {
      throw new Error('Service is already removed');
    }

    // Soft delete: mark as removed instead of deleting
    const { error } = await supabase
      .from('garment_services')
      .update({
        is_removed: true,
        removed_at: new Date().toISOString(),
        removed_by: user.id,
        removal_reason: input.removalReason || 'Service removed by user',
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.garmentServiceId);

    if (error) throw error;

    // Log to history
    await supabase.from('garment_history').insert({
      garment_id: input.garmentId,
      changed_by: user.id,
      field_name: 'services',
      old_value: {
        name: service.name,
        quantity: service.quantity,
        unit_price_cents: service.unit_price_cents,
        line_total_cents: service.line_total_cents,
        status: 'active',
      },
      new_value: {
        name: service.name,
        quantity: service.quantity,
        unit_price_cents: service.unit_price_cents,
        line_total_cents: service.line_total_cents,
        status: 'removed',
        removal_reason: input.removalReason,
      },
      change_type: 'service_removed',
      related_service_id: input.garmentServiceId,
    });

    // Sync invoice with updated services (removed services won't count toward total)
    const orderId = service.garments.orders.id;
    await syncInvoiceWithGarmentServices(orderId);

    revalidatePath(`/garments/${input.garmentId}`);
    revalidatePath(`/orders/${orderId}`);
    return { success: true };
  } catch (error) {
    console.error('Error soft removing service from garment:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to remove service',
    };
  }
}

/**
 * Restore a previously removed service
 */
export async function restoreRemovedService(input: {
  garmentId: string;
  garmentServiceId: string;
}) {
  try {
    const { shop, user } = await ensureUserAndShop();
    const supabase = await createClient();

    // Get service details
    const { data: service, error: fetchError } = await supabase
      .from('garment_services')
      .select(
        `
				*,
				garments!inner(
					orders!inner(id, shop_id)
				)
			`
      )
      .eq('id', input.garmentServiceId)
      .single();

    if (
      fetchError ||
      !service ||
      service.garment_id !== input.garmentId ||
      service.garments.orders.shop_id !== shop.id
    ) {
      throw new Error('Service not found');
    }

    // Check if actually removed
    if (!(service as any).is_removed) {
      throw new Error('Service is not removed');
    }

    // Restore: mark as active again
    const { error } = await supabase
      .from('garment_services')
      .update({
        is_removed: false,
        removed_at: null,
        removed_by: null,
        removal_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.garmentServiceId);

    if (error) throw error;

    // Log to history
    await supabase.from('garment_history').insert({
      garment_id: input.garmentId,
      changed_by: user.id,
      field_name: 'services',
      old_value: {
        name: service.name,
        status: 'removed',
      },
      new_value: {
        name: service.name,
        status: 'active',
      },
      change_type: 'service_restored',
      related_service_id: input.garmentServiceId,
    });

    // Sync invoice with updated services
    const orderId = service.garments.orders.id;
    await syncInvoiceWithGarmentServices(orderId);

    revalidatePath(`/garments/${input.garmentId}`);
    revalidatePath(`/orders/${orderId}`);
    return { success: true };
  } catch (error) {
    console.error('Error restoring service:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to restore service',
    };
  }
}
