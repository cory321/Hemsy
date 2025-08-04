'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import type { Appointment } from '@/types';

// Validation schemas
const appointmentSchema = z.object({
  client_id: z.string().uuid(),
  title: z.string().min(1, 'Title is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  type: z.enum(['consultation', 'fitting', 'pickup', 'delivery', 'other']),
  notes: z.string().optional().nullable(),
});

const updateAppointmentSchema = appointmentSchema.partial().extend({
  id: z.string().uuid(),
  status: z
    .enum(['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'])
    .optional(),
});

// Get appointments for a date range
export async function getAppointments(
  startDate: string,
  endDate: string,
  view: 'month' | 'week' | 'day' | 'list' = 'month'
) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const supabase = await createClient();

  // Get user's shop
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_user_id', userId)
    .single();

  if (userError) throw new Error('Failed to fetch user');

  const { data: shopData, error: shopError } = await supabase
    .from('shops')
    .select('id')
    .eq('owner_user_id', userData.id)
    .single();

  if (shopError) throw new Error('Failed to fetch shop');

  // Fetch appointments with client info
  let query = supabase
    .from('appointments')
    .select(
      `
      *,
      client:clients(
        id,
        first_name,
        last_name,
        email,
        phone_number,
        accept_email,
        accept_sms
      )
    `
    )
    .eq('shop_id', shopData.id)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true });

  // Apply pagination for list view
  if (view === 'list') {
    query = query.limit(50);
  }

  const { data: appointments, error } = await query;

  if (error) throw new Error('Failed to fetch appointments');

  return appointments;
}

// Get single appointment
export async function getAppointment(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('appointments')
    .select(
      `
      *,
      client:clients(
        id,
        first_name,
        last_name,
        email,
        phone_number,
        accept_email,
        accept_sms
      )
    `
    )
    .eq('id', id)
    .single();

  if (error) throw new Error('Failed to fetch appointment');

  return data;
}

// Create appointment
export async function createAppointment(
  values: z.infer<typeof appointmentSchema>
) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  // Validate input
  const validatedData = appointmentSchema.parse(values);

  const supabase = await createClient();

  // Get user's shop
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_user_id', userId)
    .single();

  if (userError) throw new Error('Failed to fetch user');

  const { data: shopData, error: shopError } = await supabase
    .from('shops')
    .select('id')
    .eq('owner_user_id', userData.id)
    .single();

  if (shopError) throw new Error('Failed to fetch shop');

  // Check for conflicts
  const { data: conflictCheck, error: conflictError } = await supabase.rpc(
    'check_appointment_conflict',
    {
      p_shop_id: shopData.id,
      p_date: validatedData.date,
      p_start_time: validatedData.start_time,
      p_end_time: validatedData.end_time,
    }
  );

  if (conflictError) throw new Error('Failed to check conflicts');
  if (conflictCheck)
    throw new Error('This time slot conflicts with another appointment');

  // Check working hours
  const { data: hoursCheck, error: hoursError } = await supabase.rpc(
    'check_within_working_hours',
    {
      p_shop_id: shopData.id,
      p_date: validatedData.date,
      p_start_time: validatedData.start_time,
      p_end_time: validatedData.end_time,
    }
  );

  if (hoursError) throw new Error('Failed to check working hours');
  if (!hoursCheck) throw new Error('Appointment must be within working hours');

  // Create appointment
  const { data, error } = await supabase
    .from('appointments')
    .insert({
      shop_id: shopData.id,
      ...validatedData,
    })
    .select()
    .single();

  if (error) throw new Error('Failed to create appointment');

  // TODO: Send notifications if enabled
  // await sendAppointmentNotification(data, 'created');

  revalidatePath('/appointments');
  return data;
}

// Update appointment
export async function updateAppointment(
  values: z.infer<typeof updateAppointmentSchema>
) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  // Validate input
  const validatedData = updateAppointmentSchema.parse(values);
  const { id, ...updateData } = validatedData;

  const supabase = await createClient();

  // Get current appointment to check ownership
  const { data: currentAppointment, error: fetchError } = await supabase
    .from('appointments')
    .select('shop_id, date, start_time, end_time')
    .eq('id', id)
    .single();

  if (fetchError) throw new Error('Failed to fetch appointment');

  // If time/date is being updated, check conflicts
  if (updateData.date || updateData.start_time || updateData.end_time) {
    const checkDate = updateData.date || currentAppointment.date;
    const checkStartTime =
      updateData.start_time || currentAppointment.start_time;
    const checkEndTime = updateData.end_time || currentAppointment.end_time;

    const { data: conflictCheck, error: conflictError } = await supabase.rpc(
      'check_appointment_conflict',
      {
        p_shop_id: currentAppointment.shop_id,
        p_date: checkDate,
        p_start_time: checkStartTime,
        p_end_time: checkEndTime,
        p_appointment_id: id,
      }
    );

    if (conflictError) throw new Error('Failed to check conflicts');
    if (conflictCheck)
      throw new Error('This time slot conflicts with another appointment');

    // Check working hours
    const { data: hoursCheck, error: hoursError } = await supabase.rpc(
      'check_within_working_hours',
      {
        p_shop_id: currentAppointment.shop_id,
        p_date: checkDate,
        p_start_time: checkStartTime,
        p_end_time: checkEndTime,
      }
    );

    if (hoursError) throw new Error('Failed to check working hours');
    if (!hoursCheck)
      throw new Error('Appointment must be within working hours');
  }

  // Update appointment
  const { data, error } = await supabase
    .from('appointments')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error('Failed to update appointment');

  // TODO: Send notifications if enabled
  // await sendAppointmentNotification(data, 'updated');

  revalidatePath('/appointments');
  return data;
}

