'use server';

import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import type { Tables } from '@/types/supabase';
import { ensureUserAndShop } from './users';

export interface PaginatedClients {
  data: Tables<'clients'>[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ClientsFilters {
  search?: string;
  sortBy?: 'name' | 'created_at' | 'updated_at';
  sortOrder?: 'asc' | 'desc';
}

export async function getClients(
  page = 1,
  pageSize = 10,
  filters?: ClientsFilters
): Promise<PaginatedClients> {
  const { shop } = await ensureUserAndShop();
  const supabase = await createSupabaseClient();

  // Build the query
  let query = supabase
    .from('clients')
    .select('*', { count: 'exact' })
    .eq('shop_id', shop.id);

  // Apply search filter
  if (filters?.search) {
    const raw = String(filters.search).trim();
    const searchTerm = `%${raw}%`;

    // Base conditions: match single-field partials
    const conditions: string[] = [
      `first_name.ilike.${searchTerm}`,
      `last_name.ilike.${searchTerm}`,
      `email.ilike.${searchTerm}`,
      `phone_number.ilike.${searchTerm}`,
    ];

    // If user typed multiple words (e.g., "john doe"), also match as first+last tokens
    const tokens = raw.split(/\s+/).filter(Boolean);
    if (tokens.length >= 2) {
      const first = `%${tokens[0]}%`;
      const last = `%${tokens.slice(1).join(' ')}%`;
      // Match First Last
      conditions.push(`and(first_name.ilike.${first},last_name.ilike.${last})`);
      // Match Last First as well, for safety
      conditions.push(`and(first_name.ilike.${last},last_name.ilike.${first})`);
    }

    query = query.or(conditions.join(','));
  }

  // Apply sorting
  const sortBy = filters?.sortBy || 'created_at';
  const sortOrder = filters?.sortOrder || 'desc';
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  // Apply pagination
  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;
  query = query.range(start, end);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch clients: ${error.message}`);
  }

  return {
    data: data || [],
    count: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

export async function getClient(
  clientId: string
): Promise<Tables<'clients'> | null> {
  await ensureUserAndShop(); // Ensure user exists but we don't need shop for this query
  const supabase = await createSupabaseClient();

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch client: ${error.message}`);
  }

  return data;
}

export async function createClient(
  clientData: Omit<
    Tables<'clients'>,
    'id' | 'shop_id' | 'created_at' | 'updated_at'
  >
): Promise<Tables<'clients'>> {
  const { shop } = await ensureUserAndShop();
  const supabase = await createSupabaseClient();

  const { data, error } = await supabase
    .from('clients')
    .insert({
      ...clientData,
      shop_id: shop.id,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create client: ${error.message}`);
  }

  return data;
}

export async function updateClient(
  clientId: string,
  clientData: Partial<
    Omit<Tables<'clients'>, 'id' | 'shop_id' | 'created_at' | 'updated_at'>
  >
): Promise<Tables<'clients'>> {
  await ensureUserAndShop(); // Ensure user exists but we don't need shop for this update
  const supabase = await createSupabaseClient();

  const { data, error } = await supabase
    .from('clients')
    .update(clientData)
    .eq('id', clientId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update client: ${error.message}`);
  }

  return data;
}

export async function deleteClient(clientId: string): Promise<void> {
  await ensureUserAndShop(); // Ensure user exists but we don't need shop for this delete
  const supabase = await createSupabaseClient();

  const { error } = await supabase.from('clients').delete().eq('id', clientId);

  if (error) {
    throw new Error(`Failed to delete client: ${error.message}`);
  }
}

export async function getAllClients(): Promise<Tables<'clients'>[]> {
  const { shop } = await ensureUserAndShop();
  const supabase = await createSupabaseClient();

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('shop_id', shop.id)
    .order('first_name', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch clients: ${error.message}`);
  }

  return data || [];
}

export async function getClientOrders(clientId: string) {
  const { shop } = await ensureUserAndShop();
  const supabase = await createSupabaseClient();

  const { data: orders, error } = await supabase
    .from('orders')
    .select(
      `
      *,
      garments(id),
      client:clients(
        id,
        first_name,
        last_name
      )
    `
    )
    .eq('shop_id', shop.id)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch client orders: ${error.message}`);
  }

  const transformed = (orders || []).map((order) => ({
    ...order,
    garment_count: (order as any).garments?.length || 0,
    garments: undefined,
  }));

  return transformed;
}

export async function searchClients(
  searchTerm: string
): Promise<Tables<'clients'>[]> {
  if (!searchTerm || searchTerm.trim().length === 0) {
    return [];
  }

  try {
    const result = await getClients(1, 10, { search: searchTerm });
    return result.data;
  } catch (error) {
    console.error('Error searching clients:', error);
    return [];
  }
}
