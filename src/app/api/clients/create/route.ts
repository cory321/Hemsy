import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { ensureUserAndShop } from '@/lib/actions/users';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      first_name,
      last_name,
      email,
      phone_number,
      accept_email,
      accept_sms,
      notes,
      mailing_address,
    } = body || {};

    if (!first_name || !last_name || !email || !phone_number) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { shop } = await ensureUserAndShop();
    const supabase = await createSupabaseClient();

    const { data, error } = await supabase
      .from('clients')
      .insert({
        shop_id: shop.id,
        first_name,
        last_name,
        email,
        phone_number,
        accept_email: !!accept_email,
        accept_sms: !!accept_sms,
        notes: notes || null,
        mailing_address: mailing_address || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
