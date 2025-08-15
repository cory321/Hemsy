import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { ensureUserAndShop } from '@/lib/actions/users';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10) || 1;
    const pageSize =
      parseInt(url.searchParams.get('pageSize') || '10', 10) || 10;
    const search = url.searchParams.get('search') || undefined;

    const { shop } = await ensureUserAndShop();
    const supabase = await createSupabaseClient();

    let query = supabase
      .from('clients')
      .select('*', { count: 'exact' })
      .eq('shop_id', shop.id);

    if (search && search.trim()) {
      const raw = String(search).trim();
      const searchTerm = `%${raw}%`;
      const conditions: string[] = [
        `first_name.ilike.${searchTerm}`,
        `last_name.ilike.${searchTerm}`,
        `email.ilike.${searchTerm}`,
        `phone_number.ilike.${searchTerm}`,
      ];
      const tokens = raw.split(/\s+/).filter(Boolean);
      if (tokens.length >= 2) {
        const first = `%${tokens[0]}%`;
        const last = `%${tokens.slice(1).join(' ')}%`;
        conditions.push(
          `and(first_name.ilike.${first},last_name.ilike.${last})`
        );
        conditions.push(
          `and(first_name.ilike.${last},last_name.ilike.${first})`
        );
      }
      query = query.or(conditions.join(','));
    }

    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;
    query = query.order('created_at', { ascending: false }).range(start, end);

    const { data, error, count } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: data || [],
      count: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
