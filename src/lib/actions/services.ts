'use server';

import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { ensureUserAndShop } from './users';
import { revalidatePath } from 'next/cache';

export async function searchServices(query: string) {
  const { shop } = await ensureUserAndShop();
  const supabase = await createSupabaseClient();

  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('shop_id', shop.id)
    .ilike('name', `%${query}%`)
    .order('frequently_used_position', { ascending: true, nullsFirst: false })
    .order('name', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function addService(service: {
  name: string;
  description?: string;
  default_qty: number;
  default_unit: string;
  default_unit_price_cents: number;
  frequently_used?: boolean;
  frequently_used_position?: number;
}) {
  const { shop } = await ensureUserAndShop();
  const supabase = await createSupabaseClient();

  const { data, error } = await supabase
    .from('services')
    .insert({
      shop_id: shop.id,
      name: service.name,
      description: service.description || null,
      default_qty: service.default_qty,
      default_unit: service.default_unit,
      default_unit_price_cents: service.default_unit_price_cents,
      frequently_used: service.frequently_used || false,
      frequently_used_position: service.frequently_used_position || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/services');
  return data;
}

export async function editService(
  id: string,
  updatedService: {
    name: string;
    description?: string;
    default_qty: number;
    default_unit: string;
    default_unit_price_cents: number;
    frequently_used?: boolean;
    frequently_used_position?: number;
  }
) {
  const { shop } = await ensureUserAndShop();
  const supabase = await createSupabaseClient();

  const { data, error } = await supabase
    .from('services')
    .update({
      name: updatedService.name,
      description: updatedService.description || null,
      default_qty: updatedService.default_qty,
      default_unit: updatedService.default_unit,
      default_unit_price_cents: updatedService.default_unit_price_cents,
      frequently_used: updatedService.frequently_used || false,
      frequently_used_position: updatedService.frequently_used_position || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('shop_id', shop.id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/services');
  return data;
}

export async function deleteService(id: string) {
  const { shop } = await ensureUserAndShop();
  const supabase = await createSupabaseClient();

  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', id)
    .eq('shop_id', shop.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/services');
  return id;
}

export async function fetchAllServices() {
  const { shop } = await ensureUserAndShop();
  const supabase = await createSupabaseClient();

  const { data: services, error } = await supabase
    .from('services')
    .select('*')
    .eq('shop_id', shop.id)
    .order('frequently_used_position', { ascending: true, nullsFirst: false })
    .order('name', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return services || [];
}

export async function getFrequentlyUsedServices() {
  const { shop } = await ensureUserAndShop();
  const supabase = await createSupabaseClient();

  const { data, error } = await supabase
    .from('services')
    .select('id, name, default_unit, default_qty, default_unit_price_cents')
    .eq('shop_id', shop.id)
    .eq('frequently_used', true)
    .order('frequently_used_position', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

export async function duplicateService(id: string) {
  const { shop } = await ensureUserAndShop();
  const supabase = await createSupabaseClient();

  // Fetch the service by ID
  const { data: service, error: fetchError } = await supabase
    .from('services')
    .select('*')
    .eq('id', id)
    .eq('shop_id', shop.id)
    .single();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  if (!service) {
    throw new Error('Service not found');
  }

  // Remove the id field to allow the database to generate a new one
  const { id: _, created_at, updated_at, ...serviceData } = service;

  // Insert the duplicated service
  const { data: duplicatedService, error: insertError } = await supabase
    .from('services')
    .insert({
      ...serviceData,
      name: `${service.name} (Copy)`,
      frequently_used: false,
      frequently_used_position: null,
    })
    .select()
    .single();

  if (insertError) {
    throw new Error(insertError.message);
  }

  revalidatePath('/services');
  return duplicatedService;
}

export async function updateFrequentlyUsedServices(
  services: Array<{ id: string; position: number }>
) {
  const { shop } = await ensureUserAndShop();
  const supabase = await createSupabaseClient();

  // First, reset all services to not frequently used
  const { error: resetError } = await supabase
    .from('services')
    .update({
      frequently_used: false,
      frequently_used_position: null,
    })
    .eq('shop_id', shop.id);

  if (resetError) {
    throw new Error(resetError.message);
  }

  // Then update the frequently used services
  for (const service of services) {
    const { error } = await supabase
      .from('services')
      .update({
        frequently_used: true,
        frequently_used_position: service.position,
      })
      .eq('id', service.id)
      .eq('shop_id', shop.id);

    if (error) {
      throw new Error(error.message);
    }
  }

  revalidatePath('/services');
  return true;
}
