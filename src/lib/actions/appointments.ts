'use server';

import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Appointment, AppointmentStatus } from '@/types';
import { EmailService } from '@/lib/services/email/email-service';
import {
  getTodayString,
  getCurrentTimeString,
  formatTimeHHMM,
} from '@/lib/utils/date-time-utils';

// Validation schemas
const createAppointmentSchema = z.object({
  shopId: z.string().uuid(),
  clientId: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  type: z.enum(['consultation', 'fitting', 'pickup', 'delivery', 'other']),
  notes: z.string().optional(),
  // Per-appointment email preference (default: true if client accepts email)
  sendEmail: z.boolean().optional(),
});

const updateAppointmentSchema = createAppointmentSchema
  .extend({
    id: z.string().uuid(),
    status: z
      .enum(['pending', 'declined', 'confirmed', 'canceled', 'no_show'])
      .optional(),
    originalDate: z.string().optional(), // For tracking date changes
    // Per-operation flag to control whether to send notification emails
    sendEmail: z.boolean().optional(),
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
  console.log('🚀 getAppointmentsByTimeRange called:', {
    shopId,
    startDate,
    endDate,
  });

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

  // Fetch appointments with client data directly
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
    .eq('shop_id', shopId)
    .gte('date', startDate)
    .lte('date', endDate)
    .not('status', 'in', '(canceled,no_show)')
    .order('date', { ascending: true })
    .order('start_time', { ascending: true });

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
    date: apt.date,
    start_time: apt.start_time,
    end_time: apt.end_time,
    type: apt.type,
    status: apt.status,
    notes: apt.notes,
    reminder_sent: apt.reminder_sent,
    created_at: apt.created_at,
    updated_at: apt.updated_at,
    client: apt.client || null,
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

  // Prevent creating appointments in the past (date + startTime before now)
  const startDateTime = new Date(`${validated.date} ${validated.startTime}`);
  if (startDateTime.getTime() < Date.now()) {
    throw new Error('Cannot create appointments in the past');
  }

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

  // Insert appointment
  const insertData: any = {
    shop_id: validated.shopId,
    date: validated.date,
    start_time: validated.startTime,
    end_time: validated.endTime,
    type: validated.type,
    notes: validated.notes || null,
  };

  // Only add client_id if provided (it's required in the database)
  if (validated.clientId) {
    insertData.client_id = validated.clientId;
  }

  const { data: appointment, error } = await supabase
    .from('appointments')
    .insert(insertData)
    .select('*, client:clients(*)')
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
    .eq('id', appointment.id)
    .single();

  if (fetchError || !completeAppointment) {
    throw new Error('Failed to fetch created appointment');
  }

  // Conditionally send initial scheduled email to the client only
  try {
    const clientAcceptsEmail =
      completeAppointment.client?.accept_email !== false;
    const shouldSend = validated.sendEmail !== false; // default to true when undefined

    if (clientAcceptsEmail && shouldSend) {
      console.log(
        '🚀 [appointments-refactored] Attempting to send scheduled email for appointment:',
        appointment.id
      );
      const emailService = new EmailService(supabase, userData.id);
      const result = await emailService.sendAppointmentEmail(
        appointment.id,
        'appointment_scheduled'
      );
      console.log('✅ [appointments-refactored] Email send result:', result);
    } else {
      console.log(
        'ℹ️ [appointments-refactored] Skipping email send. clientAcceptsEmail:',
        clientAcceptsEmail,
        'shouldSend:',
        shouldSend
      );
    }
  } catch (e) {
    console.error(
      '❌ [appointments-refactored] Failed to send scheduled email:',
      e
    );
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

  // Prevent reschedule/cancel for past appointments
  const currentAptEnd = new Date(`${currentApt.date} ${currentApt.end_time}`);
  const isPast = currentAptEnd < new Date();
  if (
    isPast &&
    (validated.status === 'canceled' ||
      validated.date ||
      validated.startTime ||
      validated.endTime)
  ) {
    throw new Error('Cannot modify past appointments');
  }

  if (fetchError || !currentApt) {
    throw new Error('Appointment not found or unauthorized');
  }

  // If date/time is changing, check for conflicts
  if (validated.date || validated.startTime || validated.endTime) {
    const date = validated.date || currentApt.date;
    const startTime = validated.startTime || currentApt.start_time;
    const endTime = validated.endTime || currentApt.end_time;

    // Prevent moving appointment to a past time
    const newStartDateTime = new Date(`${date} ${startTime}`);
    if (newStartDateTime.getTime() < Date.now()) {
      throw new Error('Cannot schedule appointments in the past');
    }

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

  // Capture previous time before update for email context
  const previousDateTime = `${currentApt.date} ${currentApt.start_time}`;

  // Update the appointment
  const updateData: any = {};
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
    .single();

  if (updateError || !updatedApt) {
    throw new Error('Failed to update appointment');
  }

  // Conditionally send notification emails for reschedule/cancel
  try {
    console.log(
      '[appointments-refactored.updateAppointment] evaluating notification send...',
      {
        id: validated.id,
        status: validated.status,
        dateChanged: validated.date !== undefined,
        startChanged: validated.startTime !== undefined,
        endChanged: validated.endTime !== undefined,
        previousDateTime,
      }
    );
    const { data: currentUserRow } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .single();
    const ownerUserId = currentUserRow?.id || userId;
    const emailService = new EmailService(supabase, ownerUserId);

    const sendEmailFlag = validated.sendEmail !== false; // default to true

    if (sendEmailFlag) {
      if (validated.status === 'canceled') {
        console.log(
          '[appointments-refactored] sending appointment_canceled email',
          {
            appointmentId: validated.id,
            previousDateTime,
          }
        );
        await emailService.sendAppointmentEmail(
          validated.id,
          'appointment_canceled',
          { previous_time: previousDateTime }
        );
      } else if (validated.status === 'no_show') {
        console.log(
          '[appointments-refactored] sending appointment_no_show email',
          {
            appointmentId: validated.id,
          }
        );
        await emailService.sendAppointmentEmail(
          validated.id,
          'appointment_no_show'
        );
      } else {
        const timeChanged =
          validated.date !== undefined ||
          validated.startTime !== undefined ||
          validated.endTime !== undefined;

        if (timeChanged) {
          console.log(
            '[appointments-refactored] sending appointment_rescheduled email',
            {
              appointmentId: validated.id,
              previousDateTime,
            }
          );
          await emailService.sendAppointmentEmail(
            validated.id,
            'appointment_rescheduled',
            { previous_time: previousDateTime }
          );
        }
      }
    }
  } catch (e) {
    console.warn('[updateAppointment] Failed to send notification email:', e);
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

  // First get the user's shop
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_user_id', userId)
    .single();

  if (userError || !userData) throw new Error('User not found');

  const { data: shopData, error: shopError } = await supabase
    .from('shops')
    .select('id')
    .eq('owner_user_id', userData.id)
    .single();

  if (shopError || !shopData) throw new Error('Unauthorized access to shop');

  // Delete the appointment
  const { error } = await supabase
    .from('appointments')
    .delete()
    .eq('id', appointmentId)
    .eq('shop_id', shopData.id);

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
    .eq('shop_id', shopId)
    .eq('client_id', clientId)
    .order('date', { ascending: false })
    .order('start_time', { ascending: false });

  if (!includeCompleted) {
    query = query.in('status', ['pending', 'confirmed']);
  }

  const { data: appointments, error } = await query;

  if (error) {
    console.error('Failed to fetch client appointments:', error);
    throw new Error('Failed to fetch client appointments');
  }

  return appointments as Appointment[];
}

/**
 * Get the count of garments ready for pickup for a specific client
 */
export async function getClientReadyForPickupCount(
  shopId: string,
  clientId: string
): Promise<number> {
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

  // Query garments using the garments_with_clients view for easier filtering
  const { count, error } = await supabase
    .from('garments_with_clients')
    .select('id', { count: 'exact', head: true })
    .eq('shop_id', shopId)
    .eq('client_id', clientId)
    .eq('stage', 'Ready For Pickup');

  if (error) {
    console.error('Failed to fetch ready for pickup count:', error);
    throw new Error('Failed to fetch ready for pickup count');
  }

  return count || 0;
}

/**
 * Get the next upcoming appointment for a specific client
 */
export async function getNextClientAppointment(
  shopId: string,
  clientId: string
): Promise<Appointment | null> {
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

  // Get today's date for filtering upcoming appointments
  const todayStr = getTodayString();

  // Get current time for same-day appointments
  const currentTime = getCurrentTimeString();

  // Query for the next upcoming appointment
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
    .eq('shop_id', shopId)
    .eq('client_id', clientId)
    .in('status', ['pending', 'confirmed'])
    .or(
      `date.gt.${todayStr},and(date.eq.${todayStr},start_time.gt.${currentTime})`
    )
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })
    .limit(1);

  if (error) {
    console.error('Failed to fetch next client appointment:', error);
    throw new Error('Failed to fetch next client appointment');
  }

  return appointments?.[0] || null;
}

/**
 * Paginated client appointments with filtering and timeframe support
 */
export async function getClientAppointmentsPage(
  shopId: string,
  clientId: string,
  options?: {
    includeCompleted?: boolean;
    statuses?: AppointmentStatus[];
    timeframe?: 'upcoming' | 'past' | 'all';
    dateRange?: { start: string; end: string };
    limit?: number;
    offset?: number;
  }
): Promise<{
  appointments: Appointment[];
  total: number;
  hasMore: boolean;
  nextOffset: number;
}> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const supabase = await createClient();

  // Verify shop ownership
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_user_id', userId)
    .single();
  if (userError || !userData) throw new Error('Failed to fetch user');

  const { data: shopData, error: shopError } = await supabase
    .from('shops')
    .select('id')
    .eq('id', shopId)
    .eq('owner_user_id', userData.id)
    .single();
  if (shopError || !shopData) throw new Error('Unauthorized access to shop');

  const { includeCompleted, statuses, timeframe, dateRange } = options || {};

  // Build base query
  let query = supabase
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
    `,
      { count: 'exact' }
    )
    .eq('shop_id', shopId)
    .eq('client_id', clientId);

  // Status filter
  if (statuses && statuses.length > 0) {
    query = query.in('status', statuses);
  } else if (!includeCompleted) {
    query = query.in('status', ['pending', 'confirmed']);
  }

  // Timeframe filter
  const todayStr = getTodayString();

  if (dateRange) {
    query = query.gte('date', dateRange.start).lte('date', dateRange.end);
  } else if (timeframe === 'upcoming') {
    query = query.gte('date', todayStr);
  } else if (timeframe === 'past') {
    query = query.lt('date', todayStr);
  }

  // Sorting based on timeframe
  if (timeframe === 'upcoming') {
    query = query
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });
  } else if (timeframe === 'past') {
    query = query
      .order('date', { ascending: false })
      .order('start_time', { ascending: false });
  } else {
    query = query
      .order('date', { ascending: false })
      .order('start_time', { ascending: false });
  }

  // Pagination
  const limit = options?.limit ?? 10;
  const offset = options?.offset ?? 0;
  query = query.range(offset, offset + limit - 1);

  const { data: rows, error, count } = await query;
  if (error) {
    console.error('Failed to fetch client appointments (paginated):', error);
    throw new Error('Failed to fetch client appointments');
  }

  const total = count || 0;
  const hasMore = total > offset + limit;
  const nextOffset = offset + limit;

  return {
    appointments: (rows || []) as unknown as Appointment[],
    total,
    hasMore,
    nextOffset,
  };
}
