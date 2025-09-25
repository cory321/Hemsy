'use server';

import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { ensureUserAndShop } from '@/lib/auth/user-shop';
import {
	getTodayString,
	getCurrentTimeWithSeconds,
	getDueDateInfo,
	isGarmentOverdue,
	formatDateForDatabase,
} from '@/lib/utils/date-time-utils';
import { getShopTimezone } from '@/lib/utils/timezone-helpers';
import { toZonedTime, format as formatTz } from 'date-fns-tz';
import {
	compareGarmentsByStageAndProgress,
	sortGarmentsByPriority,
} from '@/lib/utils/garment-priority';
import type { Appointment, GarmentStage } from '@/types';
import type {
	BusinessHealthData,
	ActiveGarment,
	WeekDayData,
	WeekSummaryStats,
} from './dashboard';
import type { ActivityItem } from './recent-activity';
import { getRecentActivity } from './recent-activity';
import {
	getShopHours,
	getCalendarSettings,
	preloadShopHours,
	preloadCalendarSettings,
} from './static-data-cache';

// ============================================================================
// CONSOLIDATED DATA FETCHING - Reduces 15+ calls to 6 strategic calls
// ============================================================================

/**
 * Consolidated business metrics query - combines multiple queries into one
 * Replaces: getBusinessHealthData, getShopHours, getCalendarSettings, getRecentActivity
 */
