import { NextRequest, NextResponse } from 'next/server';
import { createOrder } from '@/lib/actions/orders';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const result = await createOrder(payload);
    return NextResponse.json(result, { status: result.success ? 201 : 400 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
