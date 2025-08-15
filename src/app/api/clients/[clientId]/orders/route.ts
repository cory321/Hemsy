import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { ensureUserAndShop } from '@/lib/actions/users';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params;
    if (!clientId) {
      return NextResponse.json(
        { error: 'clientId is required' },
        { status: 400 }
      );
    }

    const { shop } = await ensureUserAndShop();
    const supabase = await createSupabaseClient();

    const { data: orders, error: ordersError } = await supabase
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

    if (ordersError) {
      return NextResponse.json({ error: ordersError.message }, { status: 500 });
    }

    const transformed = (orders || []).map((order) => ({
      ...order,
      garment_count: (order as any).garments?.length || 0,
      garments: undefined,
    }));

    return NextResponse.json({ orders: transformed });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
