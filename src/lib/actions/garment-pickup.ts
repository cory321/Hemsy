'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ensureUserAndShop } from '@/lib/auth/user-shop';
import { z } from 'zod';

// Schema for marking garment as picked up
const MarkGarmentAsPickedUpSchema = z.object({
  garmentId: z.string().uuid(),
});

interface MarkGarmentAsPickedUpResult {
  success: boolean;
  error?: string;
}

export async function markGarmentAsPickedUp(
  input: z.infer<typeof MarkGarmentAsPickedUpSchema>
): Promise<MarkGarmentAsPickedUpResult> {
  try {
    const validatedInput = MarkGarmentAsPickedUpSchema.parse(input);
    const { shop, user } = await ensureUserAndShop();
    const supabase = await createClient();

    // Get the garment and verify it belongs to the shop
    const { data: garment, error: garmentError } = await supabase
      .from('garments')
      .select('id, stage, orders!inner(shop_id)')
      .eq('id', validatedInput.garmentId)
      .single();

    if (garmentError || !garment || garment.orders.shop_id !== shop.id) {
      console.error('Error fetching garment:', garmentError);
      return { success: false, error: 'Garment not found' };
    }

    // Check if the garment is in "Ready For Pickup" stage
    if (garment.stage !== 'Ready For Pickup') {
      return {
        success: false,
        error:
          'Garment must be in "Ready For Pickup" stage to mark as picked up',
      };
    }

    // Update the garment stage to "Done"
    const { error: updateError } = await supabase
      .from('garments')
      .update({ stage: 'Done' })
      .eq('id', validatedInput.garmentId);

    if (updateError) {
      console.error('Error updating garment stage:', updateError);
      return { success: false, error: 'Failed to update garment stage' };
    }

    // Log to history
    await supabase.from('garment_history').insert({
      garment_id: validatedInput.garmentId,
      changed_by: user.id,
      field_name: 'stage',
      old_value: 'Ready For Pickup',
      new_value: 'Done',
      change_type: 'field_update',
    });

    // Revalidate the garment detail page
    revalidatePath(`/garments/${validatedInput.garmentId}`);

    return { success: true };
  } catch (error) {
    console.error('Error in markGarmentAsPickedUp:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}
