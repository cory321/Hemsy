'use server';

import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { EmailRepository } from '@/lib/services/email/email-repository';
import { UserEmailSettings, EmailType } from '@/types/email';
import { UserEmailSettingsSchema } from '@/lib/validations/email';
import { revalidatePath } from 'next/cache';
import { ensureUserAndShop } from '../users';
import { EmailService } from '@/lib/services/email/email-service';
import { TemplateRenderer } from '@/lib/services/email/template-renderer';
import { Shop } from '@/types';
import { format } from 'date-fns';
import { emailConfig } from '@/lib/config/email.config';

/**
 * Get user email settings
 */
export async function getUserEmailSettings(): Promise<{
	success: boolean;
	data?: UserEmailSettings;
	error?: string;
}> {
	try {
		const { user } = await ensureUserAndShop();

		const supabase = await createClient();
		const repository = new EmailRepository(supabase, user.id);

		const settings = await repository.getUserEmailSettings();

		if (!settings) {
			// Return default settings if none exist
			return {
				success: true,
				data: {
					user_id: user.id,
					receive_appointment_notifications: true,
					email_signature: null,
					reply_to_email: null,
					updated_at: new Date().toISOString(),
				},
			};
		}

		return { success: true, data: settings };
	} catch (error) {
		console.error('Failed to get user email settings:', error);
		console.error('Error details:', {
			message: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		});
		return {
			success: false,
			error: 'Failed to load email settings',
		};
	}
}

/**
 * Update user email settings
 */
export async function updateUserEmailSettings(
	input: z.infer<typeof UserEmailSettingsSchema>
): Promise<{
	success: boolean;
	error?: string;
}> {
	try {
		// Validate input
		const validatedData = UserEmailSettingsSchema.parse(input);

		const { user } = await ensureUserAndShop();

		const supabase = await createClient();
		const repository = new EmailRepository(supabase, user.id);

		// Convert validated data to the format expected by repository
		const updates: Partial<UserEmailSettings> = {
			receive_appointment_notifications:
				validatedData.receive_appointment_notifications,
			email_signature: validatedData.email_signature ?? null,
			reply_to_email: validatedData.reply_to_email ?? null,
		};

		await repository.updateUserEmailSettings(updates);

		// Revalidate the settings page
		revalidatePath('/settings');

		return { success: true };
	} catch (error) {
		console.error('Failed to update user email settings:', error);

		if (error instanceof z.ZodError) {
			return {
				success: false,
				error: error.errors[0]?.message || 'Invalid settings data',
			};
		}

		return {
			success: false,
			error: 'Failed to update email settings',
		};
	}
}

/**
 * Test email delivery
 */
export async function testEmailDelivery(testEmail?: string): Promise<{
	success: boolean;
	error?: string;
}> {
	try {
		const { user } = await ensureUserAndShop();

		const supabase = await createClient();

		// Get user email
		const userData = { email: user.email };

		const recipientEmail = testEmail || userData?.email;

		if (!recipientEmail) {
			return { success: false, error: 'No email address provided' };
		}

		// Send test email via Resend
		const { getResendClient } = await import(
			'@/lib/services/email/resend-client'
		);
		const resendClient = getResendClient();

		const result = await resendClient.send({
			to: recipientEmail,
			subject: 'Hemsy Email Test',
			text: 'This is a test email from your Hemsy email system. If you received this, your email configuration is working correctly!',
		});

		if (!result.success) {
			return {
				success: false,
				error: result.error || 'Failed to send test email',
			};
		}

		return { success: true };
	} catch (error) {
		console.error('Failed to send test email:', error);
		return {
			success: false,
			error: 'Failed to send test email',
		};
	}
}

/**
 * Send test email with a specific template
 */
export async function testEmailTemplate(
	emailType: EmailType,
	testEmail?: string
): Promise<{
	success: boolean;
	error?: string;
}> {
	try {
		const { user, shop } = await ensureUserAndShop();

		if (!shop) {
			return { success: false, error: 'Shop not found' };
		}

		const supabase = await createClient();
		const emailService = new EmailService(supabase, user.id);

		const recipientEmail = testEmail || user.email;

		if (!recipientEmail) {
			return { success: false, error: 'No email address provided' };
		}

		// Use EmailRepository to get template (includes fallback to defaults)
		const repository = new EmailRepository(supabase, user.id);
		const template = await repository.getTemplate(emailType);

		console.log('Test email - fetched template:', {
			emailType,
			userId: user.id,
			template: template
				? {
						id: template.id,
						subject: template.subject.substring(0, 50),
						isDefault: template.is_default,
					}
				: null,
		});

		// If still no template, return an error
		if (!template) {
			return { success: false, error: 'Template not found' };
		}

		// Create sample data for the template
		const sampleData = await getSampleDataForEmailType(emailType, shop as Shop);

		// Use the same rendering system as real emails (React Email + fallback)
		let rendered: { subject: string; body: string; html?: string };

		try {
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

			if (reactEmailTypes.includes(emailType)) {
				console.log('🚀 Using React Email renderer for test email:', emailType);
				const { ReactEmailRenderer } = await import(
					'@/lib/services/email/react-email-renderer'
				);
				const reactEmailRenderer = new ReactEmailRenderer();
				const reactRendered = await reactEmailRenderer.render(
					emailType,
					sampleData
				);
				rendered = {
					subject: reactRendered.subject,
					body: reactRendered.text, // Use text version for legacy compatibility
					html: reactRendered.html, // Add HTML version
				};
			} else {
				console.log(
					'📝 Using traditional template renderer for test email:',
					emailType
				);
				const renderer = new TemplateRenderer();
				rendered = renderer.render(template, sampleData);
			}
		} catch (error) {
			console.warn(
				'⚠️ React Email rendering failed for test, falling back to traditional templates:',
				error
			);
			const renderer = new TemplateRenderer();
			rendered = renderer.render(template, sampleData);
		}

		// Send the test email
		const { getResendClient } = await import(
			'@/lib/services/email/resend-client'
		);
		const resendClient = getResendClient();

		const emailPayload: any = {
			to: recipientEmail,
			subject: `[TEST] ${rendered.subject}`,
			text: rendered.body,
		};

		// Add HTML if available
		if (rendered.html) {
			emailPayload.html = rendered.html;
		}

		const result = await resendClient.send(emailPayload);

		if (!result.success) {
			return {
				success: false,
				error: result.error || 'Failed to send test email',
			};
		}

		// Log the test email
		await supabase.from('email_logs').insert({
			created_by: user.id,
			email_type: emailType,
			recipient_email: recipientEmail,
			recipient_name: 'Test Recipient',
			subject: `[TEST] ${rendered.subject}`,
			body: rendered.body,
			status: 'sent',
			attempts: 1,
			resend_id: result.messageId || null,
			sent_at: new Date().toISOString(),
			metadata: { is_test: true },
		});

		return { success: true };
	} catch (error) {
		console.error('Failed to send test template email:', error);
		return {
			success: false,
			error:
				error instanceof Error ? error.message : 'Failed to send test email',
		};
	}
}

