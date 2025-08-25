import { NextRequest, NextResponse } from 'next/server';
import { createPaymentIntent } from '@/lib/actions/payments';
import { z } from 'zod';

const CreateIntentSchema = z.object({
  invoiceId: z.string().uuid(),
  paymentType: z.enum(['deposit', 'remainder', 'full']),
  amountCents: z.number().int().positive().optional(),
  metadata: z.record(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = CreateIntentSchema.parse(body);

    const result = await createPaymentIntent({
      invoiceId: validated.invoiceId,
      paymentType: validated.paymentType,
      amountCents: validated.amountCents,
    });

    if (result.success && result.data) {
      return NextResponse.json({
        clientSecret: result.data.clientSecret,
        paymentIntentId: result.data.paymentIntentId,
        amountCents: result.data.amountCents,
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to create payment intent' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Payment intent creation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
