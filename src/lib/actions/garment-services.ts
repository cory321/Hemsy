'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ensureUserAndShop } from '@/lib/auth/user-shop';
import { recalculateAndUpdateGarmentStage } from './garment-stage-helpers';

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
    await ensureUserAndShop();
    const supabase = await createClient();

    // Update the service completion status
    const { error: updateError } = await supabase
      .from('garment_services')
      .update({ is_done: input.isDone })
      .eq('id', input.garmentServiceId);

    if (updateError) {
      console.error('Error updating service:', updateError);
      return { success: false, error: 'Failed to update service' };
    }

    // Get the garment ID from the service
    const { data: service, error: serviceError } = await supabase
      .from('garment_services')
      .select('garment_id')
      .eq('id', input.garmentServiceId)
      .single();

    if (serviceError || !service) {
      console.error('Error fetching service:', serviceError);
      return { success: false, error: 'Failed to fetch service details' };
    }

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
