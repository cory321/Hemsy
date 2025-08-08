'use server';

import { auth } from '@clerk/nextjs/server';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { Tables } from '@/types/supabase';
// Intentionally avoid static import so tests can mock this module reliably
// via Jest. We'll resolve it dynamically within functions.

// Validation schema for business information
const UpdateBusinessInfoSchema = z.object({
  business_name: z.string().min(1, 'Business name is required').max(100),
  email: z.string().email('Invalid email address'),
  phone_number: z.string().min(1, 'Phone number is required').max(20),
  mailing_address: z.string().max(200).optional(),
  location_type: z
    .enum(['home_based', 'shop_location', 'mobile_service'])
    .optional(),
  payment_preference: z.enum(['upfront', 'after_service']).optional(),
});

type UpdateBusinessInfoInput = z.infer<typeof UpdateBusinessInfoSchema>;

/**
 * Get the current shop's business information
 */
export async function getShopBusinessInfo(): Promise<{
  success: boolean;
  data?: any; // Using any for now due to type mismatch - will be fixed after migration
  error?: string;
}> {
  try {
    const { ensureUserAndShop } = await import('@/lib/actions/users');
    const { shop } = await ensureUserAndShop();

    // Cast to any to handle missing fields until migration is run
    const shopData = shop as any;

    return {
      success: true,
      data: {
        id: shopData.id,
        name: shopData.name,
        business_name: shopData.business_name || shopData.name,
        email: shopData.email || '',
        phone_number: shopData.phone_number || '',
        mailing_address: shopData.mailing_address || '',
        location_type: shopData.location_type || 'shop_location',
        payment_preference: shopData.payment_preference || 'after_service',
        trial_countdown_enabled: shopData.trial_countdown_enabled || false,
        trial_end_date: shopData.trial_end_date,
      },
    };
  } catch (error) {
    console.error('Failed to get shop business info:', error);
    return {
      success: false,
      error: 'Failed to load business information',
    };
  }
}

/**
 * Update the shop's business information
 */
export async function updateShopBusinessInfo(
  input: UpdateBusinessInfoInput
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Validate input
    const validatedData = UpdateBusinessInfoSchema.parse(input);

    const { ensureUserAndShop } = await import('@/lib/actions/users');
    const { shop } = await ensureUserAndShop();
    const supabase = await createSupabaseClient();

    const { error } = await supabase
      .from('shops')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', shop.id);

    if (error) {
      console.error('Failed to update shop:', error);
      throw new Error(error.message);
    }

    // Revalidate settings page (guard for test/runtime without Next.js store)
    try {
      revalidatePath('/settings');
    } catch (e) {
      // no-op in test environments where revalidatePath may not be available
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to update shop business info:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || 'Invalid input',
      };
    }

    return {
      success: false,
      error: 'Failed to update business information',
    };
  }
}
