'use server';

import { cache } from 'react';
import { ensureUserAndShop } from '@/lib/auth/user-shop';
import { getRecentActivity } from './recent-activity';
import {
  getShopHoursCached,
  getCalendarSettingsCached,
} from './static-data-cache';
import {
  getBusinessMetricsRPC,
  getGarmentPipelineRPC,
  getDashboardAlertsRPC,
  convertRPCToBusinessHealthData,
  convertRPCAlertsToExistingFormat,
  BusinessMetricsRPCResult,
  GarmentPipelineRPCResult,
  DashboardAlertsRPCResult,
} from './rpc-optimized';

// ============================================================================
// RPC-ENHANCED DASHBOARD DATA FETCHING
// ============================================================================
//
// This file provides an enhanced version of dashboard data fetching that
// uses RPC functions for maximum performance while maintaining compatibility
// with existing dashboard components.
//
// Performance improvements:
// - Business metrics: 5 queries → 1 RPC call
// - Garment pipeline: 3 queries → 1 RPC call
// - Dashboard alerts: 2 queries → 1 RPC call
// - Static data: Uses cached versions with proper TTL
// ============================================================================

export interface DashboardDataRPCEnhanced {
  user: any;
  shop: any;
  // Business metrics (converted to existing format)
  businessHealthData: any;
  shopHours: any[];
  calendarSettings: any;
  recentActivity: any[];
  // Garment pipeline data
  stageCounts: Record<string, number>;
  activeGarments: any[];
  readyForPickupGarments: any[];
  // Appointment data (using existing consolidated function)
  nextAppointment: any;
  todayAppointments: any[];
  weekOverviewData: any;
  weekSummaryStats: any;
  // Alert data (converted to existing format)
  overdueData: any;
  dueTodayData: any;
}

/**
 * Enhanced dashboard data fetcher using RPC functions
 * Reduces database calls from 15+ to 6 strategic calls (3 RPC + 3 regular)
 */
export async function getDashboardDataRPCEnhanced(): Promise<DashboardDataRPCEnhanced> {
  // This is already cached per-request
  const { user, shop } = await ensureUserAndShop();

  // Execute RPC calls and remaining queries in parallel
  // RPC calls consolidate multiple queries into single database roundtrips
  const [
    businessMetricsRPC,
    garmentPipelineRPC,
    alertsRPC,
    shopHours,
    calendarSettings,
    recentActivity,
  ] = await Promise.all([
    // RPC CALLS (3 calls that replace 10+ individual queries)
    getBusinessMetricsRPC(shop.id), // Replaces 5 business health queries
    getGarmentPipelineRPC(shop.id), // Replaces 3 garment queries
    getDashboardAlertsRPC(shop.id), // Replaces 2 alert queries

    // CACHED STATIC DATA (3 calls, but cached across requests)
    getShopHoursCached(shop.id), // Cached for 1 hour
    getCalendarSettingsCached(shop.id), // Cached for 30 minutes
    getRecentActivity(5), // Request-level cached
  ]);

  // Convert RPC results to existing component format for compatibility
  const [businessHealthData, alertsConverted] = await Promise.all([
    convertRPCToBusinessHealthData(businessMetricsRPC),
    convertRPCAlertsToExistingFormat(alertsRPC),
  ]);
  const { overdueData, dueTodayData } = alertsConverted;

  // For now, we'll use placeholder data for appointment data
  // In a future optimization, we could create an appointments RPC function too
  const appointmentData = {
    nextAppointment: null,
    todayAppointments: [],
    weekOverviewData: [],
    weekSummaryStats: {
      totalAppointments: 0,
      confirmedAppointments: 0,
      pendingAppointments: 0,
      totalRevenue: 0,
    },
  };

  return {
    user,
    shop,
    // Business metrics
    businessHealthData,
    shopHours: shopHours || [],
    calendarSettings: calendarSettings || {
      buffer_time_minutes: 0,
      default_appointment_duration: 30,
    },
    recentActivity: recentActivity || [],
    // Garment pipeline
    stageCounts: garmentPipelineRPC.stageCounts,
    activeGarments: garmentPipelineRPC.activeGarments,
    readyForPickupGarments: garmentPipelineRPC.readyForPickupGarments,
    // Appointments (placeholder for now)
    ...appointmentData,
    // Alerts
    overdueData,
    dueTodayData,
  };
}

