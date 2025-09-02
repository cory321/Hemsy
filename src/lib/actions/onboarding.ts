'use server';

import { createClient } from '@/lib/supabase/server';
import { ensureUserAndShop } from '@/lib/auth/user-shop';
import { redirect } from 'next/navigation';

export interface OnboardingData {
  businessName: string;
  businessType?: string;
  email: string;
  phoneNumber?: string;
  mailingAddress?: string;
  locationType?: 'home_based' | 'shop_location' | 'mobile_service';
  workingHours?: Record<
    string,
    { start: string; end: string; closed: boolean }
  >;
  bufferTimeMinutes?: number;
  timezone?: string;
  timezoneOffset?: number;
}

export async function completeOnboarding(data: OnboardingData) {
  try {
    // Ensure user and shop exist
    const { shop, user } = await ensureUserAndShop();

    const supabase = await createClient();

    // Use provided timezone or default to America/New_York
    const timezone = data.timezone || 'America/New_York';
    const timezoneOffset =
      data.timezoneOffset ?? new Date().getTimezoneOffset();

    // Update shop with onboarding data (email required from onboarding form)
    const { error } = await supabase
      .from('shops')
      .update({
        business_name: data.businessName, // This will be used as the primary display name
        email: data.email,
        phone_number: data.phoneNumber || null,
        mailing_address: data.mailingAddress || null,
        location_type: data.locationType || 'shop_location',
        working_hours: data.workingHours || {},
        buffer_time_minutes: data.bufferTimeMinutes || 0,
        timezone: timezone,
        timezone_offset: timezoneOffset,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', shop.id);

    if (error) {
      console.error('Error updating shop:', error);
      return { error: error.message };
    }

    // Also update user's timezone
    const { error: userError } = await supabase
      .from('users')
      .update({
        timezone: timezone,
        timezone_offset: timezoneOffset,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (userError) {
      console.error('Error updating user timezone:', userError);
      // Continue even if user update fails
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
