'use server';

import { createClient } from '@/lib/supabase/server';
import { ensureUserAndShop } from '@/lib/auth/user-shop';
import { redirect } from 'next/navigation';

export interface OnboardingData {
  businessName: string;
  businessType?: string;
  email?: string;
  phoneNumber?: string;
  mailingAddress?: string;
  locationType?: 'home_based' | 'shop_location' | 'mobile_service';
  workingHours?: Record<
    string,
    { start: string; end: string; closed: boolean }
  >;
  bufferTimeMinutes?: number;
  paymentPreference?: 'upfront' | 'after_service';
}

export async function completeOnboarding(data: OnboardingData) {
  try {
    // Ensure user and shop exist
    const { shop } = await ensureUserAndShop();

    const supabase = await createClient();

    // Update shop with onboarding data
    const { error } = await supabase
      .from('shops')
      .update({
        business_name: data.businessName,
        email: data.email || null,
        phone_number: data.phoneNumber || null,
        mailing_address: data.mailingAddress || null,
        location_type: data.locationType || 'shop_location',
        working_hours: data.workingHours || {},
        buffer_time_minutes: data.bufferTimeMinutes || 0,
        payment_preference: data.paymentPreference || 'after_service',
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', shop.id);

    if (error) {
      console.error('Error updating shop:', error);
      return { error: error.message };
    }

    // Calculate trial end date (14 days from now)
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 14);

    // Update trial end date
    const { error: trialError } = await supabase
      .from('shops')
      .update({
        trial_end_date: trialEndDate.toISOString(),
      })
      .eq('id', shop.id);

    if (trialError) {
      console.error('Error setting trial end date:', trialError);
    }

    return { success: true };
  } catch (error) {
    console.error('Error in completeOnboarding:', error);
    return { error: 'Failed to complete onboarding' };
  }
}

export async function redirectToDashboard() {
  redirect('/dashboard');
}
