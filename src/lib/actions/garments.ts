'use server';

import { createClient } from '@/lib/supabase/server';
import { ensureUserAndShop } from '@/lib/auth/user-shop';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { recalculateAndUpdateGarmentStage } from './garment-stage-helpers';

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
  }),
});

export async function updateGarment(
  input: z.infer<typeof UpdateGarmentSchema>
) {
  try {
    const validatedInput = UpdateGarmentSchema.parse(input);

    // Validate garmentId is not empty
    if (!validatedInput.garmentId) {
      throw new Error('Garment ID is required');
    }

    const { shop, user } = await ensureUserAndShop();

    if (!user?.id) {
      throw new Error('User not authenticated');
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

    // Set user context for trigger (skip if user.id is missing)
    if (user.id) {
      const { error: rpcError } = await supabase.rpc('set_current_user_id', {
        user_id: user.id,
      });

      if (rpcError) {
        console.error('Error setting user context:', rpcError);
        // Don't fail the update if context setting fails
      }
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Track changes for history
    const historyEntries = [];

    // Only include fields that are being updated and track changes
    if (
      validatedInput.updates.name !== undefined &&
      validatedInput.updates.name !== garment.name
    ) {
      updateData.name = validatedInput.updates.name;
      historyEntries.push({
        garment_id: validatedInput.garmentId,
        changed_by: user.id,
        field_name: 'name',
        old_value: garment.name,
        new_value: validatedInput.updates.name,
        change_type: 'field_update',
      });
    }
    if (validatedInput.updates.dueDate !== undefined) {
      // Keep dates as YYYY-MM-DD strings to avoid timezone issues
      const oldDueDate = garment.due_date || null;
      const newDueDate = validatedInput.updates.dueDate || null;
      if (oldDueDate !== newDueDate) {
        updateData.due_date = newDueDate;
        historyEntries.push({
          garment_id: validatedInput.garmentId,
          changed_by: user.id,
          field_name: 'due_date',
          old_value: oldDueDate,
          new_value: newDueDate,
          change_type: 'field_update',
        });
      }
    }
    if (validatedInput.updates.eventDate !== undefined) {
      // Keep dates as YYYY-MM-DD strings to avoid timezone issues
      const oldEventDate = garment.event_date || null;
      const newEventDate = validatedInput.updates.eventDate || null;
      if (oldEventDate !== newEventDate) {
        updateData.event_date = newEventDate;
        historyEntries.push({
          garment_id: validatedInput.garmentId,
          changed_by: user.id,
          field_name: 'event_date',
          old_value: oldEventDate,
          new_value: newEventDate,
          change_type: 'field_update',
        });
      }
    }
    if (
      validatedInput.updates.presetIconKey !== undefined &&
      validatedInput.updates.presetIconKey !== garment.preset_icon_key
    ) {
      updateData.preset_icon_key = validatedInput.updates.presetIconKey;
      historyEntries.push({
        garment_id: validatedInput.garmentId,
        changed_by: user.id,
        field_name: 'preset_icon_key',
        old_value: garment.preset_icon_key,
        new_value: validatedInput.updates.presetIconKey,
        change_type: 'field_update',
      });
    }
    if (
      validatedInput.updates.presetFillColor !== undefined &&
      validatedInput.updates.presetFillColor !== garment.preset_fill_color
    ) {
      updateData.preset_fill_color = validatedInput.updates.presetFillColor;
      historyEntries.push({
        garment_id: validatedInput.garmentId,
        changed_by: user.id,
        field_name: 'preset_fill_color',
        old_value: garment.preset_fill_color,
        new_value: validatedInput.updates.presetFillColor,
        change_type: 'field_update',
      });
    }
    if (
      validatedInput.updates.notes !== undefined &&
      validatedInput.updates.notes !== garment.notes
    ) {
      updateData.notes = validatedInput.updates.notes;
      historyEntries.push({
        garment_id: validatedInput.garmentId,
        changed_by: user.id,
        field_name: 'notes',
        old_value: garment.notes,
        new_value: validatedInput.updates.notes,
        change_type: 'field_update',
      });
    }

    // Update garment
    const { error } = await supabase
      .from('garments')
      .update(updateData)
      .eq('id', validatedInput.garmentId);

    if (error) throw error;

    // Insert history entries if there are any changes
    if (historyEntries.length > 0) {
      const { error: historyError } = await supabase
        .from('garment_history')
        .insert(historyEntries);

      if (historyError) {
        console.error('Error inserting garment history:', historyError);
        // Don't fail the update if history insertion fails
      }
    }

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
      .select('*, orders!inner(shop_id)')
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

      serviceData = {
        garment_id: input.garmentId,
        service_id: input.serviceId,
        name: catalogService.name,
        description: catalogService.description,
        unit: catalogService.default_unit,
        unit_price_cents: catalogService.default_unit_price_cents,
        quantity: catalogService.default_qty,
        is_done: false,
      };
    } else if (input.customService) {
      // Create inline service
      serviceData = {
        garment_id: input.garmentId,
        service_id: null, // No catalog reference
        name: input.customService.name,
        description: input.customService.description,
        unit: input.customService.unit,
        unit_price_cents: input.customService.unitPriceCents,
        quantity: input.customService.quantity,
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

    revalidatePath(`/garments/${input.garmentId}`);
    return { success: true, serviceId: newService.id };
  } catch (error) {
    console.error('Error adding service to garment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add service',
    };
  }
}

// Remove service from garment
export async function removeServiceFromGarment(input: {
  garmentId: string;
  garmentServiceId: string;
}) {
  try {
    const { shop, user } = await ensureUserAndShop();
    const supabase = await createClient();

    // Get service details before deletion
    const { data: service, error: fetchError } = await supabase
      .from('garment_services')
      .select('*, garments!inner(orders!inner(shop_id))')
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

    // Log to history before deletion
    await supabase.from('garment_history').insert({
      garment_id: input.garmentId,
      changed_by: user.id,
      field_name: 'services',
      old_value: {
        name: service.name,
        quantity: service.quantity,
        unit_price_cents: service.unit_price_cents,
      },
      change_type: 'service_removed',
    });

    // Delete service
    const { error } = await supabase
      .from('garment_services')
      .delete()
      .eq('id', input.garmentServiceId);

    if (error) throw error;

    // Recalculate and update garment stage after removing service
    await recalculateAndUpdateGarmentStage(input.garmentId);

    revalidatePath(`/garments/${input.garmentId}`);
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

// Update service on garment
const UpdateGarmentServiceSchema = z.object({
  garmentServiceId: z.string().uuid(),
  updates: z.object({
    quantity: z.number().int().min(1).optional(),
    unitPriceCents: z.number().int().min(0).optional(),
    description: z.string().optional(),
    unit: z.enum(['item', 'hour', 'day']).optional(),
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
      .select('*, garments!inner(orders!inner(shop_id))')
      .eq('id', input.garmentServiceId)
      .single();

    if (
      fetchError ||
      !oldService ||
      oldService.garments.orders.shop_id !== shop.id
    ) {
      throw new Error('Service not found');
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
