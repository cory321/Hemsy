'use server';

import { createClient } from '@/lib/supabase/server';
import type { GarmentStage } from '@/types';
import { z } from 'zod';
import { logger } from '@/lib/utils/logger';

// Schema for cursor-based pagination
const GarmentCursorSchema = z.object({
  lastId: z.string().uuid(),
  // Accept any non-empty string to avoid strict RFC3339 validation issues across environments
  lastCreatedAt: z.string().min(1),
  lastClientName: z.string().optional(),
  lastDueDate: z.string().optional(), // For due_date sorting
});

const GetGarmentsPaginatedSchema = z.object({
  shopId: z.string().uuid(),
  cursor: GarmentCursorSchema.optional(),
  limit: z.number().int().positive().max(100).default(20),
  sortField: z
    .enum(['due_date', 'created_at', 'name', 'event_date', 'client_name'])
    .default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  stage: z.custom<GarmentStage>().optional(),
  search: z.string().optional(),
});

export type GetGarmentsPaginatedParams = z.infer<
  typeof GetGarmentsPaginatedSchema
>;

export interface GarmentListItem {
  id: string;
  name: string;
  order_id: string;
  stage: GarmentStage;
  stage_name?: string | undefined;
  client_name?: string;
  client_first_name?: string | undefined;
  client_last_name?: string | undefined;
  photo_url?: string;
  image_cloud_id?: string;
  preset_icon_key?: string | null;
  preset_fill_color?: string | null;
  due_date?: string;
  event_date?: string;
  created_at: string;
  is_done: boolean;
  services?: {
    id: string;
    name: string;
    is_done: boolean;
  }[];
  // Image type metadata for optimization
  hasCloudinaryImage: boolean;
  imageType: 'cloudinary' | 'svg-preset';
}

export interface PaginatedGarmentsResponse {
  garments: GarmentListItem[];
  nextCursor: {
    lastId: string;
    lastCreatedAt: string;
    lastClientName?: string;
    lastDueDate?: string;
  } | null;
  hasMore: boolean;
  totalCount?: number; // Only on first load - filtered count
  totalGarmentsCount?: number; // Total garments in shop (unfiltered)
  stageCounts?: Record<string, number>; // Totals per stage for the shop
}