// Cancel appointment
export async function cancelAppointment(id: string) {
  return updateAppointment({ id, status: 'cancelled' });
}

// Complete appointment
export async function completeAppointment(id: string) {
  return updateAppointment({ id, status: 'completed' });
}

// Get shop hours
export async function getShopHours() {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const supabase = await createClient();

  // Get user's shop
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_user_id', userId)
    .single();

  if (userError) throw new Error('Failed to fetch user');

  const { data: shopData, error: shopError } = await supabase
    .from('shops')
    .select('id')
    .eq('owner_user_id', userData.id)
    .single();

  if (shopError) throw new Error('Failed to fetch shop');

  const { data, error } = await supabase
    .from('shop_hours')
    .select('*')
    .eq('shop_id', shopData.id)
    .order('day_of_week');

  if (error) throw new Error('Failed to fetch shop hours');

  // If no shop hours exist, return default hours
  if (!data || data.length === 0) {
    return getDefaultShopHours();
  }

  return data;
}

// Get default shop hours (Mon-Fri 9-5, Sat-Sun closed)
function getDefaultShopHours() {
  const defaultHours = [];
  for (let day = 0; day <= 6; day++) {
    if (day === 0 || day === 6) {
      // Sunday or Saturday - closed
      defaultHours.push({
        day_of_week: day,
        open_time: null,
        close_time: null,
        is_closed: true,
      });
    } else {
      // Monday to Friday - 9 AM to 5 PM
      defaultHours.push({
        day_of_week: day,
        open_time: '09:00',
        close_time: '17:00',
        is_closed: false,
      });
    }
  }
  return defaultHours;
}

// Update shop hours
export async function updateShopHours(
  hours: Array<{
    day_of_week: number;
    open_time: string | null;
    close_time: string | null;
    is_closed: boolean;
  }>
) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const supabase = await createClient();

  // Get user's shop
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_user_id', userId)
    .single();

  if (userError) throw new Error('Failed to fetch user');

  const { data: shopData, error: shopError } = await supabase
    .from('shops')
    .select('id')
    .eq('owner_user_id', userData.id)
    .single();

  if (shopError) throw new Error('Failed to fetch shop');

  // Upsert shop hours
  const { error } = await supabase.from('shop_hours').upsert(
    hours.map((hour) => ({
      shop_id: shopData.id,
      ...hour,
    })),
    { onConflict: 'shop_id,day_of_week' }
  );

  if (error) throw new Error('Failed to update shop hours');

  revalidatePath('/settings');
  revalidatePath('/appointments');
}

// Get calendar settings
export async function getCalendarSettings() {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const supabase = await createClient();

  // Get user's shop
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_user_id', userId)
    .single();

  if (userError) throw new Error('Failed to fetch user');

  const { data: shopData, error: shopError } = await supabase
    .from('shops')
    .select('id')
    .eq('owner_user_id', userData.id)
    .single();

  if (shopError) throw new Error('Failed to fetch shop');

  const { data, error } = await supabase
    .from('calendar_settings')
    .select('*')
    .eq('shop_id', shopData.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error('Failed to fetch calendar settings');
  }

  // Return default settings if none exist
  return (
    data || {
      buffer_time_minutes: 0,
      default_appointment_duration: 30,
      send_reminders: true,
      reminder_hours_before: 24,
    }
  );
}

// Update calendar settings
export async function updateCalendarSettings(settings: {
  buffer_time_minutes: number;
  default_appointment_duration: number;
  send_reminders: boolean;
  reminder_hours_before: number;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const supabase = await createClient();

  // Get user's shop
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_user_id', userId)
    .single();

  if (userError) throw new Error('Failed to fetch user');

  const { data: shopData, error: shopError } = await supabase
    .from('shops')
    .select('id')
    .eq('owner_user_id', userData.id)
    .single();

  if (shopError) throw new Error('Failed to fetch shop');

  const { error } = await supabase.from('calendar_settings').upsert(
    {
      shop_id: shopData.id,
      ...settings,
    },
    { onConflict: 'shop_id' }
  );

  if (error) throw new Error('Failed to update calendar settings');

  revalidatePath('/settings');
  revalidatePath('/appointments');
}
