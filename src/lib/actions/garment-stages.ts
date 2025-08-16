'use server';

import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import type { Database } from '@/types/supabase';
import type { GarmentStage } from '@/types';

export async function getGarmentsAndStages(shopId: string) {
  const supabase = await createClient();

  // Fetch garments with their associated data
  const { data: garments, error: garmentsError } = await supabase
    .from('garments')
    .select(
      `
      id,
      name,
      stage,
      garment_services (
        id,
        name,
        quantity,
        unit_price_cents,
        unit,
        is_done
      ),
      order_id,
      image_cloud_id,
      photo_url,
      preset_icon_key,
      preset_fill_color,
      notes,
      due_date,
      created_at,
      event_date,
      orders!garments_order_id_fkey (
        clients!orders_client_id_fkey (
          first_name,
          last_name
        )
      )
    `
    )
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false });

  if (garmentsError) {
    throw new Error('Failed to fetch garments: ' + garmentsError.message);
  }

  // Process garments to include stage names and services
  const processedGarments =
    garments?.map((garment) => {
      const clientName = garment.orders?.clients
        ? `${garment.orders.clients.first_name} ${garment.orders.clients.last_name}`
        : 'Unknown Client';

      return {
        ...garment,
        stage_name: garment.stage,
        services: garment.garment_services || [],
        client_name: clientName,
      };
    }) || [];

  return { garments: processedGarments };
}

export async function updateGarmentStage(
  shopId: string,
  garmentId: string,
  newStage: GarmentStage
) {
  const supabase = await createClient();

  // Get the current user ID (this function doesn't use ensureUserAndShop)
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user?.id) {
    throw new Error('User not authenticated');
  }

  // Get current stage for history tracking
  const { data: currentGarment, error: fetchError } = await supabase
    .from('garments')
    .select('stage')
    .eq('shop_id', shopId)
    .eq('id', garmentId)
    .single();

  if (fetchError || !currentGarment) {
    throw new Error(
      'Failed to fetch garment: ' + (fetchError?.message || 'Not found')
    );
  }

  // Only update if the stage is actually changing
  if (currentGarment.stage === newStage) {
    return;
  }

  const { error } = await supabase
    .from('garments')
    .update({ stage: newStage })
    .eq('shop_id', shopId)
    .eq('id', garmentId);

  if (error) {
    throw new Error('Failed to update garment stage: ' + error.message);
  }

  // Track the stage change in history
  const { error: historyError } = await supabase
    .from('garment_history')
    .insert({
      garment_id: garmentId,
      changed_by: userData.user.id,
      field_name: 'stage',
      old_value: currentGarment.stage,
      new_value: newStage,
      change_type: 'field_update',
    });

  if (historyError) {
    console.error('Error tracking stage change in history:', historyError);
    // Don't fail the update if history tracking fails
  }
}

export async function getGarmentById(
  shopId: string,
  orderId: string,
  garmentId: string
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('garments')
    .select(
      `
      id,
      name,
      stage,
      image_cloud_id,
      photo_url,
      notes,
      due_date,
      event_date,
      is_done,
      orders!garments_order_id_fkey(
        id,
        order_number,
        clients!orders_client_id_fkey(id, email, first_name, last_name, phone_number)
      ),
      garment_services(*)
    `
    )
    .eq('shop_id', shopId)
    .eq('order_id', orderId)
    .eq('id', garmentId)
    .single();

  if (error) {
    throw new Error('Failed to fetch garment: ' + error.message);
  }

  // Construct the garment object
  const garment = {
    id: data.id,
    name: data.name,
    stage: data.stage,
    stage_name: data.stage,
    image_cloud_id: data.image_cloud_id,
    photo_url: data.photo_url,
    notes: data.notes,
    due_date: data.due_date,
    event_date: data.event_date,
    is_done: data.is_done,
    client: data.orders?.clients
      ? {
          ...data.orders.clients,
          full_name: `${data.orders.clients.first_name} ${data.orders.clients.last_name}`,
        }
      : null,
    services: data.garment_services,
    user_order_number: data.orders?.order_number,
  };

  return garment;
}
