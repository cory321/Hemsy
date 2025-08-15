import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { ensureUserAndShop } from '@/lib/actions/users';

// GET /api/garments/time-entries?garmentId=...
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const garmentId = url.searchParams.get('garmentId');
    if (!garmentId) {
      return NextResponse.json(
        { error: 'garmentId is required' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseClient();
    const { data: services, error: servicesError } = await supabase
      .from('garment_services')
      .select('id, name')
      .eq('garment_id', garmentId);
    if (servicesError) {
      return NextResponse.json(
        { error: servicesError.message },
        { status: 500 }
      );
    }
    const serviceIds = (services || []).map((s) => s.id);
    if (serviceIds.length === 0) return NextResponse.json([]);

    const { data: entries, error: entriesError } = await supabase
      .from('garment_service_time_entries')
      .select('id, service_id, minutes, logged_at')
      .in('service_id', serviceIds)
      .order('logged_at', { ascending: false });
    if (entriesError) {
      return NextResponse.json(
        { error: entriesError.message },
        { status: 500 }
      );
    }

    const serviceMap = new Map<string, string>();
    for (const svc of services || []) serviceMap.set(svc.id, (svc as any).name);
    const payload = (entries || []).map((e) => ({
      ...e,
      service_name: serviceMap.get(e.service_id) || 'Service',
    }));
    return NextResponse.json(payload);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET /api/garments/time-entries/total?garmentId=...
export async function HEAD() {}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serviceId, minutes } = body || {};
    if (!serviceId || !minutes || minutes <= 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    const { user } = await ensureUserAndShop();
    const supabase = await createSupabaseClient();
    const { error } = await supabase
      .from('garment_service_time_entries')
      .insert({ service_id: serviceId, minutes, created_by: user.id });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { entryId, minutes } = body || {};
    if (!entryId || !minutes || minutes <= 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    const supabase = await createSupabaseClient();
    const { error } = await supabase
      .from('garment_service_time_entries')
      .update({ minutes })
      .eq('id', entryId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const entryId = url.searchParams.get('entryId');
    if (!entryId) {
      return NextResponse.json(
        { error: 'entryId is required' },
        { status: 400 }
      );
    }
    const supabase = await createSupabaseClient();
    const { error } = await supabase
      .from('garment_service_time_entries')
      .delete()
      .eq('id', entryId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