/**
 * Helper function to generate sample data for different email types
 */
async function getSampleDataForEmailType(
	emailType: EmailType,
	shop: Shop
): Promise<any> {
	// Get shop signature for test emails
	let shopSignature = '';
	try {
		const { getEmailSignature } = await import('./email-signatures');
		const signatureResult = await getEmailSignature();
		if (signatureResult.success && signatureResult.data) {
			shopSignature = signatureResult.data.content;
			console.log('✅ Fetched signature for test email:', shopSignature);
		} else {
			console.log('❌ No signature found for test email');
		}
	} catch (error) {
		console.warn('Could not fetch signature for test email:', error);
	}

	const baseData = {
		// React Email format
		shop_name: shop.business_name || 'Your Shop',
		// Only include shop contact info if no signature exists
		shop_email: shopSignature
			? undefined
			: shop.business_email || 'shop@example.com',
		shop_phone: shopSignature
			? undefined
			: shop.business_phone || '(555) 123-4567',
		shop_address: shopSignature
			? undefined
			: shop.business_address || '123 Main St, City, State 12345',
		shop_signature: shopSignature,
		client_name: 'Jane Smith',
		client_email: 'jane.smith@example.com',
		client_phone: '(555) 987-6543',
	};

	console.log('📧 Sample data for email template:', {
		emailType,
		hasSignature: !!shopSignature,
		shop_signature: shopSignature,
		shop_email: baseData.shop_email,
		shop_phone: baseData.shop_phone,
		shop_address: baseData.shop_address,
	});

	const appointmentDate = new Date();
	appointmentDate.setDate(appointmentDate.getDate() + 3); // 3 days from now

	switch (emailType) {
		case 'appointment_scheduled':
			return {
				...baseData,
				appointment_time: format(appointmentDate, "EEEE, MMMM d 'at' h:mm a"),
				confirmation_link: `${emailConfig.urls.confirmation}/test-token`,
				cancel_link: `${emailConfig.urls.decline}/test-token`,
				preview: true,
			};

		case 'appointment_rescheduled':
			return {
				...baseData,
				appointment_time: format(appointmentDate, "EEEE, MMMM d 'at' h:mm a"),
				previous_time: 'Monday, January 15 at 2:00 PM',
				confirmation_link: `${emailConfig.urls.confirmation}/test-token`,
				cancel_link: `${emailConfig.urls.decline}/test-token`,
				preview: true,
			};

		case 'appointment_canceled':
			return {
				...baseData,
				previous_time: format(appointmentDate, "EEEE, MMMM d 'at' h:mm a"),
			};

		case 'appointment_reminder':
			return {
				...baseData,
				appointment_time: format(appointmentDate, "EEEE, MMMM d 'at' h:mm a"),
			};

		case 'appointment_confirmed':
			return {
				...baseData,
				appointment_time: format(appointmentDate, "EEEE, MMMM d 'at' h:mm a"),
			};

		case 'payment_link':
			return {
				...baseData,
				payment_link: 'https://payments.hemsy.app/pay/test-payment-link',
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
				due_date: format(appointmentDate, 'MMMM d, yyyy'),
				payment_link: 'https://payments.hemsy.app/pay/test-invoice-payment',
			};

		case 'appointment_no_show':
			return {
				...baseData,
				appointment_time: format(appointmentDate, "EEEE, MMMM d 'at' h:mm a"),
			};

		case 'appointment_confirmed':
			return {
				...baseData,
				seamstress_name: 'Sarah Wilson',
				appointment_time: format(appointmentDate, "EEEE, MMMM d 'at' h:mm a"),
			};

		case 'appointment_rescheduled_seamstress':
			return {
				...baseData,
				seamstress_name: 'Sarah Wilson',
				appointment_time: format(appointmentDate, "EEEE, MMMM d 'at' h:mm a"),
				previous_time: 'Monday, January 15 at 2:00 PM',
			};

		case 'appointment_canceled_seamstress':
			return {
				...baseData,
				seamstress_name: 'Sarah Wilson',
				previous_time: format(appointmentDate, "EEEE, MMMM d 'at' h:mm a"),
			};

		default:
			return baseData;
	}
}