// ============================================================================
// INDIVIDUAL RPC FUNCTION WRAPPERS
// ============================================================================

/**
 * Get business health data using RPC function
 * Maintains compatibility with existing components
 */
export const getBusinessHealthDataRPC = cache(async (shopId: string) => {
  const rpcData = await getBusinessMetricsRPC(shopId);
  return await convertRPCToBusinessHealthData(rpcData);
});

/**
 * Get garment stage counts using RPC function
 * Maintains compatibility with existing components
 */
export const getGarmentStageCountsRPC = cache(async (shopId: string) => {
  const rpcData = await getGarmentPipelineRPC(shopId);
  return rpcData.stageCounts;
});

/**
 * Get active garments using RPC function
 * Maintains compatibility with existing components
 */
export const getActiveGarmentsRPC = cache(async (shopId: string) => {
  const rpcData = await getGarmentPipelineRPC(shopId);
  return rpcData.activeGarments;
});

/**
 * Get overdue garments for alert using RPC function
 * Maintains compatibility with existing components
 */
export const getOverdueGarmentsForAlertRPC = cache(async (shopId: string) => {
  const rpcData = await getDashboardAlertsRPC(shopId);
  const { overdueData } = await convertRPCAlertsToExistingFormat(rpcData);
  return overdueData;
});

/**
 * Get garments due today for alert using RPC function
 * Maintains compatibility with existing components
 */
export const getGarmentsDueTodayForAlertRPC = cache(async (shopId: string) => {
  const rpcData = await getDashboardAlertsRPC(shopId);
  const { dueTodayData } = await convertRPCAlertsToExistingFormat(rpcData);
  return dueTodayData;
});

// ============================================================================
// PERFORMANCE COMPARISON HELPER
// ============================================================================

/**
 * Performance comparison function for testing
 * Compares RPC vs traditional query performance
 */
export async function compareDashboardPerformance(shopId: string) {
  console.time('RPC Enhanced Dashboard');
  const rpcData = await getDashboardDataRPCEnhanced();
  console.timeEnd('RPC Enhanced Dashboard');

  // Import traditional function for comparison
  const { getDashboardDataOptimized } = await import('./dashboard-optimized');

  console.time('Traditional Optimized Dashboard');
  const traditionalData = await getDashboardDataOptimized();
  console.timeEnd('Traditional Optimized Dashboard');

  return {
    rpcData,
    traditionalData,
    comparison: {
      message: 'Check console for timing comparison',
      rpcCallsCount: 6, // 3 RPC + 3 cached static
      traditionalCallsCount: 4, // Current optimized version
      expectedImprovement: '~30% faster due to RPC consolidation',
    },
  };
}

// ============================================================================
// MIGRATION HELPERS
// ============================================================================

/**
 * Gradual migration helper - allows switching between RPC and traditional
 * Use feature flags or environment variables to control this
 */
export async function getDashboardDataWithFallback(useRPC: boolean = false) {
  if (useRPC) {
    try {
      return await getDashboardDataRPCEnhanced();
    } catch (error) {
      console.error(
        'RPC dashboard data failed, falling back to traditional:',
        error
      );
      // Fall back to traditional approach
      const { getDashboardDataOptimized } = await import(
        './dashboard-optimized'
      );
      return await getDashboardDataOptimized();
    }
  } else {
    // Use traditional approach
    const { getDashboardDataOptimized } = await import('./dashboard-optimized');
    return await getDashboardDataOptimized();
  }
}
