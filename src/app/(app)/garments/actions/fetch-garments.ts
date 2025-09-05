'use server';

import { unstable_cache } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type {
  GetGarmentsPaginatedParams,
  PaginatedGarmentsResponse,
} from '@/lib/actions/garments-paginated';
import { getGarmentsPaginated as libGetGarmentsPaginated } from '@/lib/actions/garments-paginated';

export const getGarmentStageCounts = unstable_cache(
  async (shopId: string): Promise<Record<string, number>> => {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc(
      'get_garment_stage_counts' as any,
      {
        p_shop_id: shopId,
      } as any
    );
    if (error) {
      throw new Error(`Failed to fetch garment stage counts: ${error.message}`);
    }
    const rows = (data as any[]) || [];
    return rows.reduce((acc: Record<string, number>, row: any) => {
      acc[row.stage] = Number(row.count) || 0;
      return acc;
    }, {});
  },
  ['garment-stage-counts'],
  { revalidate: 60 }
);

export async function getGarmentsPaginated(
  params: GetGarmentsPaginatedParams
): Promise<PaginatedGarmentsResponse> {
  // Delegate to existing lib action to preserve cursor and shape
  return libGetGarmentsPaginated(params);
}
