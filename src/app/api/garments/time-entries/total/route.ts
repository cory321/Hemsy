import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';

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
      .select('id')
      .eq('garment_id', garmentId);
    if (servicesError) {
      return NextResponse.json(
        { error: servicesError.message },
        { status: 500 }
      );
    }
    const serviceIds = (services || []).map((s) => s.id);
    if (serviceIds.length === 0) return NextResponse.json({ total: 0 });

    const { data: entries, error: entriesError } = await supabase
      .from('garment_service_time_entries')
      .select('minutes')
      .in('service_id', serviceIds);
    if (entriesError) {
      return NextResponse.json(
        { error: entriesError.message },
        { status: 500 }
      );
    }

    const total = (entries || []).reduce((sum, e) => sum + (e.minutes || 0), 0);
    return NextResponse.json({ total });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
