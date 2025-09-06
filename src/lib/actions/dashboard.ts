'use server';

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { ensureUserAndShop } from '@/lib/auth/user-shop';
import {
  getTodayString,
  getCurrentTimeWithSeconds,
  getDueDateInfo,
  isGarmentOverdue,
  formatDateForDatabase,
  type GarmentOverdueInfo,
} from '@/lib/utils/date-time-utils';
import { compareGarmentsByStageAndProgress } from '@/lib/utils/garment-priority';
import type { Appointment, GarmentStage } from '@/types';

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
    .select('*, orders!inner(status)', { count: 'exact', head: true })
    .eq('shop_id', shop.id)
    .eq('due_date', today)
    .neq('stage', 'Done')
    .neq('stage', 'Ready For Pickup')
    .neq('orders.status', 'cancelled');

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

/**
 * Get garment counts by stage for the dashboard pipeline
 */
export async function getGarmentStageCounts(): Promise<Record<string, number>> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const { shop } = await ensureUserAndShop();
  const supabase = await createClient();

  // Get counts for each stage
  const stages = ['New', 'In Progress', 'Ready For Pickup', 'Done'];
  const counts: Record<string, number> = {};

  for (const stage of stages) {
    const { count, error } = await supabase
      .from('garments')
      .select('*, orders!inner(status)', { count: 'exact', head: true })
      .eq('shop_id', shop.id)
      .eq('stage', stage as any)
      .neq('orders.status', 'cancelled');

    if (error) {
      console.error(`Error fetching ${stage} garments:`, error);
      counts[stage] = 0;
    } else {
      counts[stage] = count || 0;
    }
  }

  return counts;
}

export interface ActiveGarment {
  id: string;
  name: string;
  order_id: string;
  stage: GarmentStage;
  client_name?: string;
  due_date?: string | null;
  services: {
    id: string;
    name: string;
    is_done: boolean;
  }[];
  progress: number;
}

/**
 * Get active garments (non-done, non-pickup-ready) with priority by due date
 */
