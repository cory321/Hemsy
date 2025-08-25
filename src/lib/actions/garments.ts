'use server';

import { createClient } from '@/lib/supabase/server';
import { ensureUserAndShop } from '@/lib/auth/user-shop';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { recalculateAndUpdateGarmentStage } from './garment-stage-helpers';
import { syncInvoiceWithGarmentServices } from './invoice-sync';

// Schema for updating garment
const UpdateGarmentSchema = z.object({
  garmentId: z.string().uuid(),
  updates: z.object({
    name: z.string().min(1).optional(),
    dueDate: z.string().nullable().optional(),
    eventDate: z.string().nullable().optional(),
    presetIconKey: z.string().nullable().optional(),
    presetFillColor: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    photoUrl: z.string().nullable().optional(),
    imageCloudId: z.string().nullable().optional(),
  }),
});

export async function updateGarment(
  input: z.infer<typeof UpdateGarmentSchema>
) {
  try {
    const validatedInput = UpdateGarmentSchema.parse(input);

    // Validate garmentId is not empty
    if (!validatedInput.garmentId || validatedInput.garmentId.trim() === '') {
      throw new Error('Garment ID is required and cannot be empty');
    }

    const { shop, user } = await ensureUserAndShop();

    if (!user?.id || user.id.trim() === '') {
      throw new Error('User not authenticated or invalid user ID');
    }

    const supabase = await createClient();

    // Verify garment belongs to shop
    const { data: garment, error: fetchError } = await supabase
      .from('garments')
      .select('*, orders!inner(shop_id)')
      .eq('id', validatedInput.garmentId)
      .single();

    if (fetchError || !garment || garment.orders.shop_id !== shop.id) {
      throw new Error('Garment not found');
    }

    // Set user context for trigger (required for history tracking)
    const { error: rpcError } = await supabase.rpc('set_current_user_id', {
      user_id: user.id,
    });

    if (rpcError) {
      throw new Error(`Failed to set user context: ${rpcError.message}`);
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Only include fields that are being updated (history tracking is handled by database trigger)
    if (
      validatedInput.updates.name !== undefined &&
      validatedInput.updates.name !== garment.name
    ) {
      updateData.name = validatedInput.updates.name;
    }
    if (validatedInput.updates.dueDate !== undefined) {
      // Keep dates as YYYY-MM-DD strings to avoid timezone issues
      const oldDueDate = garment.due_date || null;
      const newDueDate = validatedInput.updates.dueDate || null;
      if (oldDueDate !== newDueDate) {
        updateData.due_date = newDueDate;
      }
    }
    if (validatedInput.updates.eventDate !== undefined) {
      // Keep dates as YYYY-MM-DD strings to avoid timezone issues
      const oldEventDate = garment.event_date || null;
      const newEventDate = validatedInput.updates.eventDate || null;
      if (oldEventDate !== newEventDate) {
        updateData.event_date = newEventDate;
      }
    }
    if (
      validatedInput.updates.presetIconKey !== undefined &&
      validatedInput.updates.presetIconKey !== garment.preset_icon_key
    ) {
      updateData.preset_icon_key = validatedInput.updates.presetIconKey;
    }
    if (
      validatedInput.updates.presetFillColor !== undefined &&
      validatedInput.updates.presetFillColor !== garment.preset_fill_color
    ) {
      updateData.preset_fill_color = validatedInput.updates.presetFillColor;
    }
    if (
      validatedInput.updates.notes !== undefined &&
      validatedInput.updates.notes !== garment.notes
    ) {
      updateData.notes = validatedInput.updates.notes;
    }
    if (
      validatedInput.updates.photoUrl !== undefined &&
      validatedInput.updates.photoUrl !== garment.photo_url
    ) {
      updateData.photo_url = validatedInput.updates.photoUrl;
    }
    if (
      validatedInput.updates.imageCloudId !== undefined &&
      validatedInput.updates.imageCloudId !== garment.image_cloud_id
    ) {
      updateData.image_cloud_id = validatedInput.updates.imageCloudId;
    }

    // Update garment (history tracking is handled by database trigger)
    const { error } = await supabase
      .from('garments')
      .update(updateData)
      .eq('id', validatedInput.garmentId);

    if (error) throw error;

    revalidatePath(`/garments/${validatedInput.garmentId}`);
    return { success: true };
  } catch (error) {
    console.error('Error updating garment:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to update garment',
    };
  }
}

// Schema for adding service to garment
const AddServiceToGarmentSchema = z.object({
  garmentId: z.string().uuid(),
  serviceId: z.string().uuid().optional(),
  customService: z
    .object({
      name: z.string().min(1),
      description: z.string().optional(),
      unit: z.string(),
      unitPriceCents: z.number().int().min(0),
      quantity: z.number().int().min(1),
    })
    .optional(),
});

export async function addServiceToGarment(
  input: z.infer<typeof AddServiceToGarmentSchema>
) {
  try {
    const { shop, user } = await ensureUserAndShop();
    const supabase = await createClient();

    // Verify garment belongs to shop
    const { data: garment, error: fetchError } = await supabase
      .from('garments')
      .select('*, orders!inner(id, shop_id)')
      .eq('id', input.garmentId)
      .single();

    if (fetchError || !garment || garment.orders.shop_id !== shop.id) {
      throw new Error('Garment not found');
    }

    let serviceData: any;

    if (input.serviceId) {
      // Copy from catalog service
      const { data: catalogService, error: serviceError } = await supabase
        .from('services')
        .select('*')
        .eq('id', input.serviceId)
        .eq('shop_id', shop.id)
        .single();

      if (serviceError || !catalogService) throw new Error('Service not found');

      // Map catalog service units to garment service units
      let unit = catalogService.default_unit;
      if (unit === 'item') {
        unit = 'flat_rate'; // Map 'item' to 'flat_rate' for garment services
      }

      serviceData = {
        garment_id: input.garmentId,
        service_id: input.serviceId,
        name: catalogService.name,
        description: catalogService.description,
        unit: unit,
        unit_price_cents: catalogService.default_unit_price_cents || 0,
        quantity: catalogService.default_qty || 1,
        is_done: false,
      };
    } else if (input.customService) {
      // Create inline service
      serviceData = {
        garment_id: input.garmentId,
        service_id: null, // No catalog reference
        name: input.customService.name,
        description: input.customService.description,
        unit: input.customService.unit || 'flat_rate',
        unit_price_cents: input.customService.unitPriceCents || 0,
        quantity: input.customService.quantity || 1,
        is_done: false,
      };
    } else {
      throw new Error('Either serviceId or customService must be provided');
    }

    // Insert service
    const { data: newService, error } = await supabase
      .from('garment_services')
      .insert(serviceData)
      .select()
      .single();

    if (error) throw error;

    // Log to history
    await supabase.from('garment_history').insert({
      garment_id: input.garmentId,
      changed_by: user.id,
      field_name: 'services',
      new_value: {
        name: serviceData.name,
        quantity: serviceData.quantity,
        unit_price_cents: serviceData.unit_price_cents,
      },
      change_type: 'service_added',
      related_service_id: newService.id,
    });

    // Recalculate and update garment stage after adding service
    await recalculateAndUpdateGarmentStage(input.garmentId);

    // Sync invoice with updated services
    const orderId = garment.orders.id;
    await syncInvoiceWithGarmentServices(orderId);

    revalidatePath(`/garments/${input.garmentId}`);
    revalidatePath(`/orders/${orderId}`);
    return { success: true, serviceId: newService.id };
  } catch (error) {
    console.error('Error adding service to garment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add service',
    };
  }
}

// Remove service from garment (soft delete)
export async function removeServiceFromGarment(input: {
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
      .select('*, garments!inner(orders!inner(id, shop_id))')
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

    // Check if service is completed - completed services cannot be removed
    if (service.is_done) {
      throw new Error('Cannot remove a completed service');
    }

    // Log to history before soft deletion
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

    // Recalculate and update garment stage after removing service
    await recalculateAndUpdateGarmentStage(input.garmentId);

    // Sync invoice with updated services (removed services won't count toward total)
    const orderId = service.garments.orders.id;
    await syncInvoiceWithGarmentServices(orderId);

    revalidatePath(`/garments/${input.garmentId}`);
    revalidatePath(`/orders/${orderId}`);
    return { success: true };
  } catch (error) {
    console.error('Error removing service from garment:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to remove service',
    };
  }
}

// Restore a previously removed service
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
      .select('*, garments!inner(orders!inner(id, shop_id))')
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

    // Recalculate and update garment stage after restoring service
    await recalculateAndUpdateGarmentStage(input.garmentId);

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

// Update service on garment
const UpdateGarmentServiceSchema = z.object({
  garmentServiceId: z.string().uuid(),
  updates: z.object({
    quantity: z.number().int().min(1).optional(),
    unitPriceCents: z.number().int().min(0).optional(),
    description: z.string().optional(),
    unit: z.enum(['flat_rate', 'hour', 'day']).optional(),
  }),
});

export async function updateGarmentService(
  input: z.infer<typeof UpdateGarmentServiceSchema>
) {
  try {
    const { shop, user } = await ensureUserAndShop();
    const supabase = await createClient();

    // Get current service
    const { data: oldService, error: fetchError } = await supabase
      .from('garment_services')
      .select('*, garments!inner(orders!inner(id, shop_id))')
      .eq('id', input.garmentServiceId)
      .single();

    if (
      fetchError ||
      !oldService ||
      oldService.garments.orders.shop_id !== shop.id
    ) {
      throw new Error('Service not found');
    }

    // Check if service is completed - completed services cannot be edited
    if (oldService.is_done) {
      throw new Error('Cannot edit a completed service');
    }

    // Calculate new values
    const newQuantity = input.updates.quantity ?? oldService.quantity;
    const newUnitPrice =
      input.updates.unitPriceCents ?? oldService.unit_price_cents;

    // Update service (line_total_cents is auto-calculated by the database)
    const { error } = await supabase
      .from('garment_services')
      .update({
        quantity: newQuantity,
        unit_price_cents: newUnitPrice,
        description: input.updates.description ?? oldService.description,
        unit: input.updates.unit ?? oldService.unit,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.garmentServiceId);

    if (error) throw error;

    // Log changes to history
    const changes = [];
    if (
      input.updates.quantity &&
      input.updates.quantity !== oldService.quantity
    ) {
      changes.push({
        field: 'quantity',
        old: oldService.quantity,
        new: input.updates.quantity,
      });
    }
    if (
      input.updates.unitPriceCents &&
      input.updates.unitPriceCents !== oldService.unit_price_cents
    ) {
      changes.push({
        field: 'unit_price',
        old: oldService.unit_price_cents,
        new: input.updates.unitPriceCents,
      });
    }
    if (input.updates.unit && input.updates.unit !== oldService.unit) {
      changes.push({
        field: 'unit',
        old: oldService.unit,
        new: input.updates.unit,
      });
    }

    if (changes.length > 0) {
      await supabase.from('garment_history').insert({
        garment_id: oldService.garment_id,
        changed_by: user.id,
        field_name: 'services',
        old_value: {
          service_name: oldService.name,
          changes: changes.map((c) => ({ field: c.field, old: c.old })),
        },
        new_value: {
          service_name: oldService.name,
          changes: changes.map((c) => ({ field: c.field, new: c.new })),
        },
        change_type: 'service_updated',
        related_service_id: input.garmentServiceId,
      });
    }

    // Sync invoice with updated services (if price/quantity changed)
    if (
      changes.some((c) => c.field === 'quantity' || c.field === 'unit_price')
    ) {
      const orderId = oldService.garments.orders.id;
      await syncInvoiceWithGarmentServices(orderId);
      revalidatePath(`/orders/${orderId}`);
    }

    revalidatePath(`/garments/${oldService.garment_id}`);
    return { success: true };
  } catch (error) {
    console.error('Error updating garment service:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to update service',
    };
  }
}

// Get garment history
export async function getGarmentHistory(garmentId: string) {
  try {
    const { shop } = await ensureUserAndShop();
    const supabase = await createClient();

    // Verify garment belongs to shop
    const { data: garment, error: garmentError } = await supabase
      .from('garments')
      .select('orders!inner(shop_id)')
      .eq('id', garmentId)
      .single();

    if (garmentError || !garment || garment.orders.shop_id !== shop.id) {
      throw new Error('Garment not found');
    }

    // Fetch garment history with user information
    const { data, error } = await supabase
      .from('garment_history')
      .select(
        `
				*,
				changed_by_user:users(first_name, last_name, email)
			`
      )
      .eq('garment_id', garmentId)
      .order('changed_at', { ascending: false });

    if (error) throw error;

    return { success: true, history: data || [] };
  } catch (error) {
    console.error('Error fetching garment history:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch history',
    };
  }
}
