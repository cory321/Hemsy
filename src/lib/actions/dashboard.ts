'use server';

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { ensureUserAndShop } from '@/lib/auth/user-shop';
import {
  getTodayString,
  getCurrentTimeWithSeconds,
} from '@/lib/utils/date-time-utils';
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
  const today = getTodayString();

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
  const today = getTodayString();

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
  const today = getTodayString();

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
 * This now includes currently happening appointments to be handled client-side
 */
export async function getNextAppointment(): Promise<Appointment | null> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const { shop } = await ensureUserAndShop();
  const supabase = await createClient();

  // Get current date and time
  const today = getTodayString();
  const currentTimeForComparison = getCurrentTimeWithSeconds();

  // First, try to find an appointment that's currently happening
  const { data: currentAppointments, error: currentError } = await supabase
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
    .lte('start_time', currentTimeForComparison)
    .gte('end_time', currentTimeForComparison)
    .order('start_time', { ascending: true })
    .limit(1);

  if (currentError) {
    console.error('Error fetching current appointment:', currentError);
    throw new Error('Failed to fetch current appointment');
  }

  // If there's a current appointment, return it
  if (currentAppointments && currentAppointments.length > 0) {
    return currentAppointments[0] as Appointment;
  }

  // Otherwise, get the next future appointment
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
    .or(
      `date.gt.${today},and(date.eq.${today},start_time.gt.${currentTimeForComparison})`
    )
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
