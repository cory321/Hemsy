import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ensureUserAndShop } from '@/lib/actions/users';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { shop } = await ensureUserAndShop();

    if (!shop?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('shop_id', shop.id)
      .ilike('name', `%${query}%`)
      .order('frequently_used_position', { ascending: true, nullsFirst: false })
      .order('name', { ascending: true })
      .limit(20);

    if (error) {
      console.error('Error searching services:', error);
      return NextResponse.json(
        { error: 'Failed to search services' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
