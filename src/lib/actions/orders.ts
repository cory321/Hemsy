'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { assignDefaultGarmentNames } from '@/lib/utils/order-normalization';

// Dynamic import to avoid static cycles and ease testing
async function getUserAndShop() {
  const { ensureUserAndShop } = await import('@/lib/actions/users');
  return ensureUserAndShop();
}

// Schema definitions
const ServiceInlineSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  unit: z.enum(['item', 'hour', 'day', 'week']),
  unitPriceCents: z.number().int().min(0),
});

const ServiceLineSchema = z.object({
  quantity: z.number().int().min(1),
  unit: z.enum(['item', 'hour', 'day', 'week']),
  unitPriceCents: z.number().int().min(0),
  serviceId: z.string().uuid().optional(),
  inline: ServiceInlineSchema.optional(),
});

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

const GarmentInputSchema = z.object({
  // Name is optional; when omitted/blank we will assign a default like "Garment 1"
  name: z.string().optional(),
  notes: z.string().optional(),
  dueDate: z.string().regex(isoDateRegex).optional(),
  specialEvent: z.boolean().optional(),
  eventDate: z.string().regex(isoDateRegex).optional(),
  // Optional image fields from Cloudinary upload
  imageCloudId: z.string().min(1).optional(),
  imageUrl: z.string().url().optional(),
  services: z.array(ServiceLineSchema).min(1),
});

const CreateOrderInputSchema = z.object({
  clientId: z.string().uuid(),
  discountCents: z.number().int().min(0).default(0),
  garments: z.array(GarmentInputSchema).min(1),
  notes: z.string().optional(),
});

type CreateOrderInput = z.infer<typeof CreateOrderInputSchema>;

type FieldErrors = Record<string, string[]>;

function toFieldErrors(error: unknown): FieldErrors {
  if (error instanceof z.ZodError) {
    const out: FieldErrors = {};
    for (const issue of error.issues) {
      const path = issue.path.join('.') || 'root';
      if (!out[path]) out[path] = [];
      out[path].push(issue.message);
    }
    return out;
  }
  return { root: ['Unexpected error'] };
}

export async function createOrder(
  rawInput: unknown
): Promise<
  { success: true; orderId: string } | { success: false; errors: FieldErrors }
> {
  try {
    const input = CreateOrderInputSchema.parse(rawInput);

    // Normalize garment names to default values when empty
    const garmentsWithDefaultNames = assignDefaultGarmentNames<{
      name?: string | null;
      notes?: string;
      dueDate?: string;
      specialEvent?: boolean;
      eventDate?: string;
      imageCloudId?: string;
      imageUrl?: string;
      services: {
        quantity: number;
        unit: 'item' | 'hour' | 'day' | 'week';
        unitPriceCents: number;
        serviceId?: string;
        inline?: { name: string; description?: string };
      }[];
    }>(input.garments as any);

    const { shop } = await getUserAndShop();
    const supabase = await createSupabaseClient();

    // Insert order
    const { data: orderInsert, error: orderError } = await supabase
      .from('orders')
      .insert({
        shop_id: shop.id,
        client_id: input.clientId,
        status: 'new',
        discount_cents: input.discountCents ?? 0,
        notes: input.notes ?? null,
      })
      .select('id')
      .single();

    if (orderError || !orderInsert) {
      throw new Error(orderError?.message || 'Failed to create order');
    }

    const orderId = orderInsert.id as string;

    // Insert garments
    for (const garment of garmentsWithDefaultNames) {
      const eventDate = garment.specialEvent
        ? (garment.eventDate ?? null)
        : null;
      const dueDate = garment.dueDate ?? null;

      const { data: garmentIns, error: garmentErr } = await supabase
        .from('garments')
        .insert({
          order_id: orderId,
          name: garment.name,
          notes: garment.notes ?? null,
          event_date: eventDate,
          due_date: dueDate,
          stage: 'New',
          // Persist optional image fields
          image_cloud_id: garment.imageCloudId ?? null,
          photo_url: garment.imageUrl ?? null,
        })
        .select('id')
        .single();

      if (garmentErr || !garmentIns) {
        throw new Error(garmentErr?.message || 'Failed to add garment');
      }

      const garmentId = garmentIns.id as string;

      // Insert service lines for this garment
      for (const line of garment.services) {
        // Ensure name is populated even when using serviceId
        let name = line.inline?.name as string | undefined;
        if (!name && line.serviceId) {
          const { data: svc } = await supabase
            .from('services')
            .select('name')
            .eq('id', line.serviceId)
            .single();
          name = svc?.name;
        }

        // Ensure name is never undefined
        if (!name) {
          throw new Error('Service name is required');
        }

        const { error: lineErr } = await supabase
          .from('garment_services')
          .insert({
            garment_id: garmentId,
            service_id: line.serviceId ?? null,
            name,
            description: line.inline?.description ?? null,
            quantity: line.quantity,
            unit: line.unit,
            unit_price_cents: line.unitPriceCents,
          });

        if (lineErr) {
          throw new Error(lineErr.message || 'Failed to add service line');
        }
      }
    }

    // Revalidate and redirect handled by caller if desired
    try {
      revalidatePath('/orders');
    } catch {}

    return { success: true, orderId };
  } catch (error) {
    console.error('Order creation error:', error);
    // If it's a database error, provide more details
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return { success: false, errors: toFieldErrors(error) };
  }
}

