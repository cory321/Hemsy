'use server';

import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/supabase';

// ============================================================================
// STRATEGIC DATA-LEVEL CACHING
// ============================================================================
//
// This file implements data-level caching using unstable_cache for static data
// that doesn't require authentication context. This allows us to cache data
// across requests with proper TTL and tags for invalidation.
//
// Key Strategy:
// - Use unstable_cache for static/semi-static data (shop hours, services, settings)
// - Use React cache() for auth-dependent dynamic data (in other files)
// - Implement proper cache invalidation with tags
// ============================================================================

type ShopHours = Database['public']['Tables']['shop_hours']['Row'];
type CalendarSettings =
  Database['public']['Tables']['calendar_settings']['Row'];
type Service = Database['public']['Tables']['services']['Row'];

// ============================================================================
// SHOP HOURS CACHING (Static data - changes rarely)
// ============================================================================

/**
 * Internal function to fetch shop hours (not cached)
 */
async function getShopHoursInternal(shopId: string): Promise<ShopHours[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('shop_hours')
    .select('*')
    .eq('shop_id', shopId)
    .order('day_of_week', { ascending: true });

  if (error) {
    console.error('Error fetching shop hours:', error);
    throw new Error(`Failed to fetch shop hours: ${error.message}`);
  }

  return data || [];
}

/**
 * Request-level cached shop hours
 * Note: Cannot use unstable_cache due to cookies() dependency in Supabase client
 */
export const getShopHours = cache(async (shopId: string) => {
  return getShopHoursInternal(shopId);
});

// Alias for backwards compatibility
export const getShopHoursCached = getShopHours;

// ============================================================================
// CALENDAR SETTINGS CACHING (Semi-static data - changes occasionally)
// ============================================================================

/**
 * Internal function to fetch calendar settings (not cached)
 */
async function getCalendarSettingsInternal(
  shopId: string
): Promise<CalendarSettings | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('calendar_settings')
    .select('*')
    .eq('shop_id', shopId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching calendar settings:', error);
    throw new Error(`Failed to fetch calendar settings: ${error.message}`);
  }

  return data;
}

/**
 * Request-level cached calendar settings
 * Note: Cannot use unstable_cache due to cookies() dependency in Supabase client
 */
export const getCalendarSettings = cache(async (shopId: string) => {
  return getCalendarSettingsInternal(shopId);
});

// Alias for backwards compatibility
export const getCalendarSettingsCached = getCalendarSettings;

// ============================================================================
// SERVICES CATALOG CACHING (Semi-static data - service templates/catalog)
// ============================================================================
//
// Note: This fetches the service catalog (templates) from the 'services' table,
// not the actual services applied to garments (which are in 'garment_services').
//
// Service catalog = shop's available services (templates)
// Garment services = actual services applied to specific garments
// ============================================================================

/**
 * Internal function to fetch service catalog (not cached)
 * This gets the shop's available service templates, not garment-specific services
 */
async function getServicesInternal(shopId: string): Promise<Service[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('shop_id', shopId)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching service catalog:', error);
    throw new Error(`Failed to fetch service catalog: ${error.message}`);
  }

  return data || [];
}

/**
 * Request-level cached service catalog
 * Note: Cannot use unstable_cache due to cookies() dependency in Supabase client
 * This gets the shop's service catalog (templates), not garment-specific services
 */
export const getServices = cache(async (shopId: string) => {
  return getServicesInternal(shopId);
});

// Alias for backwards compatibility
export const getServicesCached = getServices;

// ============================================================================
// CACHE INVALIDATION HELPERS
// ============================================================================

/**
 * Invalidate shop hours cache when shop hours are updated
 * Note: Since we're using React cache(), invalidation happens automatically per request
 * These functions are kept for future use when unstable_cache becomes compatible
 */
export async function invalidateShopHoursCache() {
  // Currently using React cache() which auto-invalidates per request
  // Future: Add revalidateTag when unstable_cache becomes compatible
  const { revalidatePath } = await import('next/cache');
  revalidatePath('/dashboard');
}

/**
 * Invalidate calendar settings cache when settings are updated
 */
export async function invalidateCalendarSettingsCache() {
  const { revalidatePath } = await import('next/cache');
  revalidatePath('/dashboard');
}

/**
 * Invalidate services cache when services are updated
 */
export async function invalidateServicesCache() {
  const { revalidatePath } = await import('next/cache');
  revalidatePath('/dashboard');
  revalidatePath('/orders');
}

/**
 * Invalidate all static data caches
 */
export async function invalidateAllStaticDataCache() {
  const { revalidatePath } = await import('next/cache');
  revalidatePath('/dashboard');
  revalidatePath('/orders');
  revalidatePath('/garments');
}

// ============================================================================
// PRELOAD FUNCTIONS FOR LAYOUT-LEVEL OPTIMIZATION
// ============================================================================

/**
 * Preload shop hours in layout or parent components
 * This initiates the cache fetch without awaiting it
 */
export async function preloadShopHours(shopId: string) {
  void getShopHours(shopId);
}

/**
 * Preload calendar settings in layout or parent components
 */
export async function preloadCalendarSettings(shopId: string) {
  void getCalendarSettings(shopId);
}

/**
 * Preload services in layout or parent components
 */
export async function preloadServices(shopId: string) {
  void getServices(shopId);
}

/**
 * Preload all commonly needed static data
 * Use this in app layout for maximum performance
 * Note: Uses React cache() for request-level deduplication only
 */
export async function preloadAllStaticData(shopId: string) {
  // Don't await these - we want them to run in background
  void preloadShopHours(shopId);
  void preloadCalendarSettings(shopId);
  void preloadServices(shopId);
}
