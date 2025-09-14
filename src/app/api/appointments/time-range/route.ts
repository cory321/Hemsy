import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import type { Appointment } from '@/types';

// Enable Edge Runtime for better performance and caching
export const runtime = 'edge';

// Cache configuration - 5 minutes
export const revalidate = 300;

interface TimeRangeQuery {
  shopId: string;
  startDate: string;
  endDate: string;
  includeClient?: boolean;
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const shopId = searchParams.get('shopId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const includeClient = searchParams.get('includeClient') === 'true';

    // Validate required parameters
    if (!shopId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required parameters: shopId, startDate, endDate' },
        { status: 400 }
      );
    }

    // Validate date formats
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify shop ownership
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { data: shopData, error: shopError } = await supabase
      .from('shops')
      .select('id')
      .eq('id', shopId)
      .eq('owner_user_id', userData.id)
      .single();

    if (shopError || !shopData) {
      return NextResponse.json(
        { error: 'Shop not found or unauthorized' },
        { status: 403 }
      );
    }

    // Fetch appointments with client data directly
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(
        `
				*,
				client:clients(
					first_name,
					last_name,
					email,
					phone_number
				)
			`
      )
      .eq('shop_id', shopId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch appointments' },
        { status: 500 }
      );
    }

    // Transform the data to match our Appointment type
    const transformedAppointments = appointments.map((apt: any) => ({
      id: apt.id,
      shop_id: apt.shop_id,
      client_id: apt.client_id,
      order_id: apt.order_id,
      date: apt.date,
      start_time: apt.start_time,
      end_time: apt.end_time,
      type: apt.type,
      status: apt.status,
      notes: apt.notes,
      reminder_sent: apt.reminder_sent,
      created_at: apt.created_at,
      updated_at: apt.updated_at,
      ...(includeClient && apt.client
        ? {
            client: {
              id: apt.client_id,
              first_name: apt.client.first_name || '',
              last_name: apt.client.last_name || '',
              email: apt.client.email,
              phone_number: apt.client.phone_number,
              accept_email: true,
              accept_sms: true,
            },
          }
        : {}),
    }));

    // Return with cache headers for Edge Runtime
    return NextResponse.json(transformedAppointments, {
      headers: {
        'Cache-Control': `s-maxage=${revalidate}, stale-while-revalidate`,
        'CDN-Cache-Control': `max-age=${revalidate}`,
        'Vercel-CDN-Cache-Control': `max-age=${revalidate}`,
      },
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Prefetch endpoint for warming the cache
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse body for batch prefetch
    const body = await request.json();
    const { prefetchRanges } = body as {
      prefetchRanges: Array<{
        shopId: string;
        startDate: string;
        endDate: string;
      }>;
    };

    if (!prefetchRanges || !Array.isArray(prefetchRanges)) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Limit batch size to prevent abuse
    if (prefetchRanges.length > 5) {
      return NextResponse.json(
        { error: 'Too many ranges. Maximum 5 allowed.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify user
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Process each range
    const results = await Promise.all(
      prefetchRanges.map(async (range) => {
        try {
          // Verify shop ownership
          const { data: shopData, error: shopError } = await supabase
            .from('shops')
            .select('id')
            .eq('id', range.shopId)
            .eq('owner_user_id', userData.id)
            .single();

          if (shopError || !shopData) {
            return {
              ...range,
              status: 'error',
              error: 'Unauthorized',
            };
          }

          // Prefetch the data
          const { data, error } = await supabase
            .from('appointments')
            .select(
              `
							*,
							client:clients(
								first_name,
								last_name,
								email,
								phone_number
							)
						`
            )
            .eq('shop_id', range.shopId)
            .gte('date', range.startDate)
            .lte('date', range.endDate)
            .order('date', { ascending: true })
            .order('start_time', { ascending: true });

          if (error) {
            return {
              ...range,
              status: 'error',
              error: error.message,
            };
          }

          return {
            ...range,
            status: 'success',
            count: data.length,
          };
        } catch (error) {
          return {
            ...range,
            status: 'error',
            error: 'Failed to prefetch',
          };
        }
      })
    );

    return NextResponse.json({
      message: 'Prefetch completed',
      results,
    });
  } catch (error) {
    console.error('Prefetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
