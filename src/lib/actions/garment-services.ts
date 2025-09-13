'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ensureUserAndShop } from '@/lib/auth/user-shop';
import { recalculateAndUpdateGarmentStage } from './garment-stage-helpers';
import { canModifyGarmentServices } from './orders-cancellation';

interface ToggleServiceCompletionInput {
  garmentServiceId: string;
  isDone: boolean;
}

interface ToggleServiceCompletionResult {
  success: boolean;
  error?: string;
  updatedStage?: string | undefined;
}

export async function toggleServiceCompletion(
  input: ToggleServiceCompletionInput
): Promise<ToggleServiceCompletionResult> {
  try {
    const { user } = await ensureUserAndShop();
    const supabase = await createClient();

    // Get the service details including name for history tracking
    const { data: service, error: serviceError } = await supabase
      .from('garment_services')
      .select('id, garment_id, name, is_done')
      .eq('id', input.garmentServiceId)
      .single();

    if (serviceError || !service) {
      console.error('Error fetching service:', serviceError);
      return { success: false, error: 'Failed to fetch service details' };
    }

    // Check if services can be modified (not cancelled order)
    const canModify = await canModifyGarmentServices(service.garment_id);
    if (!canModify) {
      return {
        success: false,
        error: 'Cannot modify services for cancelled orders',
      };
    }

    // Update the service completion status
    const { error: updateError } = await supabase
      .from('garment_services')
      .update({ is_done: input.isDone })
      .eq('id', input.garmentServiceId);

    if (updateError) {
      console.error('Error updating service:', updateError);
      return { success: false, error: 'Failed to update service' };
    }

    // Log the completion status change to history
    await supabase.from('garment_history').insert({
      garment_id: service.garment_id,
      changed_by: user.id,
      field_name: 'services',
      old_value: {
        service_name: service.name,
        completion_status: service.is_done ? 'completed' : 'incomplete',
      },
      new_value: {
        service_name: service.name,
        completion_status: input.isDone ? 'completed' : 'incomplete',
      },
      change_type: 'service_updated',
      related_service_id: input.garmentServiceId,
    });

    // Recalculate and update garment stage
    const stageResult = await recalculateAndUpdateGarmentStage(
      service.garment_id
    );

    if (!stageResult.success) {
      console.error('Error updating garment stage');
      return { success: false, error: 'Failed to update garment stage' };
    }

    // Revalidate the garment detail page
    revalidatePath(`/garments/${service.garment_id}`);

    return { success: true, updatedStage: stageResult.stage };
  } catch (error) {
    console.error('Error in toggleServiceCompletion:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}
