'use server';

import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type {
	BusinessHealthData,
	ActiveGarment,
	DashboardAlertGarment,
} from './dashboard';

// ============================================================================
// RPC-BASED OPTIMIZED QUERIES
// ============================================================================
//
// This file provides TypeScript wrappers for the optimized Supabase RPC
// functions created in the Phase 3 migration. These functions consolidate
// multiple database queries into single RPC calls for maximum performance.
// ============================================================================

// ============================================================================
// BUSINESS DASHBOARD METRICS RPC
// ============================================================================

export interface BusinessMetricsRPCResult {
	currentMonthRevenueCents: number;
	lastMonthRevenueCents: number;
	unpaidBalanceCents: number;
	rolling30RevenueCents: number;
	previous30RevenueCents: number;
	calculatedAt: string;
}

/**
 * Get consolidated business metrics using RPC function
 * Replaces 5+ individual queries with single database call
 */
async function getBusinessMetricsRPCInternal(
	shopId: string
): Promise<BusinessMetricsRPCResult> {
	const supabase = await createClient();

	const { data, error } = await supabase.rpc(
		'get_business_dashboard_metrics_consolidated',
		{
			p_shop_id: shopId,
		}
	);

	if (error) {
		console.error('Error fetching business metrics via RPC:', error);
		throw new Error(`Failed to fetch business metrics: ${error.message}`);
	}

	return data as unknown as BusinessMetricsRPCResult;
}

/**
 * Request-level cached business metrics RPC
 */
export const getBusinessMetricsRPC = cache(getBusinessMetricsRPCInternal);

/**
 * Data-level cached business metrics
 * Note: Cannot use unstable_cache due to cookies() dependency in Supabase client
 * Using React cache() for request-level deduplication
 */
export const getBusinessMetricsRPCCached = getBusinessMetricsRPC;

// ============================================================================
// GARMENT PIPELINE DATA RPC
// ============================================================================

export interface GarmentPipelineRPCResult {
	stageCounts: Record<string, number>;
	activeGarments: ActiveGarment[];
	readyForPickupGarments: ActiveGarment[];
	calculatedAt: string;
}

/**
 * Get consolidated garment pipeline data using RPC function
 * Replaces multiple garment queries with single database call
 */
async function getGarmentPipelineRPCInternal(
	shopId: string
): Promise<GarmentPipelineRPCResult> {
	const supabase = await createClient();

	const { data, error } = await supabase.rpc(
		'get_garment_pipeline_data_consolidated',
		{
			p_shop_id: shopId,
		}
	);

	if (error) {
		console.error('Error fetching garment pipeline via RPC:', error);
		throw new Error(`Failed to fetch garment pipeline data: ${error.message}`);
	}

	return data as unknown as GarmentPipelineRPCResult;
}

/**
 * Request-level cached garment pipeline RPC
 */
export const getGarmentPipelineRPC = cache(getGarmentPipelineRPCInternal);

/**
 * Data-level cached garment pipeline
 * Note: Cannot use unstable_cache due to cookies() dependency in Supabase client
 * Using React cache() for request-level deduplication
 */
export const getGarmentPipelineRPCCached = getGarmentPipelineRPC;

// ============================================================================
// CLIENT DETAIL DATA RPC
// ============================================================================

export interface ClientDetailRPCResult {
	client: any; // Client data
	orders: any[]; // Orders with garments and payments
	appointments: any[]; // Client appointments
	stats: {
		totalOrders: number;
		activeOrders: number;
		completedOrders: number;
		totalSpentCents: number;
		totalPaidCents: number;
		firstOrderDate: string | null;
		lastOrderDate: string | null;
	};
	calculatedAt: string;
}

/**
 * Get consolidated client detail data using RPC function
 * Replaces multiple client-related queries with single database call
 */
async function getClientDetailRPCInternal(
	clientId: string,
	shopId: string
): Promise<ClientDetailRPCResult> {
	const supabase = await createClient();

	// TODO: This RPC function doesn't exist yet - needs database migration
	// const { data, error } = await supabase.rpc(
	//   'get_client_detail_data_consolidated',
	//   {
	//     p_client_id: clientId,
	//     p_shop_id: shopId,
	//   }
	// );

	// Temporary placeholder until RPC function is created
	const data = null;
	const error = new Error('RPC function not implemented yet');

	if (error) {
		console.error('Error fetching client detail via RPC:', error);
		throw new Error(`Failed to fetch client detail data: ${error.message}`);
	}

	return data as unknown as ClientDetailRPCResult;
}

/**
 * Request-level cached client detail RPC
 * Client detail pages benefit from request-level caching
 */
export const getClientDetailRPC = cache(getClientDetailRPCInternal);

// ============================================================================
// DASHBOARD ALERTS RPC
// ============================================================================

export interface DashboardAlertsRPCResult {
	overdueData: {
		count: number;
		garments: Array<{
			id: string;
			name: string;
			dueDate: string;
			orderNumber: string;
			clientName: string;
			daysOverdue: number;
		}>;
	};
	dueTodayData: {
		count: number;
		garments: Array<{
			id: string;
			name: string;
			dueDate: string;
			orderNumber: string;
			clientName: string;
		}>;
	};
	calculatedAt: string;
}

