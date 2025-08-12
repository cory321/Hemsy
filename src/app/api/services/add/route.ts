import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/actions/users';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      default_qty,
      default_unit,
      default_unit_price_cents,
    } = body;

    if (
      !name ||
      !default_unit ||
      typeof default_unit_price_cents !== 'number'
    ) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: name, default_unit, and default_unit_price_cents are required',
        },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServer();
    const user = await getCurrentUser();

    if (!user?.shopId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('services')
      .insert({
        shop_id: user.shopId,
        name,
        description: description || null,
        default_qty: default_qty || 1,
        default_unit,
        default_unit_price_cents,
        frequently_used: false,
        frequently_used_position: null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding service:', error);
      return NextResponse.json(
        { error: 'Failed to add service' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
