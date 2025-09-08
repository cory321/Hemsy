'use server';

import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import type { Tables } from '@/types/supabase-extended';
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
  includeArchived?: boolean;
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

  // Filter archived clients unless explicitly requested
  if (!filters?.includeArchived) {
    query = query.eq('is_archived', false);
  }

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

/**
 * Detects and handles Supabase unique constraint violation errors
 */
function handleUniqueConstraintError(error: any): string | null {
  if (error?.code === '23505') {
    const message = error.message || '';

    // Check for email constraint violation
    if (message.includes('clients_shop_email_unique')) {
      return 'A client with this email address already exists';
    }

    // Check for phone constraint violation
    if (message.includes('clients_shop_phone_unique')) {
      return 'A client with this phone number already exists';
    }

    // Generic unique constraint error
    return 'A client with these details already exists';
  }

  return null;
}

export async function createClient(
  clientData: Omit<
    Tables<'clients'>,
    'id' | 'shop_id' | 'created_at' | 'updated_at'
  >
): Promise<
  { success: true; data: Tables<'clients'> } | { success: false; error: string }
> {
  try {
    const { shop } = await ensureUserAndShop();
    const supabase = await createSupabaseClient();

    // Try to insert directly - let the database constraints handle uniqueness
    // This is more efficient and avoids race conditions
    const { data, error } = await supabase
      .from('clients')
      .insert({
        ...clientData,
        shop_id: shop.id,
      })
      .select()
      .single();

    if (error) {
      // Check for unique constraint violations first
      const constraintError = handleUniqueConstraintError(error);
      if (constraintError) {
        return {
          success: false,
          error: constraintError,
        };
      }

      // Handle other errors
      return {
        success: false,
        error: `Failed to create client: ${error.message}`,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create client',
    };
  }
}

export async function updateClient(
  clientId: string,
  clientData: Partial<
    Omit<Tables<'clients'>, 'id' | 'shop_id' | 'created_at' | 'updated_at'>
  >
): Promise<
  { success: true; data: Tables<'clients'> } | { success: false; error: string }
> {
  try {
    await ensureUserAndShop(); // Ensure user exists but we don't need shop for this update
    const supabase = await createSupabaseClient();

    const { data, error } = await supabase
      .from('clients')
      .update(clientData)
      .eq('id', clientId)
      .select()
      .single();

    if (error) {
      // Check for unique constraint violations first
      const constraintError = handleUniqueConstraintError(error);
      if (constraintError) {
        return {
          success: false,
          error: constraintError,
        };
      }

      // Handle other errors
      return {
        success: false,
        error: `Failed to update client: ${error.message}`,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update client',
    };
  }
}

export async function archiveClient(clientId: string): Promise<void> {
  const { user } = await ensureUserAndShop();
  const supabase = await createSupabaseClient();

  const { error } = await supabase.rpc('archive_client', {
    p_client_id: clientId,
    p_user_id: user.id,
  });

  if (error) {
    throw new Error(`Failed to archive client: ${error.message}`);
  }
}

export async function restoreClient(clientId: string): Promise<void> {
  await ensureUserAndShop();
  const supabase = await createSupabaseClient();

  const { error } = await supabase.rpc('restore_client', {
    p_client_id: clientId,
  });

  if (error) {
    throw new Error(`Failed to restore client: ${error.message}`);
  }
}

// Kept for backwards compatibility - redirects to archiveClient
export async function deleteClient(clientId: string): Promise<void> {
  return archiveClient(clientId);
}

export async function getAllClients(
  includeArchived = false
): Promise<Tables<'clients'>[]> {
  const { shop } = await ensureUserAndShop();
  const supabase = await createSupabaseClient();

  let query = supabase.from('clients').select('*').eq('shop_id', shop.id);

  // Filter archived clients unless explicitly requested
  if (!includeArchived) {
    query = query.eq('is_archived', false);
  }

  const { data, error } = await query.order('first_name', { ascending: true });

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
  searchTerm: string,
  includeArchived = false
): Promise<Tables<'clients'>[]> {
  if (!searchTerm || searchTerm.trim().length === 0) {
    return [];
  }

  try {
    const result = await getClients(1, 10, {
      search: searchTerm,
      includeArchived,
    });
    return result.data;
  } catch (error) {
    console.error('Error searching clients:', error);
    return [];
  }
}

export async function getRecentClients(
  limit: number = 5
): Promise<Tables<'clients'>[]> {
  try {
    const { shop } = await ensureUserAndShop();
    const supabase = await createSupabaseClient();

    // Get clients with recent orders
    const { data, error } = await supabase
      .from('clients')
      .select(
        `
        *,
        orders!inner(
          id,
          created_at
        )
      `
      )
      .eq('shop_id', shop.id)
      .eq('is_archived', false) // Exclude archived clients
      .order('orders.created_at', { ascending: false })
      .limit(limit * 2); // Get more to handle duplicates

    if (error) {
      console.error('Failed to get recent clients with orders:', error);
      // Fallback to just getting most recent clients
      const { data: fallbackData } = await supabase
        .from('clients')
        .select('*')
        .eq('shop_id', shop.id)
        .eq('is_archived', false) // Exclude archived clients
        .order('created_at', { ascending: false })
        .limit(limit);

      return fallbackData || [];
    }

    // Remove duplicate clients and format response
    const uniqueClients = new Map();
    (data || []).forEach((item) => {
      if (!uniqueClients.has(item.id)) {
        const { orders, ...client } = item;
        uniqueClients.set(item.id, {
          ...client,
          last_order_date: orders?.[0]?.created_at,
        });
      }
    });

    return Array.from(uniqueClients.values()).slice(0, limit);
  } catch (error) {
    console.error('Failed to get recent clients:', error);
    return [];
  }
}

/**
 * Gets the count of active orders for a specific client.
 * Active orders include: 'new', 'in_progress', 'ready_for_pickup' statuses.
 * Excludes: 'completed' and 'cancelled' statuses.
 */
export async function getClientActiveOrdersCount(
  clientId: string
): Promise<number> {
  try {
    const { shop } = await ensureUserAndShop();
    const supabase = await createSupabaseClient();

    const { count, error } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('shop_id', shop.id)
      .eq('client_id', clientId)
      .in('status', ['new', 'in_progress', 'ready_for_pickup']);

    if (error) {
      console.error('Failed to get client active orders count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error getting client active orders count:', error);
    return 0;
  }
}

/**
 * Gets the total outstanding balance for a specific client across all their orders.
 * Outstanding balance = sum of (total_cents - paid_amount_cents) for all orders where the result is positive.
 * Negative balances (credits/overpayments) are excluded from the total.
 * Returns the amount in cents.
 */
export async function getClientOutstandingBalance(
  clientId: string
): Promise<number> {
  try {
    const { shop } = await ensureUserAndShop();
    const supabase = await createSupabaseClient();

    const { data, error } = await supabase
      .from('orders')
      .select('total_cents, paid_amount_cents')
      .eq('shop_id', shop.id)
      .eq('client_id', clientId);

    if (error) {
      console.error(
        'Failed to get client orders for outstanding balance:',
        error
      );
      return 0;
    }

    if (!data || data.length === 0) {
      return 0;
    }

    // Calculate outstanding balance for each order and sum only positive amounts
    const totalOutstanding = data.reduce((total, order) => {
      const orderOutstanding =
        (order.total_cents || 0) - (order.paid_amount_cents || 0);
      // Only include positive outstanding amounts (exclude credits/overpayments)
      return total + Math.max(0, orderOutstanding);
    }, 0);

    return totalOutstanding;
  } catch (error) {
    console.error('Error getting client outstanding balance:', error);
    return 0;
  }
}

/**
 * Gets the count of archived clients for a shop.
 * Used to determine whether to show the "Show Archived" toggle.
 */
export async function getArchivedClientsCount(): Promise<number> {
  try {
    const { shop } = await ensureUserAndShop();
    const supabase = await createSupabaseClient();

    const { count, error } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('shop_id', shop.id)
      .eq('is_archived', true);

    if (error) {
      console.error('Failed to get archived clients count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error getting archived clients count:', error);
    return 0;
  }
}
