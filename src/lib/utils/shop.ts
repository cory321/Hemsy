import type { Tables } from '@/types/supabase';

export function getShopDisplayName(shop: Tables<'shops'>): string {
  return (shop as any).business_name || shop.name;
}
