'use server';

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { ensureUserAndShop } from '@/lib/auth/user-shop';
import { format } from 'date-fns';

export interface DashboardStats {
  appointmentsToday: number;
  garmentsDueToday: number;
}

/**
 * Get the count of appointments for today
 */
export async function getTodayAppointments(): Promise<number> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const { shop } = await ensureUserAndShop();
  const supabase = await createClient();

  // Get today's date in YYYY-MM-DD format
  const today = format(new Date(), 'yyyy-MM-dd');

  const { count, error } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('shop_id', shop.id)
    .eq('date', today)
    .in('status', ['pending', 'confirmed']);

  if (error) {
    console.error('Error fetching today appointments:', error);
    throw new Error('Failed to fetch appointments');
  }

  return count || 0;
}

/**
 * Get the count of garments due today
 */
export async function getGarmentsDueToday(): Promise<number> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const { shop } = await ensureUserAndShop();
  const supabase = await createClient();

  // Get today's date in YYYY-MM-DD format
  const today = format(new Date(), 'yyyy-MM-dd');

  const { count, error } = await supabase
    .from('garments')
    .select('*', { count: 'exact', head: true })
    .eq('shop_id', shop.id)
    .eq('due_date', today)
    .neq('stage', 'Done')
    .neq('stage', 'Ready For Pickup');

  if (error) {
    console.error('Error fetching garments due today:', error);
    throw new Error('Failed to fetch garments');
  }

  return count || 0;
}

/**
 * Get dashboard statistics for today
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const [appointmentsToday, garmentsDueToday] = await Promise.all([
    getTodayAppointments(),
    getGarmentsDueToday(),
  ]);

  return {
    appointmentsToday,
    garmentsDueToday,
  };
}