export async function getActiveGarments(): Promise<ActiveGarment[]> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const { shop } = await ensureUserAndShop();
  const supabase = await createClient();

  // Get active garments with their services and client info
  // First get all active garments, then we'll sort them client-side for complex priority logic
  const { data: garments, error } = await supabase
    .from('garments')
    .select(
      `
      id,
      name,
      stage,
      order_id,
      due_date,
      garment_services (
        id,
        name,
        is_done,
        is_removed
      ),
      orders!inner (
        status,
        clients!orders_client_id_fkey (
          first_name,
          last_name
        )
      )
    `
    )
    .eq('shop_id', shop.id)
    .not('stage', 'in', '("Done","Ready For Pickup")')
    .neq('orders.status', 'cancelled')
    .order('due_date', { ascending: true, nullsFirst: false })
    .limit(20); // Get more garments to ensure we can find the 3 highest priority ones

  if (error) {
    console.error('Error fetching active garments:', error);
    throw new Error('Failed to fetch active garments');
  }

  // Process garments to include client names and calculate progress
  const processedGarments: ActiveGarment[] =
    garments?.map((garment) => {
      const clientName = garment.orders?.clients
        ? `${garment.orders.clients.first_name} ${garment.orders.clients.last_name[0]}.`
        : 'Unknown Client';

      // Calculate progress based on completed services (excluding soft-deleted)
      const allServices = garment.garment_services || [];
      const services = allServices.filter((s: any) => !s.is_removed);
      const totalServices = services.length;
      const completedServices = services.filter((s: any) => s.is_done).length;
      const progress =
        totalServices > 0
          ? Math.round((completedServices / totalServices) * 100)
          : 0;

      return {
        id: garment.id,
        name: garment.name,
        order_id: garment.order_id,
        stage: (garment.stage || 'New') as GarmentStage,
        client_name: clientName,
        due_date: garment.due_date,
        services: services.map((s: any) => ({
          id: s.id,
          name: s.name,
          is_done: s.is_done || false,
        })),
        progress,
      };
    }) || [];

  // Sort garments by priority
  // Priority order:
  // 1. Overdue items (sorted by how overdue they are, then by stage/progress)
  //    - Excludes garments with all services completed (Ready For Pickup)
  // 2. Due today (sorted by stage/progress)
  // 3. Due tomorrow (sorted by stage/progress)
  // 4. Other items with due dates (sorted by date, then by stage/progress)
  // 5. Items without due dates (sorted by stage/progress)
  const sortedGarments = processedGarments.sort((a, b) => {
    const aDueInfo = getDueDateInfo(a.due_date || null);
    const bDueInfo = getDueDateInfo(b.due_date || null);

    // If neither has a due date, sort by stage/progress
    if (!aDueInfo && !bDueInfo) {
      return compareGarmentsByStageAndProgress(a, b);
    }

    // Items with due dates come before items without
    if (!aDueInfo) return 1;
    if (!bDueInfo) return -1;

    // Check if garments are truly overdue (considering service completion)
    const aIsOverdue = isGarmentOverdue(a as GarmentOverdueInfo);
    const bIsOverdue = isGarmentOverdue(b as GarmentOverdueInfo);

    // Both overdue (considering service completion)
    if (aIsOverdue && bIsOverdue) {
      const dateDiff = aDueInfo.daysUntilDue - bDueInfo.daysUntilDue; // More negative = more overdue = higher priority
      if (dateDiff !== 0) return dateDiff;
      // Same overdue date - sort by stage/progress
      return compareGarmentsByStageAndProgress(a, b);
    }
    if (aIsOverdue) return -1;
    if (bIsOverdue) return 1;

    // Due today comes next
    if (aDueInfo.isToday && bDueInfo.isToday) {
      // Both due today - sort by stage/progress
      return compareGarmentsByStageAndProgress(a, b);
    }
    if (aDueInfo.isToday) return -1;
    if (bDueInfo.isToday) return 1;

    // Due tomorrow comes next
    if (aDueInfo.isTomorrow && bDueInfo.isTomorrow) {
      // Both due tomorrow - sort by stage/progress
      return compareGarmentsByStageAndProgress(a, b);
    }
    if (aDueInfo.isTomorrow) return -1;
    if (bDueInfo.isTomorrow) return 1;

    // For everything else, sort by days until due (ascending)
    const dateDiff = aDueInfo.daysUntilDue - bDueInfo.daysUntilDue;
    if (dateDiff !== 0) return dateDiff;

    // Same future due date - sort by stage/progress
    return compareGarmentsByStageAndProgress(a, b);
  });

  // Return only the top 3 highest priority garments
  return sortedGarments.slice(0, 3);
}

/**
 * Get garments that are ready for pickup (completed)
 */
export async function getReadyForPickupGarments(): Promise<ActiveGarment[]> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const { shop } = await ensureUserAndShop();
  const supabase = await createClient();

  // Get garments that are ready for pickup
  const { data: garments, error } = await supabase
    .from('garments')
    .select(
      `
      id,
      name,
      stage,
      order_id,
      due_date,
      created_at,
      garment_services (
        id,
        name,
        is_done,
        is_removed
      ),
      orders!inner (
        status,
        clients!orders_client_id_fkey (
          first_name,
          last_name
        )
      )
    `
    )
    .eq('shop_id', shop.id)
    .eq('stage', 'Ready For Pickup')
    .neq('orders.status', 'cancelled')
    .order('created_at', { ascending: false })
    .limit(3); // Get only the 3 most recent

  if (error) {
    console.error('Error fetching ready for pickup garments:', error);
    throw new Error('Failed to fetch ready for pickup garments');
  }

  // Process garments to include client names and calculate progress
  const processedGarments: ActiveGarment[] =
    garments?.map((garment) => {
      const clientName = garment.orders?.clients
        ? `${garment.orders.clients.first_name} ${garment.orders.clients.last_name[0]}.`
        : 'Unknown Client';

      // Calculate progress based on completed services (excluding soft-deleted)
      const allServices = garment.garment_services || [];
      const services = allServices.filter((s: any) => !s.is_removed);
      const totalServices = services.length;
      const completedServices = services.filter((s: any) => s.is_done).length;
      const progress =
        totalServices > 0
          ? Math.round((completedServices / totalServices) * 100)
          : 100; // Ready for pickup garments are 100% complete

      return {
        id: garment.id,
        name: garment.name,
        order_id: garment.order_id,
        stage: 'Ready For Pickup' as GarmentStage,
        client_name: clientName,
        due_date: garment.due_date,
        services: services.map((s: any) => ({
          id: s.id,
          name: s.name,
          is_done: s.is_done || false,
        })),
        progress,
      };
    }) || [];

  return processedGarments;
}