/**
 * Get consolidated dashboard alerts using RPC function
 * Replaces separate overdue and due today queries
 */
async function getDashboardAlertsRPCInternal(
	shopId: string
): Promise<DashboardAlertsRPCResult> {
	const supabase = await createClient();

	const { data, error } = await supabase.rpc(
		'get_dashboard_alerts_consolidated',
		{
			p_shop_id: shopId,
		}
	);

	if (error) {
		console.error('Error fetching dashboard alerts via RPC:', error);
		throw new Error(`Failed to fetch dashboard alerts: ${error.message}`);
	}

	return data as unknown as DashboardAlertsRPCResult;
}

/**
 * Request-level cached dashboard alerts RPC
 */
export const getDashboardAlertsRPC = cache(getDashboardAlertsRPCInternal);

/**
 * Data-level cached dashboard alerts
 * Note: Cannot use unstable_cache due to cookies() dependency in Supabase client
 * Using React cache() for request-level deduplication
 */
export const getDashboardAlertsRPCCached = getDashboardAlertsRPC;

// ============================================================================
// CACHE INVALIDATION FOR RPC FUNCTIONS
// ============================================================================

/**
 * Invalidate all RPC-based caches
 * Call this when major data changes occur
 */
export async function invalidateAllRPCCaches() {
	const { revalidateTag } = await import('next/cache');
	revalidateTag('rpc-data');
}

/**
 * Invalidate business metrics RPC cache
 * Call this when payments, orders, or invoices are updated
 */
export async function invalidateBusinessMetricsRPCCache() {
	const { revalidateTag } = await import('next/cache');
	revalidateTag('business-health');
	revalidateTag('payments');
	revalidateTag('orders');
}

/**
 * Invalidate garment pipeline RPC cache
 * Call this when garments or their stages are updated
 */
export async function invalidateGarmentPipelineRPCCache() {
	const { revalidateTag } = await import('next/cache');
	revalidateTag('garments');
	revalidateTag('garment-stages');
}

/**
 * Invalidate dashboard alerts RPC cache
 * Call this when garment due dates or stages change
 */
export async function invalidateDashboardAlertsRPCCache() {
	const { revalidateTag } = await import('next/cache');
	revalidateTag('alerts');
	revalidateTag('due-dates');
	revalidateTag('garments');
}

// ============================================================================
// CONVERSION HELPERS
// ============================================================================

/**
 * Convert RPC business metrics to BusinessHealthData format
 * Maintains compatibility with existing dashboard components
 */
export async function convertRPCToBusinessHealthData(
	rpcData: BusinessMetricsRPCResult
): Promise<BusinessHealthData> {
	// Calculate percentage changes
	const monthOverMonthChange =
		rpcData.lastMonthRevenueCents > 0
			? ((rpcData.currentMonthRevenueCents - rpcData.lastMonthRevenueCents) /
					rpcData.lastMonthRevenueCents) *
				100
			: 0;

	const rolling30Change =
		rpcData.previous30RevenueCents > 0
			? ((rpcData.rolling30RevenueCents - rpcData.previous30RevenueCents) /
					rpcData.previous30RevenueCents) *
				100
			: 0;

	return {
		currentMonthRevenueCents: rpcData.currentMonthRevenueCents,
		lastMonthRevenueCents: rpcData.lastMonthRevenueCents,
		monthlyRevenueComparison: monthOverMonthChange,
		unpaidBalanceCents: rpcData.unpaidBalanceCents,
		unpaidOrdersCount: 0, // Would need separate query for this
		currentPeriodLabel: 'Current Month',
		comparisonPeriodLabel: 'Last Month',
		rolling30DayLabel: 'Last 30 Days',
		previous30DayLabel: 'Previous 30 Days',
		dailyAverageThisMonth:
			rpcData.currentMonthRevenueCents / new Date().getDate(),
		periodContext: 'mid' as const,
		transactionCount: 0, // Would need separate query for this
		rolling30DayRevenue: rpcData.rolling30RevenueCents,
		previous30DayRevenue: rpcData.previous30RevenueCents,
		rolling30DayComparison: rolling30Change,
	};
}

/**
 * Convert RPC alerts data to existing alert data formats
 * Maintains compatibility with existing alert components
 */
export async function convertRPCAlertsToExistingFormat(
	rpcData: DashboardAlertsRPCResult
): Promise<{
	overdueData: { count: number; garments: DashboardAlertGarment[] };
	dueTodayData: { count: number; garments: DashboardAlertGarment[] };
}> {
	return {
		overdueData: {
			count: rpcData.overdueData.count,
			garments: rpcData.overdueData.garments.map((g) => ({
				id: g.id,
				name: g.name,
				due_date: g.dueDate,
				order_number: g.orderNumber,
				client_name: g.clientName,
				days_overdue: g.daysOverdue,
			})),
		},
		dueTodayData: {
			count: rpcData.dueTodayData.count,
			garments: rpcData.dueTodayData.garments.map((g) => ({
				id: g.id,
				name: g.name,
				due_date: g.dueDate,
				order_number: g.orderNumber,
				client_name: g.clientName,
			})),
		},
	};
}
