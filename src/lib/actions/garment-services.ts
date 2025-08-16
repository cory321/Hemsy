'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ensureUserAndShop } from '@/lib/auth/user-shop';

interface ToggleServiceCompletionInput {
  garmentServiceId: string;
  isDone: boolean;
}

interface ToggleServiceCompletionResult {
  success: boolean;
  error?: string;
  updatedStage?: string;
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

    // Get all services for this garment to determine the stage
    const { data: allServices, error: servicesError } = await supabase
      .from('garment_services')
      .select('id, is_done')
      .eq('garment_id', service.garment_id);

    if (servicesError) {
      console.error('Error fetching garment services:', servicesError);
      return { success: false, error: 'Failed to fetch garment services' };
    }

    // Calculate the new stage based on service completion
    let newStage: 'New' | 'In Progress' | 'Ready For Pickup';
    const completedCount = allServices?.filter((s) => s.is_done).length || 0;
    const totalCount = allServices?.length || 0;

    if (completedCount === 0) {
      newStage = 'New';
    } else if (completedCount === totalCount && totalCount > 0) {
      newStage = 'Ready For Pickup';
    } else {
      newStage = 'In Progress';
    }

    // Update the garment stage
    const { error: garmentUpdateError } = await supabase
      .from('garments')
      .update({ stage: newStage })
      .eq('id', service.garment_id);

    if (garmentUpdateError) {
      console.error('Error updating garment stage:', garmentUpdateError);
      return { success: false, error: 'Failed to update garment stage' };
    }

    // Revalidate the garment detail page
    revalidatePath(`/garments/${service.garment_id}`);

    return { success: true, updatedStage: newStage };
  } catch (error) {
    console.error('Error in toggleServiceCompletion:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}
