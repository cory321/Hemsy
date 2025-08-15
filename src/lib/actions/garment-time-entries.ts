'use server';

import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { ensureUserAndShop } from './users';

export async function addTimeEntry(serviceId: string, minutes: number) {
  const { user } = await ensureUserAndShop();
  const supabase = await createSupabaseClient();

  const { error } = await supabase
    .from('garment_service_time_entries')
    .insert({ service_id: serviceId, minutes, created_by: user.id });

  if (error) throw new Error(error.message);
}

export async function getTotalTimeForGarment(
  garmentId: string
): Promise<number> {
  const supabase = await createSupabaseClient();

  const { data: services, error: servicesError } = await supabase
    .from('garment_services')
    .select('id')
    .eq('garment_id', garmentId);

  if (servicesError) throw new Error(servicesError.message);
  const serviceIds = (services || []).map((s) => s.id);
  if (serviceIds.length === 0) return 0;

  const { data: entries, error: entriesError } = await supabase
    .from('garment_service_time_entries')
    .select('minutes')
    .in('service_id', serviceIds);

  if (entriesError) throw new Error(entriesError.message);

  return (entries || []).reduce((sum, e) => sum + (e.minutes || 0), 0);
}

export async function getTimeEntriesForGarment(garmentId: string) {
  const supabase = await createSupabaseClient();

  const { data: services, error: servicesError } = await supabase
    .from('garment_services')
    .select('id, name')
    .eq('garment_id', garmentId);

  if (servicesError) throw new Error(servicesError.message);
  const serviceIds = (services || []).map((s) => s.id);
  if (serviceIds.length === 0) return [];

  const { data: entries, error: entriesError } = await supabase
    .from('garment_service_time_entries')
    .select('id, service_id, minutes, logged_at')
    .in('service_id', serviceIds)
    .order('logged_at', { ascending: false });

  if (entriesError) throw new Error(entriesError.message);

  const serviceMap = new Map<string, string>();
  for (const svc of services || []) serviceMap.set(svc.id, (svc as any).name);

  return (entries || []).map((e) => ({
    ...e,
    service_name: serviceMap.get(e.service_id) || 'Service',
  }));
}

export async function updateTimeEntry(entryId: string, minutes: number) {
  const supabase = await createSupabaseClient();
  const { error } = await supabase
    .from('garment_service_time_entries')
    .update({ minutes })
    .eq('id', entryId);
  if (error) throw new Error(error.message);
}

export async function deleteTimeEntry(entryId: string) {
  const supabase = await createSupabaseClient();
  const { error } = await supabase
    .from('garment_service_time_entries')
    .delete()
    .eq('id', entryId);
  if (error) throw new Error(error.message);
}
