import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { ensureUserAndShop } from '@/lib/actions/users';

export async function GET(_request: NextRequest) {
  try {
    const { shop } = await ensureUserAndShop();
    const supabase = await createSupabaseClient();
    const { data, error } = await supabase
      .from('services')
      .select('id, name, default_unit, default_qty, default_unit_price_cents')
      .eq('shop_id', shop.id)
      .eq('frequently_used', true)
      .order('frequently_used_position', { ascending: true });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data || []);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
