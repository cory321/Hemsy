'use server';

import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { EmailService } from '@/lib/services/email/email-service';
import { EmailRepository } from '@/lib/services/email/email-repository';
import { templateRenderer } from '@/lib/services/email/template-renderer';
import { PreviewHelper } from '@/lib/services/email/preview-helper';
import { EmailTemplate, EmailType, isEmailType } from '@/types/email';
import { EmailTemplateSchema } from '@/lib/validations/email';
import { revalidatePath } from 'next/cache';
import { ensureUserAndShop } from '../users';

/**
 * Get all email templates
 */
export async function getEmailTemplates(): Promise<{
	success: boolean;
	data?: EmailTemplate[];
	error?: string;
}> {
	try {
		const { user } = await ensureUserAndShop();

		const supabase = await createClient();
		const repository = new EmailRepository(supabase, user.id);

		const templates = await repository.getAllTemplates();

		// If no templates exist, return default templates
		if (templates.length === 0) {
			const emailTypes: EmailType[] = [
				'appointment_scheduled',
				'appointment_rescheduled',
				'appointment_canceled',
				'payment_link',
				'appointment_confirmed',
			];

			const defaultTemplates = await Promise.all(
				emailTypes.map((type) => repository.getTemplate(type))
			);

			return {
				success: true,
				data: defaultTemplates.filter((t) => t !== null) as EmailTemplate[],
			};
		}

		return { success: true, data: templates };
	} catch (error) {
		console.error('Failed to get email templates:', error);
		return {
			success: false,
			error: 'Failed to load email templates',
		};
	}
}

/**
 * Get a single email template by type
 */
export async function getEmailTemplate(emailType: string): Promise<{
	success: boolean;
	data?: EmailTemplate;
	error?: string;
}> {
	try {
		if (!isEmailType(emailType)) {
			return { success: false, error: 'Invalid email type' };
		}

		const { user } = await ensureUserAndShop();

		const supabase = await createClient();
		const repository = new EmailRepository(supabase, user.id);

		const template = await repository.getTemplate(emailType);
		if (!template) {
			return { success: false, error: 'Template not found' };
		}

		return { success: true, data: template };
	} catch (error) {
		console.error('Failed to get email template:', error);
		return {
			success: false,
			error: 'Failed to load email template',
		};
	}
}

// Template editing has been removed - templates are read-only

/**
 * Preview an email template with React Email support
 */
export async function previewEmailTemplate(
	emailType: string,
	template?: { subject: string; body: string },
	customSections?: Record<string, string>
): Promise<{
	success: boolean;
	data?: {
		subject: string;
		body: string;
		html?: string;
		variables: string[];
		isReactEmail?: boolean;
	};
	error?: string;
}> {
	try {
		if (!isEmailType(emailType)) {
			return { success: false, error: 'Invalid email type' };
		}

		const { user, shop } = await ensureUserAndShop();

		// If no template provided, get from database
		let templateToPreview = template;
		if (!templateToPreview) {
			const supabase = await createClient();
			const repository = new EmailRepository(supabase, user.id);
			const dbTemplate = await repository.getTemplate(emailType);

			if (!dbTemplate) {
				return { success: false, error: 'Template not found' };
			}

			templateToPreview = {
				subject: dbTemplate.subject,
				body: dbTemplate.body,
			};
		}

		// Check if React Email supports this email type
		const reactEmailTypes: EmailType[] = [
			'appointment_scheduled',
			'appointment_rescheduled',
			'appointment_canceled',
			'appointment_reminder',
			'appointment_no_show',
			'appointment_confirmed',
			'appointment_rescheduled_seamstress',
			'appointment_canceled_seamstress',
			'payment_link',
			'payment_received',
			'invoice_sent',
		];

		if (reactEmailTypes.includes(emailType as EmailType)) {
			try {
				// Generate sample data for React Email preview
				const sampleData = await generateSampleDataForPreview(
					emailType as EmailType,
					shop
				);

				// Add custom sections if provided
				if (customSections) {
					sampleData.custom_sections = customSections;
				}

				// Use React Email renderer
				const { ReactEmailRenderer } = await import(
					'@/lib/services/email/react-email-renderer'
				);
				const reactEmailRenderer = new ReactEmailRenderer();
				const reactRendered = await reactEmailRenderer.render(
					emailType as EmailType,
					sampleData
				);

				// Extract variables from template for help display
				const variables = [
					...templateRenderer.extractVariables(templateToPreview.subject),
					...templateRenderer.extractVariables(templateToPreview.body),
				];

				return {
					success: true,
					data: {
						subject: reactRendered.subject,
						body: reactRendered.text,
						html: reactRendered.html,
						variables: Array.from(new Set(variables)),
						isReactEmail: true,
					},
				};
			} catch (reactError) {
				console.warn(
					'React Email preview failed, falling back to traditional:',
					reactError
				);
				// Fall through to traditional preview
			}
		}

		// Generate traditional preview
		const preview = PreviewHelper.generatePreview(
			templateToPreview,
			emailType as EmailType,
			{ includeFooter: true }
		);

		return {
			success: true,
			data: {
				...preview,
				isReactEmail: false,
			},
		};
	} catch (error) {
		console.error('Failed to preview email template:', error);
		return {
			success: false,
			error: 'Failed to generate preview',
		};
	}
}

