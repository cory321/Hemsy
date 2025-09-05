'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import type { GarmentStage } from '@/types';

const UpdateStageSchema = z.object({
  shopId: z.string().uuid(),
  garmentId: z.string().uuid(),
  stage: z.custom<GarmentStage>(),
});

export async function updateGarmentStage(
  shopId: string,
  garmentId: string,
  stage: GarmentStage
) {
  const supabase = await createClient();
  const {
    shopId: sId,
    garmentId: gId,
    stage: s,
  } = UpdateStageSchema.parse({
    shopId,
    garmentId,
    stage,
  });

  // Ensure garment belongs to shop and update
  const { data: current, error: fetchError } = await supabase
    .from('garments')
    .select('id, shop_id, stage')
    .eq('id', gId)
    .maybeSingle();

  if (fetchError)
    throw new Error(`Failed to fetch garment: ${fetchError.message}`);
  if (!current || current.shop_id !== sId) throw new Error('Garment not found');
  if (current.stage === s) return;

  const { error } = await supabase
    .from('garments')
    .update({ stage: s })
    .eq('id', gId)
    .eq('shop_id', sId);

  if (error)
    throw new Error(`Failed to update garment stage: ${error.message}`);
}