/**
 * Get appointments and garments due for the current week
 * Used for the WeekOverview component on the dashboard
 */
export interface WeekDayData {
  date: number; // Day of month
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  fullDate: string; // YYYY-MM-DD format
  appointments: number;
  garmentsDue: number;
  isToday: boolean;
}

export async function getWeekOverviewData(): Promise<WeekDayData[]> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const { shop } = await ensureUserAndShop();
  const supabase = await createClient();

  // Get current week boundaries (Sunday to Saturday)
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  // Format dates for queries
  const startDateStr = formatDateForDatabase(startOfWeek);
  const endDateStr = formatDateForDatabase(endOfWeek);
  const todayStr = formatDateForDatabase(today);

  // Fetch appointments for the week
  const { data: appointments, error: appointmentsError } = await supabase
    .from('appointments')
    .select('date')
    .eq('shop_id', shop.id)
    .gte('date', startDateStr)
    .lte('date', endDateStr)
    .in('status', ['pending', 'confirmed']);

  if (appointmentsError) {
    console.error('Error fetching week appointments:', appointmentsError);
    throw new Error('Failed to fetch week appointments');
  }

  // Fetch garments due this week
  const { data: garments, error: garmentsError } = await supabase
    .from('garments')
    .select('due_date, orders!inner(status)')
    .eq('shop_id', shop.id)
    .gte('due_date', startDateStr)
    .lte('due_date', endDateStr)
    .not('stage', 'in', '("Done","Ready For Pickup")')
    .neq('orders.status', 'cancelled');

  if (garmentsError) {
    console.error('Error fetching week garments:', garmentsError);
    throw new Error('Failed to fetch week garments');
  }

  // Count appointments and garments by date
  const appointmentsByDate = new Map<string, number>();
  const garmentsByDate = new Map<string, number>();

  appointments?.forEach((appt) => {
    const count = appointmentsByDate.get(appt.date) || 0;
    appointmentsByDate.set(appt.date, count + 1);
  });

  garments?.forEach((garment) => {
    if (garment.due_date) {
      const count = garmentsByDate.get(garment.due_date) || 0;
      garmentsByDate.set(garment.due_date, count + 1);
    }
  });

  // Build week data array
  const weekData: WeekDayData[] = [];
  const currentDate = new Date(startOfWeek);

  for (let i = 0; i < 7; i++) {
    const dateStr = formatDateForDatabase(currentDate);

    weekData.push({
      date: currentDate.getDate(),
      dayOfWeek: currentDate.getDay(),
      fullDate: dateStr,
      appointments: appointmentsByDate.get(dateStr) || 0,
      garmentsDue: garmentsByDate.get(dateStr) || 0,
      isToday: dateStr === todayStr,
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return weekData;
}

/**
 * Get total appointments and garments due for the week
 * Used for the summary stats in WeekOverview
 */
export interface WeekSummaryStats {
  totalAppointments: number;
  totalGarmentsDue: number;
  totalOverdue: number;
}

export async function getWeekSummaryStats(): Promise<WeekSummaryStats> {
  const weekData = await getWeekOverviewData();
  const overdueCount = await getOverdueGarmentsCount();

  const totalAppointments = weekData.reduce(
    (sum, day) => sum + day.appointments,
    0
  );
  const totalGarmentsDue = weekData.reduce(
    (sum, day) => sum + day.garmentsDue,
    0
  );

  return {
    totalAppointments,
    totalGarmentsDue,
    totalOverdue: overdueCount,
  };
}

/**
 * Get the count of overdue garments
 * Uses the isGarmentOverdue logic to properly filter
 */
export async function getOverdueGarmentsCount(): Promise<number> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const { shop } = await ensureUserAndShop();
  const supabase = await createClient();

  // Get all active garments with due dates in the past
  const today = getTodayString();

  const { data: garments, error } = await supabase
    .from('garments')
    .select(
      `
			id,
			due_date,
			stage,
			garment_services (
				id,
				is_done,
				is_removed
			),
			orders!inner(status)
		`
    )
    .eq('shop_id', shop.id)
    .lt('due_date', today)
    .not('stage', 'in', '("Done","Ready For Pickup")')
    .neq('orders.status', 'cancelled');

  if (error) {
    console.error('Error fetching overdue garments:', error);
    throw new Error('Failed to fetch overdue garments');
  }

  // Filter using the isGarmentOverdue logic
  const overdueGarments = (garments || []).filter((garment) => {
    return isGarmentOverdue({
      due_date: garment.due_date,
      stage: garment.stage as GarmentStage,
      garment_services: garment.garment_services || [],
    });
  });

  return overdueGarments.length;
}

export interface DashboardAlertGarment {
  id: string;
  name: string;
  client_name: string;
  due_date: string | null;
  days_overdue?: number;
}

/**
 * Get overdue garments with details for dashboard alerts
 * Returns up to 5 overdue garments with client names and days overdue
 */
export async function getOverdueGarmentsForAlert(): Promise<{
  count: number;
  garments: DashboardAlertGarment[];
}> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const { shop } = await ensureUserAndShop();
  const supabase = await createClient();

  // Get all active garments with due dates in the past
  const today = getTodayString();

  const { data: garments, error } = await supabase
    .from('garments')
    .select(
      `
			id,
			name,
			due_date,
			stage,
			garment_services (
				id,
				is_done,
				is_removed
			),
		orders!inner (
			status,
			clients!orders_client_id_fkey (
				first_name,
				last_name
			)
		)
	`
    )
    .eq('shop_id', shop.id)
    .lt('due_date', today)
    .not('stage', 'in', '("Done","Ready For Pickup")')
    .neq('orders.status', 'cancelled')
    .order('due_date', { ascending: true }); // Most overdue first

  if (error) {
    console.error('Error fetching overdue garments:', error);
    throw new Error('Failed to fetch overdue garments');
  }

  // Filter using the isGarmentOverdue logic and process
  const overdueGarments = (garments || [])
    .filter((garment) => {
      return isGarmentOverdue({
        due_date: garment.due_date,
        stage: garment.stage as GarmentStage,
        garment_services: garment.garment_services || [],
      });
    })
    .map((garment): DashboardAlertGarment => {
      const client = garment.orders?.clients;
      const clientName = client
        ? `${client.first_name} ${client.last_name[0]}.`
        : 'Unknown Client';

      const dueDateInfo = getDueDateInfo(garment.due_date);
      const daysOverdue = dueDateInfo ? Math.abs(dueDateInfo.daysUntilDue) : 0;

      return {
        id: garment.id,
        name: garment.name,
        client_name: clientName,
        due_date: garment.due_date,
        days_overdue: daysOverdue,
      };
    });

  return {
    count: overdueGarments.length,
    garments: overdueGarments.slice(0, 2), // Return up to 2 garments for display
  };
}