export async function getGarmentsPaginated(
  params: GetGarmentsPaginatedParams
): Promise<PaginatedGarmentsResponse> {
  try {
    // Validate params
    const validatedParams = GetGarmentsPaginatedSchema.parse(params);
    const supabase = await createClient();

    // Determine which table/view to query based on whether we're searching
    const hasSearch =
      validatedParams.search && validatedParams.search.trim().length > 0;

    // Build the query
    let query;

    if (hasSearch) {
      // Use the view for searching (includes client names)
      query = supabase
        .from('garments_with_clients')
        .select(
          `
        id,
        name,
        stage,
        order_id,
        shop_id,
        image_cloud_id,
        photo_url,
        preset_icon_key,
        preset_fill_color,
        notes,
        due_date,
        created_at,
        event_date,
        is_done,
        client_first_name,
        client_last_name,
        client_full_name
      `,
          { count: 'exact' }
        )
        .eq('shop_id', validatedParams.shopId);
    } else {
      // Use regular table when not searching
      query = supabase
        .from('garments')
        .select(
          `
        id,
        name,
        stage,
        garment_services (
          id,
          name,
          is_done
        ),
        order_id,
        image_cloud_id,
        photo_url,
        preset_icon_key,
        preset_fill_color,
        notes,
        due_date,
        created_at,
        event_date,
        is_done,
        orders!garments_order_id_fkey (
          clients!orders_client_id_fkey (
            first_name,
            last_name
          )
        )
      `,
          { count: 'exact' }
        )
        .eq('shop_id', validatedParams.shopId);
    }

    // Apply stage filter if provided
    if (validatedParams.stage) {
      query = query.eq('stage', validatedParams.stage);
    }

    // Apply search filter if provided
    if (hasSearch) {
      const term = validatedParams.search!.trim();
      const like = `%${term}%`;
      // Search on garment columns and client names when using the view
      query = query.or(
        `name.ilike.${like},notes.ilike.${like},client_first_name.ilike.${like},client_last_name.ilike.${like},client_full_name.ilike.${like}`
      );
    }

    // Apply cursor-based pagination based on the sort field
    if (validatedParams.cursor) {
      const { lastId, lastCreatedAt } = validatedParams.cursor;
      const isAsc = validatedParams.sortOrder === 'asc';
      const op = isAsc ? 'gt' : 'lt';
      const idOp = isAsc ? 'gt' : 'lt';

      // For client_name sorting when using the view
      if (validatedParams.sortField === 'client_name' && hasSearch) {
        const lastClientName = validatedParams.cursor.lastClientName;
        if (lastClientName) {
          query = query.or(
            `client_full_name.${op}.${lastClientName},and(client_full_name.eq.${lastClientName},id.${idOp}.${lastId})`
          );
        }
      } else if (validatedParams.sortField === 'due_date') {
        // For due_date sorting
        const lastDueDate = validatedParams.cursor.lastDueDate;
        if (lastDueDate) {
          // Handle null due_dates properly
          query = query.or(
            `due_date.${op}.${lastDueDate},and(due_date.eq.${lastDueDate},id.${idOp}.${lastId}),and(due_date.is.null,id.${idOp}.${lastId})`
          );
        } else {
          // If lastDueDate is null, we're in the null section
          query = query.or(`due_date.is.null,id.${idOp}.${lastId}`);
        }
      } else {
        // Default pagination by created_at
        query = query.or(
          `created_at.${op}.${lastCreatedAt},and(created_at.eq.${lastCreatedAt},id.${idOp}.${lastId})`
        );
      }
    }

    // Apply sorting based on the sort field
    if (validatedParams.sortField === 'client_name') {
      // When sorting by client name, we need to use the view
      if (!hasSearch) {
        // Switch to view query for client name sorting
        query = supabase
          .from('garments_with_clients')
          .select(
            `
        id,
        name,
        stage,
        order_id,
        shop_id,
        image_cloud_id,
        photo_url,
        preset_icon_key,
        preset_fill_color,
        notes,
        due_date,
        created_at,
        event_date,
        is_done,
        client_first_name,
        client_last_name,
        client_full_name
      `,
            { count: 'exact' }
          )
          .eq('shop_id', validatedParams.shopId);

        // Re-apply stage filter if provided
        if (validatedParams.stage) {
          query = query.eq('stage', validatedParams.stage);
        }

        // Re-apply cursor if provided
        if (validatedParams.cursor) {
          const { lastId } = validatedParams.cursor;
          const isAsc = validatedParams.sortOrder === 'asc';
          const op = isAsc ? 'gt' : 'lt';
          const idOp = isAsc ? 'gt' : 'lt';
          const lastClientName = validatedParams.cursor.lastClientName;
          if (lastClientName) {
            query = query.or(
              `client_full_name.${op}.${lastClientName},and(client_full_name.eq.${lastClientName},id.${idOp}.${lastId})`
            );
          }
        }
      }

      // Sort by client name
      query = query
        .order('client_full_name', {
          ascending: validatedParams.sortOrder === 'asc',
          // Always put nulls last regardless of sort order
          nullsFirst: false,
        })
        .order('id', { ascending: validatedParams.sortOrder === 'asc' });
    } else if (validatedParams.sortField === 'name') {
      query = query
        .order('name', {
          ascending: validatedParams.sortOrder === 'asc',
          nullsFirst: false,
        })
        .order('id', { ascending: validatedParams.sortOrder === 'asc' });
    } else if (validatedParams.sortField === 'due_date') {
      // When sorting by due date, also consider stage as a secondary sort
      // This helps prioritize garments that are closer to completion
      query = query
        .order('due_date', {
          ascending: validatedParams.sortOrder === 'asc',
          nullsFirst: validatedParams.sortOrder === 'desc',
        })
        .order('stage', {
          ascending: false, // Ready For Pickup -> In Progress -> New
          nullsFirst: false,
        })
        .order('id', { ascending: validatedParams.sortOrder === 'asc' });
    } else {
      // Default sorting by created_at
      query = query
        .order('created_at', {
          ascending: validatedParams.sortOrder === 'asc',
          nullsFirst: validatedParams.sortOrder === 'asc',
        })
        .order('id', { ascending: validatedParams.sortOrder === 'asc' });
    }

    // Apply limit
    query = query.limit(validatedParams.limit);

    // Execute query
    const { data: garments, error, count } = await query;

    if (error) {
      throw new Error('Failed to fetch garments: ' + error.message);
    }

    // Process garments to include computed fields
    const processedGarments: GarmentListItem[] = (garments || []).map(
      (garment: any) => {
        // Handle client name based on data structure (view vs nested)
        let clientName: string;
        let clientFirstName: string | undefined;
        let clientLastName: string | undefined;

        // Check if we're using the view (either from search or client_name sorting)
        const usingView =
          hasSearch || validatedParams.sortField === 'client_name';

        if (usingView && garment.client_full_name) {
          // Using view (flat structure)
          clientName = garment.client_full_name || 'Unknown Client';
          clientFirstName = garment.client_first_name || undefined;
          clientLastName = garment.client_last_name || undefined;
        } else if (garment.orders?.clients) {
          // Using regular table (nested structure)
          clientFirstName = garment.orders.clients.first_name;
          clientLastName = garment.orders.clients.last_name;
          clientName = `${clientFirstName} ${clientLastName}`;
        } else {
          clientName = 'Unknown Client';
          clientFirstName = undefined;
          clientLastName = undefined;
        }

        const hasCloudinaryImage = !!garment.image_cloud_id;
        const imageType = hasCloudinaryImage ? 'cloudinary' : 'svg-preset';

        const base: any = {
          id: garment.id,
          name: garment.name,
          order_id: garment.order_id,
          stage: garment.stage || 'New',
          client_name: clientName,
          client_first_name: clientFirstName,
          client_last_name: clientLastName,
          created_at: garment.created_at,
          is_done: garment.is_done,
          services: garment.garment_services || [],
          hasCloudinaryImage,
          imageType,
        };

        if (garment.stage) base.stage_name = garment.stage;
        if (garment.photo_url) base.photo_url = garment.photo_url;
        if (garment.image_cloud_id)
          base.image_cloud_id = garment.image_cloud_id;
        if (garment.preset_icon_key)
          base.preset_icon_key = garment.preset_icon_key;
        if (garment.preset_fill_color)
          base.preset_fill_color = garment.preset_fill_color;
        if (garment.due_date) base.due_date = garment.due_date;
        if (garment.event_date) base.event_date = garment.event_date;

        return base as GarmentListItem;
      }
    );

    // Determine if there are more results
    const hasMore = processedGarments.length === validatedParams.limit;

    // Create next cursor if there are more results
    const lastGarment = processedGarments[processedGarments.length - 1];
    let nextCursor = null;

    if (hasMore && lastGarment) {
      // Base cursor fields
      const baseCursor: {
        lastId: string;
        lastCreatedAt: string;
        lastClientName?: string;
        lastDueDate?: string;
      } = {
        lastId: lastGarment.id,
        lastCreatedAt: lastGarment.created_at,
      };

      // Add field-specific cursor data
      if (
        validatedParams.sortField === 'client_name' &&
        lastGarment.client_name
      ) {
        baseCursor.lastClientName = lastGarment.client_name;
      } else if (
        validatedParams.sortField === 'due_date' &&
        lastGarment.due_date
      ) {
        baseCursor.lastDueDate = lastGarment.due_date;
      }

      nextCursor = baseCursor;
    }

    // Return response
    const response: PaginatedGarmentsResponse = {
      garments: processedGarments,
      nextCursor,
      hasMore,
    };

    // Only include totals on first page
    if (!validatedParams.cursor) {
      if (count !== null) {
        response.totalCount = count;
      }

      // Fetch stage counts for the shop (head-only exact counts per stage)
      const stages = [
        'New',
        'In Progress',
        'Ready For Pickup',
        'Done',
      ] as const;
      const counts = await Promise.all(
        stages.map(async (s) => {
          const { count: c } = await supabase
            .from('garments')
            .select('*', { count: 'exact', head: true })
            .eq('shop_id', validatedParams.shopId)
            .eq('stage', s);
          return [s as string, c ?? 0] as const;
        })
      );
      response.stageCounts = Object.fromEntries(counts);

      // Calculate total garments count (sum of all stages)
      response.totalGarmentsCount = counts.reduce(
        (total, [, count]) => total + count,
        0
      );
    }

    return response;
  } catch (error) {
    logger.error('Error in getGarmentsPaginated:', error, {
      shopId: params.shopId,
      stage: params.stage,
      sortField: params.sortField,
    });
    throw error instanceof Error
      ? error
      : new Error('Failed to fetch garments');
  }
}

// Prefetch function for next page
export async function prefetchNextGarmentsPage(
  currentCursor: { lastId: string; lastCreatedAt: string },
  params: Omit<GetGarmentsPaginatedParams, 'cursor'>
): Promise<void> {
  try {
    // Just fetch the data to populate cache
    await getGarmentsPaginated({
      ...params,
      cursor: currentCursor,
      limit: 10, // Smaller limit for prefetch
    });
  } catch (error) {
    // Silently fail prefetch
    console.debug('Prefetch failed:', error);
  }
}