async function getBusinessMetricsConsolidatedInternal(shopId: string) {
	const supabase = await createClient();

	// Get shop timezone for consistent calculations
	const shopTimezone = await getShopTimezone(shopId);

	// Calculate date ranges for business health using shop timezone
	const now = new Date();
	const shopNow = toZonedTime(now, shopTimezone);
	const currentDay = shopNow.getDate();
	const currentMonth = shopNow.getMonth();
	const currentYear = shopNow.getFullYear();

	// Current month start (matching original implementation)
	const monthStart = new Date(currentYear, currentMonth, 1);
	const monthStartStr = formatDateForDatabase(monthStart);

	// End of today (exclusive, matching original .lt() logic)
	const endOfToday = new Date(currentYear, currentMonth, currentDay + 1);
	const endOfTodayStr = formatDateForDatabase(endOfToday);

	// Last month same period (matching original implementation)
	const lastMonthStart = new Date(currentYear, currentMonth - 1, 1);
	const lastMonthStartStr = formatDateForDatabase(lastMonthStart);

	// Same day last month, but handle month boundary (matching original logic)
	const sameDayLastMonth = new Date(
		currentYear,
		currentMonth - 1,
		Math.min(
			currentDay,
			new Date(currentYear, currentMonth, 0).getDate() // Last day of previous month
		)
	);
	const endOfSameDayLastMonth = new Date(
		sameDayLastMonth.getFullYear(),
		sameDayLastMonth.getMonth(),
		sameDayLastMonth.getDate() + 1
	);
	const endOfSameDayLastMonthStr = formatDateForDatabase(endOfSameDayLastMonth);

	// Rolling 30-day periods (using shop timezone for consistency)
	const rolling30StartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
	const rolling30StartStr = rolling30StartDate.toISOString();

	const previous30StartDate = new Date(
		now.getTime() - 60 * 24 * 60 * 60 * 1000
	);
	const previous30EndDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
	const previous30StartStr = previous30StartDate.toISOString();
	const previous30EndStr = previous30EndDate.toISOString();

	// Execute all queries in parallel
	const [
		currentMonthRevenue,
		lastMonthRevenue,
		unpaidBalance,
		rolling30Revenue,
		previous30Revenue,
		shopHours,
		calendarSettings,
		recentActivity,
	] = await Promise.all([
		// Current month revenue
		supabase
			.from('payments')
			.select(
				'amount_cents, refunded_amount_cents, invoice_id, invoices!inner(shop_id)'
			)
			.eq('invoices.shop_id', shopId)
			.in('status', ['completed', 'partially_refunded']) // Include partially_refunded like original
			.gte('created_at', monthStartStr)
			.lt('created_at', endOfTodayStr), // Exclusive end, matching original

		// Last month same period revenue
		supabase
			.from('payments')
			.select(
				'amount_cents, refunded_amount_cents, invoice_id, invoices!inner(shop_id)'
			)
			.eq('invoices.shop_id', shopId)
			.in('status', ['completed', 'partially_refunded'])
			.gte('created_at', lastMonthStartStr)
			.lt('created_at', endOfSameDayLastMonthStr), // Exclusive end, matching original

		// Unpaid balance - get unpaid orders (matching original implementation)
		supabase
			.from('orders')
			.select(
				`
				total_cents,
				invoices(
					payments(
						amount_cents,
						status,
						refunded_amount_cents
					)
				)
			`
			)
			.eq('shop_id', shopId)
			.neq('status', 'cancelled'),

		// Rolling 30-day revenue (matching original - no upper bound)
		supabase
			.from('payments')
			.select(
				'amount_cents, refunded_amount_cents, invoice_id, invoices!inner(shop_id)'
			)
			.eq('invoices.shop_id', shopId)
			.in('status', ['completed', 'partially_refunded'])
			.gte('created_at', rolling30StartStr),

		// Previous 30-day revenue (31-60 days ago, matching original)
		supabase
			.from('payments')
			.select(
				'amount_cents, refunded_amount_cents, invoice_id, invoices!inner(shop_id)'
			)
			.eq('invoices.shop_id', shopId)
			.in('status', ['completed', 'partially_refunded'])
			.gte('created_at', previous30StartStr)
			.lt('created_at', previous30EndStr),

		// Shop hours (using cached version for better performance)
		getShopHours(shopId)
			.then((data) => ({ data, error: null }))
			.catch((error) => ({ data: [], error })),

		// Calendar settings (using cached version for better performance)
		getCalendarSettings(shopId)
			.then((data) => ({ data, error: null }))
			.catch((error) => ({ data: null, error })),

		// Recent activity
		getRecentActivity(5)
			.then((data) => ({ data, error: null }))
			.catch((error) => ({ data: [], error })),
	]);

	// Process business health data
	const currentMonthRevenueCents =
		currentMonthRevenue.data?.reduce(
			(sum, payment) =>
				sum + (payment.amount_cents - (payment.refunded_amount_cents || 0)),
			0
		) || 0;

	const lastMonthRevenueCents =
		lastMonthRevenue.data?.reduce(
			(sum, payment) =>
				sum + (payment.amount_cents - (payment.refunded_amount_cents || 0)),
			0
		) || 0;

	// Calculate unpaid balance from orders (matching original implementation)
	const unpaidOrders = unpaidBalance.data || [];
	let unpaidBalanceCents = 0;
	let unpaidOrdersCount = 0;

	unpaidOrders.forEach((order) => {
		let paidAmount = 0;
		if (order.invoices && Array.isArray(order.invoices)) {
			order.invoices.forEach((invoice: any) => {
				if (invoice.payments && Array.isArray(invoice.payments)) {
					invoice.payments.forEach((payment: any) => {
						if (['completed', 'partially_refunded'].includes(payment.status)) {
							paidAmount +=
								payment.amount_cents - (payment.refunded_amount_cents || 0);
						}
					});
				}
			});
		}

		const unpaidAmount = order.total_cents - paidAmount;
		if (unpaidAmount > 0) {
			unpaidBalanceCents += unpaidAmount;
			unpaidOrdersCount++;
		}
	});

	const rolling30RevenueCents =
		rolling30Revenue.data?.reduce(
			(sum, payment) =>
				sum + (payment.amount_cents - (payment.refunded_amount_cents || 0)),
			0
		) || 0;

	const previous30RevenueCents =
		previous30Revenue.data?.reduce(
			(sum, payment) =>
				sum + (payment.amount_cents - (payment.refunded_amount_cents || 0)),
			0
		) || 0;

	// Calculate derived metrics
	const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
	const daysElapsed = currentDay;
	const dailyAverageThisMonth =
		daysElapsed > 0 ? currentMonthRevenueCents / daysElapsed : 0;

	const periodContext =
		currentDay <= 10 ? 'early' : currentDay <= 20 ? 'mid' : 'late';

	const monthlyRevenueComparison =
		lastMonthRevenueCents > 0
			? Math.round(
					((currentMonthRevenueCents - lastMonthRevenueCents) /
						lastMonthRevenueCents) *
						100
				)
			: 0;

	const rolling30DayComparison =
		previous30RevenueCents > 0
			? Math.round(
					((rolling30RevenueCents - previous30RevenueCents) /
						previous30RevenueCents) *
						100
				)
			: 0;

	const businessHealthData: BusinessHealthData = {
		currentMonthRevenueCents,
		lastMonthRevenueCents,
		monthlyRevenueComparison,
		unpaidBalanceCents,
		unpaidOrdersCount: unpaidOrdersCount,
		currentPeriodLabel: `${monthStart.toLocaleDateString('en-US', { month: 'short' })} 1-${currentDay}`,
		comparisonPeriodLabel: `${lastMonthStart.toLocaleDateString('en-US', { month: 'short' })} 1-${sameDayLastMonth.getDate()}`,
		rolling30DayLabel: `${rolling30StartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${shopNow.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
		previous30DayLabel: `${previous30StartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${previous30EndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
		dailyAverageThisMonth,
		periodContext,
		transactionCount: currentMonthRevenue.data?.length || 0,
		rolling30DayRevenue: rolling30RevenueCents,
		previous30DayRevenue: previous30RevenueCents,
		rolling30DayComparison,
	};

	// Process shop hours with defaults
	const defaultShopHours = () => {
		const hours = [];
		for (let day = 0; day <= 6; day++) {
			hours.push({
				day_of_week: day,
				open_time: day >= 1 && day <= 5 ? '09:00:00' : null,
				close_time: day >= 1 && day <= 5 ? '17:00:00' : null,
				is_closed: day === 0 || day === 6,
			});
		}
		return hours;
	};

	const processedShopHours =
		shopHours.data && shopHours.data.length > 0
			? shopHours.data
			: defaultShopHours();

	// Process calendar settings with defaults
	const processedCalendarSettings = calendarSettings.data || {
		buffer_time_minutes: 0,
		default_appointment_duration: 30,
		send_reminders: true,
		reminder_hours_before: 24,
		allow_overlapping_appointments: false,
	};

	return {
		businessHealthData,
		shopHours: processedShopHours,
		calendarSettings: processedCalendarSettings,
		recentActivity: (recentActivity.data || []) as ActivityItem[],
	};
}

/**
 * Consolidated appointments data query
 * Replaces: getNextAppointment, getTodayAppointmentsDetailed, getWeekOverviewData, getWeekSummaryStats
 */
async function getAppointmentsDataConsolidatedInternal(shopId: string) {
	const supabase = await createClient();

	// Get shop timezone for consistent date calculations
	const shopTimezone = await getShopTimezone(shopId);

	// Get current time in shop's timezone
	const now = new Date();
	const shopNow = toZonedTime(now, shopTimezone);

	// Get today's date in shop timezone
	const today = formatDateForDatabase(shopNow);
	const currentTimeForComparison = getCurrentTimeWithSeconds();

	// Calculate week range in shop timezone
	const dayOfWeek = shopNow.getDay();
	const startOfWeek = new Date(shopNow);
	startOfWeek.setDate(shopNow.getDate() - dayOfWeek);
	const endOfWeek = new Date(startOfWeek);
	endOfWeek.setDate(startOfWeek.getDate() + 6);

	const weekStartStr = formatDateForDatabase(startOfWeek);
	const weekEndStr = formatDateForDatabase(endOfWeek);

	// Get all appointments for the week in one query
	const { data: weekAppointments, error } = await supabase
		.from('appointments')
		.select(
			`
      id,
      shop_id,
      date,
      start_time,
      end_time,
      status,
      type,
      notes,
      client_id,
      order_id,
      reminder_sent,
      created_at,
      updated_at,
      client:clients (
        id,
        shop_id,
        first_name,
        last_name,
        email,
        phone_number,
        accept_sms,
        accept_email,
        notes,
        mailing_address,
        created_at,
        updated_at
      )
    `
		)
		.eq('shop_id', shopId)
		.gte('date', weekStartStr)
		.lte('date', weekEndStr)
		.in('status', ['pending', 'confirmed'])
		.order('date', { ascending: true })
		.order('start_time', { ascending: true });

	if (error) {
		console.error('Error fetching appointments:', error);
		throw error;
	}

	const appointments = (weekAppointments || []) as unknown as Appointment[];

	// Process appointments
	const todayAppointments: Appointment[] = appointments.filter(
		(apt) => apt.date === today
	);

	// Find next appointment - first check within the week data
	let nextAppointment: Appointment | null =
		appointments.find((apt) => {
			if (apt.date > today) return true;
			if (apt.date === today && apt.start_time > currentTimeForComparison)
				return true;
			return false;
		}) || null;

	// If no next appointment found in current week, query for the next one beyond the week
	if (!nextAppointment) {
		const { data: futureAppointments, error: futureError } = await supabase
			.from('appointments')
			.select(
				`
        id,
        shop_id,
        date,
        start_time,
        end_time,
        status,
        type,
        notes,
        client_id,
        order_id,
        reminder_sent,
        created_at,
        updated_at,
        client:clients (
          id,
          shop_id,
          first_name,
          last_name,
          email,
          phone_number,
          accept_sms,
          accept_email,
          notes,
          mailing_address,
          created_at,
          updated_at
        )
      `
			)
			.eq('shop_id', shopId)
			.gt('date', weekEndStr) // Look beyond the current week
			.in('status', ['pending', 'confirmed'])
			.order('date', { ascending: true })
			.order('start_time', { ascending: true })
			.limit(1);

		if (futureError) {
			console.error('Error fetching future appointments:', futureError);
		} else if (futureAppointments && futureAppointments.length > 0) {
			nextAppointment = futureAppointments[0] as unknown as Appointment;
		}
	}

	// Calculate week overview data
	const weekOverviewData: WeekDayData[] = [];
	for (let i = 0; i < 7; i++) {
		const date = new Date(startOfWeek);
		date.setDate(startOfWeek.getDate() + i);
		const dateStr = formatDateForDatabase(date);

		const dayAppointments = appointments.filter((apt) => apt.date === dateStr);

		weekOverviewData.push({
			date: date.getDate(), // Day of month as number
			dayOfWeek: i, // 0 = Sunday, 6 = Saturday
			fullDate: dateStr, // YYYY-MM-DD format
			appointments: dayAppointments.length,
			garmentsDue: 0, // Would need another query for this
			isToday: dateStr === today,
		});
	}

	// Get garments due this week for summary stats
	const { data: weekGarments, error: garmentsError } = await supabase
		.from('garments')
		.select(
			`
      *,
      garment_services (
        id,
        is_done,
        is_removed
      ),
      orders!inner(status)
    `
		)
		.eq('shop_id', shopId)
		.gte('due_date', weekStartStr)
		.lte('due_date', weekEndStr)
		.not('stage', 'in', '("Done","Ready For Pickup")')
		.neq('orders.status', 'cancelled');

	if (garmentsError) {
		console.error('Error fetching week garments:', garmentsError);
	}

	const totalGarmentsDue = weekGarments?.length || 0;
	const totalOverdue =
		weekGarments?.filter((g) => {
			// Use the proper isGarmentOverdue logic that considers service completion
			return isGarmentOverdue({
				due_date: g.due_date,
				stage: g.stage as GarmentStage,
				garment_services: g.garment_services || [],
			});
		}).length || 0;

	const weekSummaryStats: WeekSummaryStats = {
		totalAppointments: appointments.length,
		totalGarmentsDue,
		totalOverdue,
	};

	return {
		nextAppointment,
		todayAppointments,
		weekOverviewData,
		weekSummaryStats,
	};
}

/**
 * Consolidated garments data query
 * Replaces: getGarmentStageCounts, getActiveGarments
 */
async function getGarmentsDataConsolidatedInternal(shopId: string) {
	const supabase = await createClient();

	// Get shop timezone for consistent date calculations
	const shopTimezone = await getShopTimezone(shopId);
	const shopNow = toZonedTime(new Date(), shopTimezone);
	const today = formatDateForDatabase(shopNow);

	// Get all garments (including Done) to get accurate counts
	const { data: garments, error } = await supabase
		.from('garments')
		.select(
			`
      *,
      garment_services (
        id,
        service_id,
        name,
        is_done,
        is_removed,
        services (
          id,
          name,
          default_unit_price_cents
        )
      ),
      orders!inner (
        id,
        status,
        order_number,
        clients (
          id,
          first_name,
          last_name
        )
      )
    `
		)
		.eq('shop_id', shopId)
		.neq('orders.status', 'cancelled');

	if (error) {
		console.error('Error fetching garments:', error);
		throw error;
	}

	// Calculate stage counts
	const stageCounts: Record<string, number> = {
		New: 0,
		'In Progress': 0,
		'Ready For Pickup': 0,
		Done: 0,
	};

	const activeGarments: ActiveGarment[] = [];
	const readyForPickupGarments: ActiveGarment[] = [];

	garments?.forEach((garment) => {
		if (!garment) return;

		// Update stage count
		if (garment.stage && garment.stage in stageCounts) {
			stageCounts[garment.stage] = (stageCounts[garment.stage] || 0) + 1;
		}

		// Build active garment object
		if (
			garment &&
			garment.stage &&
			garment.stage !== 'Ready For Pickup' &&
			garment.stage !== 'Done'
		) {
			// Calculate service progress (excluding soft-deleted services)
			const allServices = garment.garment_services || [];
			const services = allServices.filter((gs: any) => !gs.is_removed);
			const totalServices = services.length;
			const completedServices = services.filter((gs: any) => gs.is_done).length;
			const progress =
				totalServices > 0
					? Math.round((completedServices / totalServices) * 100)
					: 0;

			activeGarments.push({
				id: garment.id,
				name: garment.name || '', // Use name field
				order_id: garment.order_id,
				stage: garment.stage as GarmentStage,
				client_name: garment.orders?.clients
					? `${garment.orders.clients.first_name} ${garment.orders.clients.last_name}`
					: '',
				due_date: garment.due_date,
				services: services.map((gs: any) => ({
					id: gs.id || `${garment.id}-${Math.random()}`, // Use garment_service id or fallback
					name: gs.name || '', // Use the service name from garment_services table directly
					is_done: gs.is_done || false,
				})),
				progress,
			});
		} else if (garment && garment.stage === 'Ready For Pickup') {
			// Build ready for pickup garment object (excluding soft-deleted services)
			const allServices = garment.garment_services || [];
			const services = allServices.filter((gs: any) => !gs.is_removed);
			const totalServices = services.length;
			const completedServices = services.filter((gs: any) => gs.is_done).length;
			const progress =
				totalServices > 0
					? Math.round((completedServices / totalServices) * 100)
					: 100; // Ready for pickup garments are 100% complete

			readyForPickupGarments.push({
				id: garment.id,
				name: garment.name || '', // Use name field
				order_id: garment.order_id,
				stage: garment.stage as GarmentStage,
				client_name: garment.orders?.clients
					? `${garment.orders.clients.first_name} ${garment.orders.clients.last_name}`
					: '',
				due_date: garment.due_date,
				services: services.map((gs: any) => ({
					id: gs.id || `${garment.id}-${Math.random()}`, // Use garment_service id or fallback
					name: gs.name || '', // Use the service name from garment_services table directly
					is_done: gs.is_done || false,
				})),
				progress,
			});
		}
	});

	// Sort active garments by due-date-aware priority (older dashboard logic)
	const sortedActiveGarments = sortGarmentsByPriority(activeGarments);

	return {
		stageCounts,
		activeGarments: sortedActiveGarments.slice(0, 3),
		readyForPickupGarments,
	};
}

/**
 * Consolidated alerts data query
 * Replaces: getOverdueGarmentsForAlert, getGarmentsDueTodayForAlert
 */
async function getAlertsDataConsolidatedInternal(shopId: string) {
	const supabase = await createClient();

	// Get shop timezone for consistent date calculations
	const shopTimezone = await getShopTimezone(shopId);
	const shopNow = toZonedTime(new Date(), shopTimezone);
	const today = formatDateForDatabase(shopNow);

	// Get all garments that are either overdue or due today
	const { data: alertGarments, error } = await supabase
		.from('garments')
		.select(
			`
      *,
      orders!inner (
        id,
        status,
        order_number,
        clients (
          id,
          first_name,
          last_name
        )
      )
    `
		)
		.eq('shop_id', shopId)
		.lte('due_date', today) // Due today or overdue
		.neq('stage', 'Done')
		.neq('stage', 'Ready For Pickup')
		.neq('orders.status', 'cancelled');

	if (error) {
		console.error('Error fetching alert garments:', error);
		throw error;
	}

	const overdueGarments: any[] = [];
	const dueTodayGarments: any[] = [];
	const clientOrders = new Map<string, Set<string>>();

	alertGarments?.forEach((garment) => {
		const clientId = garment.orders?.clients?.id;
		const clientName = garment.orders?.clients
			? `${garment.orders.clients.first_name} ${garment.orders.clients.last_name}`
			: 'Unknown';

		const garmentInfo = {
			id: garment.id,
			name: garment.name || 'Unknown', // Use name field
			order_number: garment.orders?.order_number || 'N/A',
			client_name: clientName,
			due_date: garment.due_date,
		};

		if (garment.due_date && garment.due_date < today) {
			// Overdue
			const dueDateInfo = getDueDateInfo(garment.due_date);
			if (dueDateInfo && dueDateInfo.daysUntilDue < 0) {
				overdueGarments.push({
					...garmentInfo,
					days_overdue: Math.abs(dueDateInfo.daysUntilDue),
				});
			}

			if (clientId) {
				if (!clientOrders.has(clientId)) {
					clientOrders.set(clientId, new Set());
				}
				clientOrders.get(clientId)!.add(garment.order_id);
			}
		} else if (garment.due_date === today) {
			// Due today
			dueTodayGarments.push(garmentInfo);
		}
	});

	return {
		overdueData: {
			count: overdueGarments.length,
			garments: overdueGarments.slice(0, 3), // First 3 for preview
			uniqueClientsCount: clientOrders.size,
			uniqueOrdersCount: Array.from(clientOrders.values()).reduce(
				(sum, orders) => sum + orders.size,
				0
			),
		},
		dueTodayData: {
			count: dueTodayGarments.length,
			garments: dueTodayGarments.slice(0, 3), // First 3 for preview
		},
	};
}

// ============================================================================
// CACHING LAYER - React cache() for request deduplication
// ============================================================================
//
// NOTE: We cannot use unstable_cache here because it doesn't support dynamic
// data sources like cookies. Since our createClient() function uses cookies()
// for authentication, we must stick to React's cache() for request-level
// deduplication only.
//
// The unstable_cache wrappers below are kept for reference but not used.
// ============================================================================

// Request-level deduplication with React cache
export const getBusinessMetricsConsolidated = cache(
	getBusinessMetricsConsolidatedInternal
);
export const getAppointmentsDataConsolidated = cache(
	getAppointmentsDataConsolidatedInternal
);
export const getGarmentsDataConsolidated = cache(
	getGarmentsDataConsolidatedInternal
);
export const getAlertsDataConsolidated = cache(
	getAlertsDataConsolidatedInternal
);

// Data-level caching with unstable_cache for semi-static data
// DISABLED: Cannot use unstable_cache with cookies/dynamic data
// export const getBusinessMetricsCached = unstable_cache(
// 	getBusinessMetricsConsolidated,
// 	['business-metrics'],
// 	{
// 		revalidate: 300, // 5 minutes
// 		tags: [
// 			'business-health',
// 			'shop-hours',
// 			'calendar-settings',
// 			'recent-activity',
// 		],
// 	}
// );

// export const getAppointmentsDataCached = unstable_cache(
// 	getAppointmentsDataConsolidated,
// 	['appointments-data'],
// 	{
// 		revalidate: 60, // 1 minute - appointments change frequently
// 		tags: ['appointments'],
// 	}
// );

// export const getGarmentsDataCached = unstable_cache(
// 	getGarmentsDataConsolidated,
// 	['garments-data'],
// 	{
// 		revalidate: 120, // 2 minutes
// 		tags: ['garments', 'garment-stages'],
// 	}
// );

// export const getAlertsDataCached = unstable_cache(
// 	getAlertsDataConsolidated,
// 	['alerts-data'],
// 	{
// 		revalidate: 60, // 1 minute - alerts should be fresh
// 		tags: ['alerts', 'garments'],
// 	}
// );

// ============================================================================
// MAIN DASHBOARD DATA FETCHER - Reduces 15+ calls to 6 strategic calls
// ============================================================================

export async function getDashboardDataOptimized() {
	// This is already cached per-request
	const { user, shop } = await ensureUserAndShop();

	// Execute 4 consolidated queries in parallel (shop hours and calendar settings are included in business metrics)
	// Note: Using React cache() versions instead of unstable_cache versions to avoid cookies error
	const [businessData, appointmentsData, garmentsData, alertsData] =
		await Promise.all([
			getBusinessMetricsConsolidated(shop.id),
			getAppointmentsDataConsolidated(shop.id),
			getGarmentsDataConsolidated(shop.id),
			getAlertsDataConsolidated(shop.id),
		]);

	return {
		user,
		shop,
		...businessData, // includes businessHealthData, shopHours, calendarSettings, recentActivity
		...appointmentsData, // includes nextAppointment, todayAppointments, weekOverviewData, weekSummaryStats
		...garmentsData, // includes stageCounts, activeGarments, readyForPickupGarments
		...alertsData, // includes overdueData, dueTodayData
	};
}

// ============================================================================
// CACHE INVALIDATION HELPERS
// ============================================================================

export async function invalidateDashboardCache() {
	// Invalidate all dashboard-related tags
	// Note: These tags are not currently used since we can't use unstable_cache
	// Keeping this for future use when Next.js supports dynamic data in cache
	const { revalidateTag } = await import('next/cache');

	revalidateTag('business-health');
	revalidateTag('shop-hours');
	revalidateTag('calendar-settings');
	revalidateTag('recent-activity');
	revalidateTag('appointments');
	revalidateTag('garments');
	revalidateTag('garment-stages');
	revalidateTag('alerts');
}
