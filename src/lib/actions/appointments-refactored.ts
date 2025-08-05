'use server';

import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Appointment } from '@/types';

// Validation schemas
const createAppointmentSchema = z.object({
  shopId: z.string().uuid(),
  clientId: z.string().uuid().optional(),
  title: z.string().min(1, 'Title is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  type: z.enum(['consultation', 'fitting', 'pickup', 'delivery', 'other']),
  notes: z.string().optional(),
});

const updateAppointmentSchema = createAppointmentSchema
  .extend({
    id: z.string().uuid(),
    status: z
      .enum(['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'])
      .optional(),
    originalDate: z.string().optional(), // For tracking date changes
  })
  .partial()
  .required({ id: true });

export type CreateAppointmentData = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentData = z.infer<typeof updateAppointmentSchema>;

/**
 * Get appointments for a specific time range
 * Optimized for calendar views with proper indexes
 */
export async function getAppointmentsByTimeRange(
  shopId: string,
  startDate: string,
  endDate: string
): Promise<Appointment[]> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const supabase = await createClient();

  // Verify shop ownership
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_user_id', userId)
    .single();

  if (userError) throw new Error('Failed to fetch user');

  const { data: shopData, error: shopError } = await supabase
    .from('shops')
    .select('id')
    .eq('id', shopId)
    .eq('owner_user_id', userData.id)
    .single();

  if (shopError || !shopData) throw new Error('Unauthorized access to shop');

  // Use the optimized function for time-range queries
  const { data: appointments, error } = await supabase.rpc(
    'get_appointments_time_range',
    {
      p_shop_id: shopId,
      p_start_date: startDate,
      p_end_date: endDate,
      p_include_cancelled: false,
    }
  );

  if (error) {
    console.error('Failed to fetch appointments:', error);
    throw new Error('Failed to fetch appointments');
  }

  // Transform the response to match our Appointment type
  return appointments.map((apt) => ({
    id: apt.id,
    shop_id: apt.shop_id,
    client_id: apt.client_id,
    order_id: apt.order_id,
    title: apt.title,
    date: apt.date,
    start_time: apt.start_time,
    end_time: apt.end_time,
    type: apt.type,
    status: apt.status,
    notes: apt.notes,
    reminder_sent: apt.reminder_sent,
    created_at: apt.created_at,
    updated_at: apt.updated_at,
    client: apt.client_id
      ? {
          id: apt.client_id,
          first_name: apt.client_first_name || '',
          last_name: apt.client_last_name || '',
          email: apt.client_email,
          phone_number: apt.client_phone_number,
          accept_email: true,
          accept_sms: true,
        }
      : null,
  }));
}

/**
 * Get appointment counts by date for month view indicators
 */
export async function getAppointmentCounts(
  shopId: string,
  startDate: string,
  endDate: string
): Promise<Record<string, number>> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const supabase = await createClient();

  // Verify shop ownership (reuse logic from above)
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_user_id', userId)
    .single();

  if (userError) throw new Error('Failed to fetch user');

  const { data: shopData, error: shopError } = await supabase
    .from('shops')
    .select('id')
    .eq('id', shopId)
    .eq('owner_user_id', userData.id)
    .single();

  if (shopError || !shopData) throw new Error('Unauthorized access to shop');

  // Use the optimized function for counts
  const { data: counts, error } = await supabase.rpc(
    'get_appointment_counts_by_date',
    {
      p_shop_id: shopId,
      p_start_date: startDate,
      p_end_date: endDate,
    }
  );

  if (error) {
    console.error('Failed to fetch appointment counts:', error);
    throw new Error('Failed to fetch appointment counts');
  }

  // Convert to a map for easy lookup
  const countsMap: Record<string, number> = {};
  counts.forEach((row) => {
    countsMap[row.date] = row.total_count;
  });

  return countsMap;
}

/**
 * Create a new appointment using atomic database function
 */
export async function createAppointment(
  data: CreateAppointmentData
): Promise<Appointment> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const validated = createAppointmentSchema.parse(data);
  const supabase = await createClient();

  // Verify shop ownership
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_user_id', userId)
    .single();

  if (userError) throw new Error('Failed to fetch user');

  const { data: shopData, error: shopError } = await supabase
    .from('shops')
    .select('id')
    .eq('id', validated.shopId)
    .eq('owner_user_id', userData.id)
    .single();

  if (shopError || !shopData) throw new Error('Unauthorized access to shop');

  // Use atomic function for conflict detection
  const { data: appointment, error } = await supabase
    .rpc('create_appointment_atomic', {
      p_shop_id: validated.shopId,
      p_client_id: validated.clientId || null,
      p_title: validated.title,
      p_date: validated.date,
      p_start_time: validated.startTime,
      p_end_time: validated.endTime,
      p_type: validated.type,
      p_notes: validated.notes || null,
    })
    .single();

  if (error) {
    if (error.code === 'P0001') {
      throw new Error(
        'This time slot is already booked. Please choose another time.'
      );
    }
    if (error.code === 'P0002') {
      throw new Error('The appointment is outside of working hours.');
    }
    console.error('Failed to create appointment:', error);
    throw new Error('Failed to create appointment');
  }

  // Fetch the complete appointment with client data
  const { data: completeAppointment, error: fetchError } = await supabase
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
    .eq('id', appointment.id)
    .single();

  if (fetchError || !completeAppointment) {
    throw new Error('Failed to fetch created appointment');
  }

  // Revalidate the appointments page
  revalidatePath('/appointments');

  return completeAppointment as Appointment;
}

