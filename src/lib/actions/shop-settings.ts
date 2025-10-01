'use server';

import { createClient } from '@/lib/supabase/server';
import { ensureUserAndShop } from './users';

/**
 * Get shop tax percent (for use in client components)
 */
export async function getShopTaxPercent(): Promise<number> {
	try {
		const { shop } = await ensureUserAndShop();
		const taxPercent =
			typeof shop.tax_percent === 'string'
				? parseFloat(shop.tax_percent)
				: shop.tax_percent;

		return taxPercent || 0;
	} catch (error) {
		console.error('Error fetching shop tax percent:', error);
		return 0;
	}
}
