'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { EmailSignature } from '@/types/email';
import { revalidatePath } from 'next/cache';
import { ensureUserAndShop } from '../users';

/**
 * Get the shop's email signature
 */
export async function getEmailSignature(): Promise<{
	success: boolean;
	data?: EmailSignature;
	error?: string;
}> {
	try {
		const { user, shop } = await ensureUserAndShop();

		if (!shop) {
			return { success: false, error: 'Shop not found' };
		}

		const supabase = await createClient();

		// Get the single signature for this shop
		const { data, error } = await supabase
			.from('email_signatures')
			.select('*')
			.eq('shop_id', shop.id)
			.single();

		if (error && error.code !== 'PGRST116') {
			// PGRST116 is "no rows returned"
			console.error('Failed to get email signature:', error);
			return {
				success: false,
				error: 'Failed to load email signature',
			};
		}

		if (!data) {
			return { success: true };
		}

		// Map database row to EmailSignature type
		const signature: EmailSignature = {
			id: data.id,
			shop_id: data.shop_id,
			name: data.name,
			content: data.content,
			created_at: data.created_at || new Date().toISOString(),
			updated_at: data.updated_at || new Date().toISOString(),
			created_by: data.created_by,
		};

		return { success: true, data: signature };
	} catch (error) {
		console.error('Failed to get email signature:', error);
		return {
			success: false,
			error: 'Failed to load email signature',
		};
	}
}

/**
 * Update or create the shop's email signature
 */
export async function updateEmailSignature(content: string): Promise<{
	success: boolean;
	error?: string;
}> {
	try {
		// Validate input
		const validatedContent = z.string().min(1).max(1000).parse(content);

		const { user, shop } = await ensureUserAndShop();

		if (!shop) {
			return { success: false, error: 'Shop not found' };
		}

		const supabase = await createClient();

		// Check if signature exists
		const { data: existingSignature } = await supabase
			.from('email_signatures')
			.select('id')
			.eq('shop_id', shop.id)
			.single();

		if (existingSignature) {
			// Update existing signature
			const { error } = await supabase
				.from('email_signatures')
				.update({
					content: validatedContent,
					updated_at: new Date().toISOString(),
				})
				.eq('id', existingSignature.id);

			if (error) {
				console.error('Failed to update email signature:', error);
				return {
					success: false,
					error: 'Failed to update email signature',
				};
			}
		} else {
			// Create new signature
			const { error } = await supabase.from('email_signatures').insert({
				shop_id: shop.id,
				name: 'Default Signature',
				content: validatedContent,
				created_by: user.id,
			});

			if (error) {
				console.error('Failed to create email signature:', error);
				return {
					success: false,
					error: 'Failed to create email signature',
				};
			}
		}

		// Revalidate the settings page
		revalidatePath('/settings');

		return { success: true };
	} catch (error) {
		console.error('Failed to update email signature:', error);

		if (error instanceof z.ZodError) {
			return {
				success: false,
				error: 'Invalid signature content',
			};
		}

		return {
			success: false,
			error: 'Failed to update email signature',
		};
	}
}