/**
 * Get garments due today with details for dashboard alerts
 * Returns up to 2 garments due today with client names
 */
export async function getGarmentsDueTodayForAlert(): Promise<{
  count: number;
  garments: DashboardAlertGarment[];
}> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const { shop } = await ensureUserAndShop();
  const supabase = await createClient();

  // Get today's date in YYYY-MM-DD format
  const today = getTodayString();

  const { data: garments, error } = await supabase
    .from('garments')
    .select(
      `
			id,
			name,
			due_date,
			stage,
		orders!inner (
			status,
			clients!orders_client_id_fkey (
				first_name,
				last_name
			)
		)
	`
    )
    .eq('shop_id', shop.id)
    .eq('due_date', today)
    .not('stage', 'in', '("Done","Ready For Pickup")')
    .neq('orders.status', 'cancelled')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching garments due today:', error);
    throw new Error('Failed to fetch garments');
  }

  const processedGarments = (garments || []).map(
    (garment): DashboardAlertGarment => {
      const client = garment.orders?.clients;
      const clientName = client
        ? `${client.first_name} ${client.last_name[0]}.`
        : 'Unknown Client';

      return {
        id: garment.id,
        name: garment.name,
        client_name: clientName,
        due_date: garment.due_date,
      };
    }
  );

  return {
    count: processedGarments.length,
    garments: processedGarments.slice(0, 2), // Return up to 2 garments for display
  };
}
