'use server';

import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import type { Database } from '@/types/supabase';

type GarmentStage = Database['public']['Tables']['garment_stages']['Row'];
type GarmentStageInsert =
  Database['public']['Tables']['garment_stages']['Insert'];
type GarmentStageUpdate =
  Database['public']['Tables']['garment_stages']['Update'];

export async function getStages(shopId: string): Promise<GarmentStage[]> {
  const supabase = await createClient();

  const { data: stages, error } = await supabase
    .from('garment_stages')
    .select('*')
    .eq('shop_id', shopId)
    .order('position');

  if (error) {
    throw new Error('Failed to fetch stages: ' + error.message);
  }

  return stages || [];
}

export async function updateStages(
  shopId: string,
  stages: any[],
  stageToDeleteId?: string | null,
  reassignStageId?: string | null
) {
  const supabase = await createClient();

  // Validate all stage names are non-empty
  const invalidStages = stages.filter(
    (stage) => !stage.name || stage.name.trim() === ''
  );
  if (invalidStages.length > 0) {
    throw new Error('Stage names cannot be empty.');
  }

  // If a stage is to be deleted and reassigned
  if (stageToDeleteId && reassignStageId) {
    console.log(
      `Reassigning garments from stage ID ${stageToDeleteId} to stage ID ${reassignStageId}`
    );

    // Reassign garments from the stage to be deleted
    const { error: updateError } = await supabase
      .from('garments')
      .update({ stage_id: reassignStageId })
      .eq('stage_id', stageToDeleteId);

    if (updateError) {
      console.error('Reassign Error:', updateError);
      throw new Error('Failed to reassign garments: ' + updateError.message);
    }

    console.log('Garments reassigned successfully.');

    // Delete the stage after garments have been reassigned
    const { error: deleteError } = await supabase
      .from('garment_stages')
      .delete()
      .eq('id', stageToDeleteId);

    if (deleteError) {
      console.error('Delete Error:', deleteError);
      throw new Error('Failed to delete stage: ' + deleteError.message);
    }

    console.log(`Stage ID ${stageToDeleteId} deleted successfully.`);
  }

  // To avoid unique (shop_id, position) constraint collisions while reordering,
  // first shift all existing positions by a large offset. Then write final positions.
  {
    const { data: existingStagesForShift, error: fetchAllError } =
      await supabase
        .from('garment_stages')
        .select('id, position')
        .eq('shop_id', shopId);

    if (fetchAllError) {
      console.error('Fetch All Stages Error (pre-shift):', fetchAllError);
      throw new Error(
        'Failed to prepare stages for reordering: ' + fetchAllError.message
      );
    }

    for (const existing of existingStagesForShift || []) {
      const { error: shiftError } = await supabase
        .from('garment_stages')
        .update({ position: (existing.position ?? 0) + 1000 })
        .eq('id', existing.id);

      if (shiftError) {
        console.error('Shift Position Error:', shiftError);
        throw new Error(
          'Failed to shift stage positions: ' + shiftError.message
        );
      }
    }
  }

  // Update existing stages and insert new ones using final positions
  for (const stage of stages) {
    console.log('Processing stage:', stage);

    if (stage.id) {
      // Update existing stage
      const { error } = await supabase
        .from('garment_stages')
        .update({
          name: stage.name.trim(),
          position: stage.position,
          color: stage.color,
        })
        .eq('id', stage.id);

      if (error) {
        console.error('Update Error:', error);
        throw new Error('Failed to update stage: ' + error.message);
      }

      console.log(`Stage ID ${stage.id} updated successfully.`);
    } else {
      // Insert new stage
      const { data: insertData, error } = await supabase
        .from('garment_stages')
        .insert({
          shop_id: shopId,
          name: stage.name.trim(),
          position: stage.position,
          color: stage.color,
        })
        .select()
        .single();

      if (error) {
        console.error('Insert Error:', error);
        throw new Error('Failed to insert stage: ' + error.message);
      }

      if (!insertData) {
        throw new Error('InsertData is undefined after inserting a new stage.');
      }

      // Update the stage in the local array with the new ID
      stage.id = insertData.id;

      console.log(`New stage "${stage.name}" inserted successfully.`);
    }
  }

  // Fetch the updated list of stages
  const { data: updatedStages, error: fetchError } = await supabase
    .from('garment_stages')
    .select('*')
    .eq('shop_id', shopId)
    .order('position');

  if (fetchError) {
    console.error('Fetch Error:', fetchError);
    throw new Error('Failed to fetch updated stages: ' + fetchError.message);
  }

  return updatedStages;
}

export async function getGarmentsAndStages(shopId: string) {
  const supabase = await createClient();

  // Fetch garments with their associated data
  const { data: garments, error: garmentsError } = await supabase
    .from('garments')
    .select(
      `
      id,
      name,
      stage_id,
      garment_stages!garments_stage_id_fkey ( id, name, color ),
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

  // Fetch stages
  const { data: stages, error: stagesError } = await supabase
    .from('garment_stages')
    .select('*')
    .eq('shop_id', shopId)
    .order('position');

  if (stagesError) {
    throw new Error('Failed to fetch stages: ' + stagesError.message);
  }

  // Process garments to include stage names and services
  const processedGarments =
    garments?.map((garment) => {
      const clientName = garment.orders?.clients
        ? `${garment.orders.clients.first_name} ${garment.orders.clients.last_name}`
        : 'Unknown Client';

      return {
        ...garment,
        stage_name: garment.garment_stages?.name || 'Unknown',
        stage_color: garment.garment_stages?.color,
        services: garment.garment_services || [],
        client_name: clientName,
      };
    }) || [];

  return { garments: processedGarments, stages };
}

export async function updateGarmentStage(
  shopId: string,
  garmentId: string,
  newStageId: string
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('garments')
    .update({ stage_id: newStageId })
    .eq('shop_id', shopId)
    .eq('id', garmentId);

  if (error) {
    throw new Error('Failed to update garment stage: ' + error.message);
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
      stage_id,
      image_cloud_id,
      photo_url,
      notes,
      due_date,
      event_date,
      is_done,
      garment_stages!garments_stage_id_fkey(name),
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
    stage_id: data.stage_id,
    stage_name: data.garment_stages?.name,
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