/**
 * Generate sample data for React Email preview
 */
async function generateSampleDataForPreview(
	emailType: EmailType,
	shop: any
): Promise<any> {
	// Get shop signature for preview emails
	let shopSignature = '';
	try {
		const { getEmailSignature } = await import('./email-signatures');
		const signatureResult = await getEmailSignature();
		if (signatureResult.success && signatureResult.data) {
			shopSignature = signatureResult.data.content;
			console.log('✅ Fetched signature for preview email:', shopSignature);
		} else {
			console.log('❌ No signature found for preview email');
		}
	} catch (error) {
		console.warn('Could not fetch signature for preview email:', error);
	}

	const baseData = {
		shop_name: shop?.business_name || 'Your Shop',
		// Only include shop contact info if no signature exists
		shop_email: shopSignature
			? undefined
			: shop?.business_email || 'shop@example.com',
		shop_phone: shopSignature
			? undefined
			: shop?.business_phone || '(555) 123-4567',
		shop_address: shopSignature
			? undefined
			: shop?.business_address || '123 Main St, City, State 12345',
		shop_signature: shopSignature,
		client_name: 'Jane Smith',
		client_email: 'jane.smith@example.com',
		client_phone: '(555) 987-6543',
	};

	const appointmentDate = new Date();
	appointmentDate.setDate(appointmentDate.getDate() + 3); // 3 days from now

	switch (emailType) {
		case 'appointment_scheduled':
			return {
				...baseData,
				appointment_time: 'Thursday, March 15 at 2:00 PM',
				confirmation_link: 'https://hemsy.app/confirm/preview-token',
				cancel_link: 'https://hemsy.app/decline/preview-token',
				preview: true,
			};

		case 'appointment_rescheduled':
			return {
				...baseData,
				appointment_time: 'Friday, March 16 at 3:00 PM',
				previous_time: 'Thursday, March 15 at 2:00 PM',
				confirmation_link: 'https://hemsy.app/confirm/preview-token',
				cancel_link: 'https://hemsy.app/decline/preview-token',
				preview: true,
			};

		case 'appointment_canceled':
			return {
				...baseData,
				previous_time: 'Thursday, March 15 at 2:00 PM',
			};

		case 'appointment_reminder':
			return {
				...baseData,
				appointment_time: 'Tomorrow, March 15 at 2:00 PM',
			};

		case 'payment_link':
			return {
				...baseData,
				payment_link: 'https://payments.hemsy.app/pay/preview-payment-link',
				amount: '$150.00',
				preview: true,
			};

		case 'payment_received':
			return {
				...baseData,
				amount: '$150.00',
				order_details:
					'Wedding dress alterations\n- Hem adjustment\n- Waist taking in\n- Sleeve shortening',
			};

		case 'invoice_sent':
			return {
				...baseData,
				invoice_details:
					'Wedding dress alterations\n- Hem adjustment: $50.00\n- Waist taking in: $65.00\n- Sleeve shortening: $35.00',
				amount: '$150.00',
				due_date: 'March 30, 2024',
				payment_link: 'https://payments.hemsy.app/pay/preview-invoice-payment',
			};

		case 'appointment_no_show':
			return {
				...baseData,
				appointment_time: 'Thursday, March 15 at 2:00 PM',
			};

		case 'appointment_confirmed':
			return {
				...baseData,
				seamstress_name: 'Sarah Wilson',
				appointment_time: 'Thursday, March 15 at 2:00 PM',
			};

		case 'appointment_rescheduled_seamstress':
			return {
				...baseData,
				seamstress_name: 'Sarah Wilson',
				appointment_time: 'Friday, March 16 at 3:00 PM',
				previous_time: 'Thursday, March 15 at 2:00 PM',
			};

		case 'appointment_canceled_seamstress':
			return {
				...baseData,
				seamstress_name: 'Sarah Wilson',
				previous_time: 'Thursday, March 15 at 2:00 PM',
			};

		default:
			return baseData;
	}
}

/**
 * Get template variables for help display
 */
export async function getTemplateVariables(emailType: string): Promise<{
	success: boolean;
	data?: Array<{
		key: string;
		description: string;
		example: string;
	}>;
	error?: string;
}> {
	try {
		if (!isEmailType(emailType)) {
			return { success: false, error: 'Invalid email type' };
		}

		const { user } = await ensureUserAndShop();

		const variables = templateRenderer.getVariableHelp(emailType);

		return { success: true, data: variables };
	} catch (error) {
		console.error('Failed to get template variables:', error);
		return {
			success: false,
			error: 'Failed to load template variables',
		};
	}
}
