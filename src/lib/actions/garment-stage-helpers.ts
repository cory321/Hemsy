'use server';

import { createClient } from '@/lib/supabase/server';
import { ensureUserAndShop } from '@/lib/auth/user-shop';

export type GarmentStage = 'New' | 'In Progress' | 'Ready For Pickup' | 'Done';

interface CalculateStageResult {
  stage: GarmentStage;
  completedCount: number;
  totalCount: number;
}

/**
 * Calculates the garment stage based on service completion status
 */
export async function calculateGarmentStage(
  garmentId: string
): Promise<CalculateStageResult | null> {
  try {
    const supabase = await createClient();

    // Get all services for this garment to determine the stage
    const { data: allServices, error: servicesError } = await supabase
      .from('garment_services')
      .select('id, is_done')
      .eq('garment_id', garmentId);

    if (servicesError) {
      console.error('Error fetching garment services:', servicesError);
      return null;
    }

    // Calculate the new stage based on service completion
    const completedCount = allServices?.filter((s) => s.is_done).length || 0;
    const totalCount = allServices?.length || 0;

    let stage: GarmentStage;

    if (totalCount === 0) {
      // No services, keep current stage or default to 'New'
      stage = 'New';
    } else if (completedCount === 0) {
      stage = 'New';
    } else if (completedCount === totalCount) {
      stage = 'Ready For Pickup';
    } else {
      stage = 'In Progress';
    }

    return { stage, completedCount, totalCount };
  } catch (error) {
    console.error('Error calculating garment stage:', error);
    return null;
  }
}

/**
 * Updates the garment stage in the database
 */
export async function updateGarmentStage(
  garmentId: string,
  stage: GarmentStage
): Promise<boolean> {
  try {
    const { user } = await ensureUserAndShop();
    const supabase = await createClient();

    // Don't update if stage is already 'Done' - that should only be set by explicit action
    const { data: currentGarment, error: fetchError } = await supabase
      .from('garments')
      .select('stage')
      .eq('id', garmentId)
      .single();

    if (fetchError || !currentGarment) {
      console.error('Error fetching current garment:', fetchError);
      return false;
    }

    // Don't automatically change from 'Done' back to another stage
    if (currentGarment.stage === 'Done') {
      return true;
    }

    // Only update if the stage is actually changing
    if (currentGarment.stage === stage) {
      return true;
    }

    const { error: updateError } = await supabase
      .from('garments')
      .update({ stage })
      .eq('id', garmentId);

    if (updateError) {
      console.error('Error updating garment stage:', updateError);
      return false;
    }

    // Track the stage change in history
    const { error: historyError } = await supabase
      .from('garment_history')
      .insert({
        garment_id: garmentId,
        changed_by: user.id,
        field_name: 'stage',
        old_value: currentGarment.stage,
        new_value: stage,
        change_type: 'field_update',
      });

    if (historyError) {
      console.error('Error tracking stage change in history:', historyError);
      // Don't fail the update if history tracking fails
    }

    return true;
  } catch (error) {
    console.error('Error updating garment stage:', error);
    return false;
  }
}

/**
 * Recalculates and updates the garment stage based on service completion
 * This is called when services are added, removed, or toggled
 */
export async function recalculateAndUpdateGarmentStage(
  garmentId: string
): Promise<{ success: boolean; stage?: GarmentStage }> {
  const stageInfo = await calculateGarmentStage(garmentId);

  if (!stageInfo) {
    return { success: false };
  }

  const success = await updateGarmentStage(garmentId, stageInfo.stage);

  return { success, stage: stageInfo.stage };
}
