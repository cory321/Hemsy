'use server';

import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { createStaticClient, hasServiceRoleKey } from '@/lib/supabase/static';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/supabase';

// ============================================================================
// OPTIMIZED STATIC DATA CACHING WITH SERVICE ROLE KEY
// ============================================================================
//
// This file provides an optimized approach for caching static data by using
// the service role key when available, which allows us to use unstable_cache
// since the service role client doesn't require cookies.
//
// Fallback Strategy:
// - Primary: Service role client + unstable_cache (persistent caching)
// - Fallback: Regular client + React cache (request-level caching)
// ============================================================================

type ShopHours = Database['public']['Tables']['shop_hours']['Row'];
type CalendarSettings =
  Database['public']['Tables']['calendar_settings']['Row'];
type Service = Database['public']['Tables']['services']['Row'];

// ============================================================================
// SHOP HOURS WITH SERVICE ROLE OPTIMIZATION
// ============================================================================

/**
 * Internal function to fetch shop hours using service role (no cookies)
 */
async function getShopHoursStaticInternal(
  shopId: string
): Promise<ShopHours[]> {
  const supabase = createStaticClient();

  const { data, error } = await supabase
    .from('shop_hours')
    .select('*')
    .eq('shop_id', shopId)
    .order('day_of_week', { ascending: true });

  if (error) {
    console.error('Error fetching shop hours (static):', error);
    throw new Error(`Failed to fetch shop hours: ${error.message}`);
  }

  return data || [];
}

/**
 * Internal function to fetch shop hours using regular client (with cookies)
 */
async function getShopHoursRegularInternal(
  shopId: string
): Promise<ShopHours[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('shop_hours')
    .select('*')
    .eq('shop_id', shopId)
    .order('day_of_week', { ascending: true });

  if (error) {
    console.error('Error fetching shop hours (regular):', error);
    throw new Error(`Failed to fetch shop hours: ${error.message}`);
  }

  return data || [];
}

/**
 * Optimized shop hours with persistent caching (when service role available)
 */
export const getShopHoursOptimized = hasServiceRoleKey()
  ? unstable_cache(getShopHoursStaticInternal, ['shop-hours-optimized'], {
      revalidate: 3600, // 1 hour TTL
      tags: ['shop-hours', 'static-data'],
    })
  : cache(getShopHoursRegularInternal);

// ============================================================================
// CALENDAR SETTINGS WITH SERVICE ROLE OPTIMIZATION
// ============================================================================

/**
 * Internal function to fetch calendar settings using service role (no cookies)
 */
async function getCalendarSettingsStaticInternal(
  shopId: string
): Promise<CalendarSettings | null> {
  const supabase = createStaticClient();

  const { data, error } = await supabase
    .from('calendar_settings')
    .select('*')
    .eq('shop_id', shopId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching calendar settings (static):', error);
    throw new Error(`Failed to fetch calendar settings: ${error.message}`);
  }

  return data;
}

/**
 * Internal function to fetch calendar settings using regular client (with cookies)
 */
async function getCalendarSettingsRegularInternal(
  shopId: string
): Promise<CalendarSettings | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('calendar_settings')
    .select('*')
    .eq('shop_id', shopId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching calendar settings (regular):', error);
    throw new Error(`Failed to fetch calendar settings: ${error.message}`);
  }

  return data;
}

/**
 * Optimized calendar settings with persistent caching (when service role available)
 */
export const getCalendarSettingsOptimized = hasServiceRoleKey()
  ? unstable_cache(
      getCalendarSettingsStaticInternal,
      ['calendar-settings-optimized'],
      {
        revalidate: 1800, // 30 minutes TTL
        tags: ['calendar-settings', 'settings', 'static-data'],
      }
    )
  : cache(getCalendarSettingsRegularInternal);

// ============================================================================
// SERVICE CATALOG WITH SERVICE ROLE OPTIMIZATION
// ============================================================================
//
// Note: This handles the service CATALOG (templates) from 'services' table.
// This is different from 'garment_services' which are actual services applied to garments.
//
// Service catalog = Shop's available service templates (what services they offer)
// Garment services = Actual services applied to specific garments (with pricing, completion status)
// ============================================================================

/**
 * Internal function to fetch service catalog using service role (no cookies)
 * Gets the shop's available service templates
 */
async function getServicesStaticInternal(shopId: string): Promise<Service[]> {
  const supabase = createStaticClient();

  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('shop_id', shopId)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching service catalog (static):', error);
    throw new Error(`Failed to fetch service catalog: ${error.message}`);
  }

  return data || [];
}

/**
 * Internal function to fetch service catalog using regular client (with cookies)
 * Gets the shop's available service templates
 */
async function getServicesRegularInternal(shopId: string): Promise<Service[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('shop_id', shopId)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching service catalog (regular):', error);
    throw new Error(`Failed to fetch service catalog: ${error.message}`);
  }

  return data || [];
}

/**
 * Optimized services with persistent caching (when service role available)
 */
export const getServicesOptimized = hasServiceRoleKey()
  ? unstable_cache(getServicesStaticInternal, ['services-optimized'], {
      revalidate: 900, // 15 minutes TTL
      tags: ['services', 'shop-data'],
    })
  : cache(getServicesRegularInternal);

// ============================================================================
// CACHE INVALIDATION FOR OPTIMIZED FUNCTIONS
// ============================================================================

/**
 * Invalidate optimized caches when data changes
 */
export async function invalidateOptimizedStaticCache() {
  if (hasServiceRoleKey()) {
    const { revalidateTag } = await import('next/cache');
    revalidateTag('static-data');
    revalidateTag('shop-data');
    revalidateTag('settings');
  } else {
    // Fallback to path revalidation for React cache
    const { revalidatePath } = await import('next/cache');
    revalidatePath('/dashboard');
  }
}

/**
 * Preload optimized static data
 */
export async function preloadOptimizedStaticData(shopId: string) {
  // Don't await - initiate cache warming
  void getShopHoursOptimized(shopId);
  void getCalendarSettingsOptimized(shopId);
  void getServicesOptimized(shopId);
}

// ============================================================================
// CAPABILITY DETECTION
// ============================================================================

/**
 * Check what caching capabilities are available
 */
export function getCachingCapabilities() {
  return {
    serviceRoleAvailable: hasServiceRoleKey(),
    persistentCachingEnabled: hasServiceRoleKey(),
    cachingStrategy: hasServiceRoleKey()
      ? 'unstable_cache with service role (persistent)'
      : 'React cache with cookies (request-level)',
  };
}
