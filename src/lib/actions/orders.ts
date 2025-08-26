'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { assignDefaultGarmentNames } from '@/lib/utils/order-normalization';
import { ensureUserAndShop } from './users';
import type { Tables } from '@/types/supabase';

export interface PaginatedOrders {
  data: Array<
    Omit<Tables<'orders'>, 'paid_amount_cents'> & {
      client: {
        id: string;
        first_name: string;
        last_name: string;
        phone_number?: string | null;
      } | null;
      garments: Array<{
        id: string;
        name?: string | null;
        stage?: string | null;
        due_date?: string | null;
        event_date?: string | null;
        image_cloud_id?: string | null;
        photo_url?: string | null;
        preset_icon_key?: string | null;
        preset_fill_color?: string | null;
      }>;
      invoices?: Array<{
        id: string;
        status: string | null;
        amount_cents: number;
        payments?: Array<{
          id: string;
          amount_cents: number;
          status: string;
          payment_method: string;
        }>;
      }>;
      paid_amount_cents?: number;
    }
  >;
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface OrdersFilters {
  search?: string;
  status?: string;
  sortBy?: 'created_at' | 'order_due_date' | 'total_cents' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export async function getOrdersPaginated(
  page = 1,
  pageSize = 10,
  filters?: OrdersFilters
): Promise<PaginatedOrders> {
  const { shop } = await ensureUserAndShop();
  const supabase = await createSupabaseClient();

  // Build the base query with invoice and payment data
  let query = supabase
    .from('orders')
    .select(
      `
      *,
      client:clients(id, first_name, last_name, phone_number),
      garments(id, name, stage, due_date, event_date, image_cloud_id, photo_url, preset_icon_key, preset_fill_color),
      invoices(
        id,
        status,
        amount_cents,
        payments(
          id,
          amount_cents,
          status,
          payment_method
        )
      )
    `,
      { count: 'exact' }
    )
    .eq('shop_id', shop.id);

  // Apply search filter
  if (filters?.search) {
    const searchTerm = `%${filters.search.trim()}%`;

    // Search in order number, client name, or notes
    query = query.or(
      `order_number.ilike.${searchTerm},notes.ilike.${searchTerm}`
    );
  }

  // Apply status filter
  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  // Apply sorting
  const sortBy = filters?.sortBy || 'created_at';
  const sortOrder = filters?.sortOrder || 'desc';
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  // Apply pagination
  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;
  query = query.range(start, end);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch orders: ${error.message}`);
  }

  // Calculate paid amount from invoice payments
  const ordersWithPaymentInfo = (data || []).map((order) => {
    let paidAmount = 0;

    // Calculate from actual invoice payments
    if (order.invoices && order.invoices.length > 0) {
      order.invoices.forEach((invoice: any) => {
        if (invoice.payments) {
          invoice.payments.forEach((payment: any) => {
            if (payment.status === 'completed') {
              paidAmount += payment.amount_cents || 0;
            }
          });
        }
      });
    }

    // Add the calculated paid_amount_cents
    return {
      ...order,
      paid_amount_cents: paidAmount,
    };
  });

  return {
    data: ordersWithPaymentInfo,
    count: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

// Schema definitions
const ServiceInlineSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

const ServiceLineSchema = z.object({
  quantity: z.number().int().min(1),
  unit: z.enum(['flat_rate', 'hour', 'day']),
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
  // Optional preset icon key selected by user
  presetIconKey: z.string().optional(),
  // Optional fill color for parameterized SVGs (outline will be derived)
  presetFillColor: z
    .string()
    .regex(/^#?[0-9a-fA-F]{3,8}$/)
    .optional(),
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
      presetIconKey?: string;
      presetFillColor?: string;
      services: {
        quantity: number;
        unit: 'flat_rate' | 'hour' | 'day';
        unitPriceCents: number;
        serviceId?: string;
        inline?: { name: string; description?: string };
      }[];
    }>(input.garments as any);

    const { shop } = await ensureUserAndShop();
    const supabase = await createSupabaseClient();

    // Generate order number per shop
    const { data: orderNumberData, error: orderNumberError } =
      await supabase.rpc('generate_order_number', { p_shop_id: shop.id });

    if (orderNumberError || !orderNumberData) {
      throw new Error(
        orderNumberError?.message || 'Failed to generate order number'
      );
    }

    // Insert order
    const { data: orderInsert, error: orderError } = await supabase
      .from('orders')
      .insert({
        shop_id: shop.id,
        client_id: input.clientId,
        status: 'pending',
        discount_cents: input.discountCents ?? 0,
        notes: input.notes ?? null,
        order_number: orderNumberData as string,
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
          shop_id: shop.id,
          order_id: orderId,
          name: garment.name,
          notes: garment.notes ?? null,
          event_date: eventDate,
          due_date: dueDate,
          stage: 'New',
          // Persist optional image fields
          image_cloud_id: garment.imageCloudId ?? null,
          photo_url: garment.imageUrl ?? null,
          preset_icon_key: garment.presetIconKey ?? null,
          preset_fill_color: garment.presetFillColor ?? null,
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
      revalidatePath('/garments');
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
  const { shop } = await ensureUserAndShop();
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
  const { shop } = await ensureUserAndShop();
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
  defaultUnit: z.enum(['item', 'hour', 'day']).default('item'),
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
    const { shop } = await ensureUserAndShop();
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
    const { shop } = await ensureUserAndShop();
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
      .maybeSingle();

    if (!orderCheck || orderCheck.shop_id !== shop.id) {
      throw new Error('Garment not found or access denied');
    }

    // Calculate total price from active garment services (exclude soft-deleted)
    const totalPriceCents =
      garment.garment_services
        ?.filter((service: any) => !service.is_removed)
        .reduce((total: number, service: any) => {
          return total + service.quantity * service.unit_price_cents;
        }, 0) || 0;

    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Garment fetched from DB:', {
        id: garment.id,
        name: garment.name,
        preset_icon_key: garment.preset_icon_key,
        preset_fill_color: garment.preset_fill_color,
        image_cloud_id: garment.image_cloud_id,
        photo_url: garment.photo_url,
      });
    }

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

export async function getGarmentWithInvoiceData(garmentId: string) {
  'use server';

  try {
    const { shop } = await ensureUserAndShop();
    const supabase = await createSupabaseClient();

    // Fetch garment with all related data including invoice and payments
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
          ),
          invoices(
            id,
            invoice_number,
            status,
            amount_cents,
            deposit_amount_cents,
            description,
            due_date,
            created_at,
            payments(*)
          )
        ),
        garment_services(
          id,
          garment_id,
          name,
          description,
          quantity,
          unit_price_cents,
          line_total_cents,
          is_removed,
          removed_at,
          removal_reason,
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
      .maybeSingle();

    if (!orderCheck || orderCheck.shop_id !== shop.id) {
      throw new Error('Garment not found or access denied');
    }

    // Calculate total price from active garment services (exclude soft-deleted)
    const totalPriceCents =
      garment.garment_services
        ?.filter((service: any) => !service.is_removed)
        .reduce((total: number, service: any) => {
          return total + service.quantity * service.unit_price_cents;
        }, 0) || 0;

    // Get the first invoice (assuming one invoice per order for now)
    const invoice = garment.order?.invoices?.[0] || null;
    const payments = invoice?.payments || [];

    return {
      success: true,
      garment: {
        ...garment,
        totalPriceCents,
        invoice,
        payments,
      },
    };
  } catch (error) {
    console.error('Error in getGarmentWithInvoiceData:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to fetch garment with invoice data',
    };
  }
}

export async function getOrdersByClient(clientId: string) {
  'use server';

  try {
    const { shop } = await ensureUserAndShop();
    const supabase = await createSupabaseClient();

    // Fetch orders for the client with garments count
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
      console.error('Error fetching orders:', ordersError);
      throw new Error(ordersError.message);
    }

    // Transform the data to include garment count
    const transformedOrders = orders?.map((order) => ({
      ...order,
      garment_count: order.garments?.length || 0,
      garments: undefined, // Remove the array to keep response clean
    }));

    return {
      success: true,
      orders: transformedOrders || [],
    };
  } catch (error) {
    console.error('Error in getOrdersByClient:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch orders',
      orders: [],
    };
  }
}