/**
 * Update an existing appointment
 */
export async function updateAppointment(
  data: UpdateAppointmentData
): Promise<Appointment> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const validated = updateAppointmentSchema.parse(data);
  const supabase = await createClient();

  // Get current appointment to verify ownership
  const { data: currentApt, error: fetchError } = await supabase
    .from('appointments')
    .select('*, shops!inner(owner_user_id, users!inner(clerk_user_id))')
    .eq('id', validated.id)
    .eq('shops.users.clerk_user_id', userId)
    .single();

  if (fetchError || !currentApt) {
    throw new Error('Appointment not found or unauthorized');
  }

  // If date/time is changing, check for conflicts
  if (validated.date || validated.startTime || validated.endTime) {
    const date = validated.date || currentApt.date;
    const startTime = validated.startTime || currentApt.start_time;
    const endTime = validated.endTime || currentApt.end_time;

    const { data: hasConflict, error: conflictError } = await supabase.rpc(
      'check_appointment_conflict',
      {
        p_shop_id: currentApt.shop_id,
        p_date: date,
        p_start_time: startTime,
        p_end_time: endTime,
        p_appointment_id: validated.id,
      }
    );

    if (conflictError) {
      throw new Error('Failed to check for conflicts');
    }

    if (hasConflict) {
      throw new Error(
        'This time slot is already booked. Please choose another time.'
      );
    }
  }

  // Update the appointment
  const updateData: any = {};
  if (validated.title !== undefined) updateData.title = validated.title;
  if (validated.date !== undefined) updateData.date = validated.date;
  if (validated.startTime !== undefined)
    updateData.start_time = validated.startTime;
  if (validated.endTime !== undefined) updateData.end_time = validated.endTime;
  if (validated.type !== undefined) updateData.type = validated.type;
  if (validated.status !== undefined) updateData.status = validated.status;
  if (validated.notes !== undefined) updateData.notes = validated.notes;
  if (validated.clientId !== undefined)
    updateData.client_id = validated.clientId;

  const { data: updatedApt, error: updateError } = await supabase
    .from('appointments')
    .update(updateData)
    .eq('id', validated.id)
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
    .single();

  if (updateError || !updatedApt) {
    throw new Error('Failed to update appointment');
  }

  // Revalidate the appointments page
  revalidatePath('/appointments');

  return updatedApt as Appointment;
}

/**
 * Delete an appointment
 */
export async function deleteAppointment(appointmentId: string): Promise<void> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const supabase = await createClient();

  // Verify ownership through joins
  const { error } = await supabase
    .from('appointments')
    .delete()
    .eq('id', appointmentId)
    .eq(
      'shop_id',
      supabase
        .from('shops')
        .select('id')
        .eq(
          'owner_user_id',
          supabase
            .from('users')
            .select('id')
            .eq('clerk_user_id', userId)
            .single()
        )
        .single()
    );

  if (error) {
    console.error('Failed to delete appointment:', error);
    throw new Error('Failed to delete appointment');
  }

  // Revalidate the appointments page
  revalidatePath('/appointments');
}

/**
 * Get appointments for a specific client
 */
export async function getClientAppointments(
  shopId: string,
  clientId: string,
  includeCompleted: boolean = false
): Promise<Appointment[]> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const supabase = await createClient();

  // Verify shop ownership
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_user_id', userId)
    .single();

  if (userError) throw new Error('Failed to fetch user');

  const { data: shopData, error: shopError } = await supabase
    .from('shops')
    .select('id')
    .eq('id', shopId)
    .eq('owner_user_id', userData.id)
    .single();

  if (shopError || !shopData) throw new Error('Unauthorized access to shop');

  // Query appointments for the client
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
    .eq('shop_id', shopId)
    .eq('client_id', clientId)
    .order('date', { ascending: false })
    .order('start_time', { ascending: false });

  if (!includeCompleted) {
    query = query.in('status', ['scheduled', 'confirmed']);
  }

  const { data: appointments, error } = await query;

  if (error) {
    console.error('Failed to fetch client appointments:', error);
    throw new Error('Failed to fetch client appointments');
  }

  return appointments as Appointment[];
}
