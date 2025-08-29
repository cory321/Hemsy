'use server';

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { ensureUserAndShop } from '@/lib/auth/user-shop';
import { format } from 'date-fns';
import type { Appointment } from '@/types';

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
 * Get today's appointments with full details including client information
 */
export async function getTodayAppointmentsDetailed(): Promise<Appointment[]> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const { shop } = await ensureUserAndShop();
  const supabase = await createClient();

  // Get today's date in YYYY-MM-DD format
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: appointments, error } = await supabase
    .from('appointments')
    .select(
      `
      *,
      client:clients(
        id,
        shop_id,
        first_name,
        last_name,
        email,
        phone_number,
        accept_email,
        accept_sms,
        created_at,
        updated_at
      )
    `
    )
    .eq('shop_id', shop.id)
    .eq('date', today)
    .in('status', ['pending', 'confirmed'])
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching today appointments detailed:', error);
    throw new Error('Failed to fetch appointments');
  }

  return appointments as Appointment[];
}

/**
 * Get the next upcoming appointment with client information
 */
export async function getNextAppointment(): Promise<Appointment | null> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const { shop } = await ensureUserAndShop();
  const supabase = await createClient();

  // Get current date and time
  const now = new Date();
  const today = format(now, 'yyyy-MM-dd');
  const currentTime = format(now, 'HH:mm');

  const { data: appointments, error } = await supabase
    .from('appointments')
    .select(
      `
      *,
      client:clients(
        id,
        shop_id,
        first_name,
        last_name,
        email,
        phone_number,
        accept_email,
        accept_sms,
        created_at,
        updated_at
      )
    `
    )
    .eq('shop_id', shop.id)
    .in('status', ['pending', 'confirmed'])
    .or(`date.gt.${today},and(date.eq.${today},start_time.gt.${currentTime})`)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })
    .limit(1);

  if (error) {
    console.error('Error fetching next appointment:', error);
    throw new Error('Failed to fetch next appointment');
  }

  return appointments?.[0] || null;
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