// Utility to assign default garment names like "Garment 1", "Garment 2" when
// names are missing or blank. Exported for unit testing and reuse.
// Moved to '@/lib/utils/order-normalization' for reuse

export async function getFrequentlyUsedServices(): Promise<
  {
    id: string;
    name: string;
    default_unit: string;
    default_qty: number;
    default_unit_price_cents: number;
  }[]
> {
  const { shop } = await getUserAndShop();
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase
    .from('services')
    .select('id, name, default_unit, default_qty, default_unit_price_cents')
    .eq('shop_id', shop.id)
    .eq('frequently_used', true)
    .order('frequently_used_position', { ascending: true });
  if (error) throw new Error(error.message);
  return data as any;
}

export async function searchServices(query: string): Promise<
  {
    id: string;
    name: string;
    default_unit: string;
    default_qty: number;
    default_unit_price_cents: number;
  }[]
> {
  const { shop } = await getUserAndShop();
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase
    .from('services')
    .select('id, name, default_unit, default_qty, default_unit_price_cents')
    .eq('shop_id', shop.id)
    .ilike('name', `%${query}%`)
    .limit(10);
  if (error) throw new Error(error.message);
  return data as any;
}

const AddServiceInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  defaultUnit: z.enum(['item', 'hour', 'day', 'week']).default('item'),
  defaultQty: z.number().int().min(1).default(1),
  defaultUnitPriceCents: z.number().int().min(0).default(0),
  frequentlyUsed: z.boolean().optional(),
  frequentlyUsedPosition: z.number().int().min(1).max(8).optional(),
});

export async function addService(
  rawInput: unknown
): Promise<
  { success: true; serviceId: string } | { success: false; errors: FieldErrors }
> {
  try {
    const input = AddServiceInputSchema.parse(rawInput);
    const { shop } = await getUserAndShop();
    const supabase = await createSupabaseClient();

    const { data, error } = await supabase
      .from('services')
      .insert({
        shop_id: shop.id,
        name: input.name,
        description: input.description ?? null,
        default_unit: input.defaultUnit,
        default_qty: input.defaultQty,
        default_unit_price_cents: input.defaultUnitPriceCents,
        frequently_used: input.frequentlyUsed ?? false,
        frequently_used_position: input.frequentlyUsedPosition ?? null,
      })
      .select('id')
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to add service');
    }

    return { success: true, serviceId: data.id as string };
  } catch (error) {
    return { success: false, errors: toFieldErrors(error) };
  }
}

export async function createOrderAndRedirect(input: unknown) {
  const result = await createOrder(input);
  if (result.success) {
    try {
      revalidatePath('/orders');
    } catch {}
    // Don't redirect here - let the client handle navigation
    // redirect(`/orders/${result.orderId}`);
  }
  return result;
}

export async function submitOrderFromForm(formData: FormData) {
  'use server';
  try {
    const payloadRaw = formData.get('payload');
    if (!payloadRaw || typeof payloadRaw !== 'string') {
      console.error('Missing payload in formData');
      return { success: false, errors: { root: ['Missing payload'] } };
    }
    const payload = JSON.parse(payloadRaw);
    console.log('Parsed payload:', payload);
    const result = await createOrderAndRedirect(payload);
    console.log('createOrderAndRedirect result:', result);
    return result;
  } catch (e) {
    console.error('submitOrderFromForm error:', e);
    return { success: false, errors: { root: ['Invalid payload'] } };
  }
}

export async function getGarmentById(garmentId: string) {
  'use server';

  try {
    const { shop } = await getUserAndShop();
    const supabase = await createSupabaseClient();

    // Fetch garment with all related data
    const { data: garment, error: garmentError } = await supabase
      .from('garments')
      .select(
        `
        *,
        order:orders(
          id,
          order_number,
          status,
          client:clients(
            id,
            first_name,
            last_name,
            email,
            phone_number
          )
        ),
        garment_services(
          *,
          service:services(
            id,
            name,
            description
          )
        )
      `
      )
      .eq('id', garmentId)
      .single();

    if (garmentError) {
      console.error('Error fetching garment:', garmentError);
      throw new Error(garmentError.message);
    }

    // Verify the garment belongs to the current shop
    const { data: orderCheck } = await supabase
      .from('orders')
      .select('shop_id')
      .eq('id', garment.order_id)
      .single();

    if (!orderCheck || orderCheck.shop_id !== shop.id) {
      throw new Error('Garment not found or access denied');
    }

    // Calculate total price from garment services
    const totalPriceCents =
      garment.garment_services?.reduce((total: number, service: any) => {
        return total + service.quantity * service.unit_price_cents;
      }, 0) || 0;

    return {
      success: true,
      garment: {
        ...garment,
        totalPriceCents,
      },
    };
  } catch (error) {
    console.error('Error in getGarmentById:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch garment',
    };
  }
}
