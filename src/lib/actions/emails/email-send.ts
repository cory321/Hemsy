'use server';

import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { EmailService } from '@/lib/services/email/email-service';
import { EmailType, isEmailType } from '@/types/email';
import { SendEmailSchema } from '@/lib/validations/email';

/**
 * Send appointment scheduled email
 */
export async function sendAppointmentScheduledEmail(
	appointmentId: string
): Promise<{ success: boolean; error?: string }> {
	return sendAppointmentEmail({
		appointmentId,
		emailType: 'appointment_scheduled',
	});
}

/**
 * Send appointment rescheduled email
 */
export async function sendAppointmentRescheduledEmail(
	appointmentId: string,
	previousTime: string
): Promise<{ success: boolean; error?: string }> {
	return sendAppointmentEmail(
		{
			appointmentId,
			emailType: 'appointment_rescheduled',
		},
		{ previous_time: previousTime }
	);
}

/**
 * Send appointment canceled email
 */
export async function sendAppointmentCanceledEmail(
	appointmentId: string,
	previousTime: string
): Promise<{ success: boolean; error?: string }> {
	return sendAppointmentEmail(
		{
			appointmentId,
			emailType: 'appointment_canceled',
		},
		{ previous_time: previousTime }
	);
}

/**
 * Send confirmation request email
 */
export async function sendConfirmationRequestEmail(
	appointmentId: string
): Promise<{
	success: boolean;
	error?: string;
	confirmationUrl?: string;
}> {
	try {
		const { userId } = await auth();
		if (!userId) {
			return { success: false, error: 'Unauthorized' };
		}

		const supabase = await createClient();
		const emailService = new EmailService(supabase, userId);

		const result = await emailService.sendAppointmentEmail(
			appointmentId,
			'appointment_confirmed'
		);

		return result;
	} catch (error) {
		console.error('Failed to send confirmation request:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Failed to send email',
		};
	}
}

/**
 * Send payment link email
 */
export async function sendPaymentLinkEmail(
	clientId: string,
	paymentLink: string,
	amount: number
): Promise<{ success: boolean; error?: string }> {
	try {
		const { userId } = await auth();
		if (!userId) {
			return { success: false, error: 'Unauthorized' };
		}

		// For MVP, payment emails are placeholder
		// This would integrate with Stripe in the future
		console.log('Payment email placeholder:', {
			clientId,
			paymentLink,
			amount,
		});

		return { success: true };
	} catch (error) {
		console.error('Failed to send payment email:', error);
		return {
			success: false,
			error: 'Failed to send payment email',
		};
	}
}

/**
 * Generic appointment email sender
 */
async function sendAppointmentEmail(
	input: z.infer<typeof SendEmailSchema>,
	additionalData?: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
	try {
		// Validate input
		const validatedData = SendEmailSchema.parse(input);

		const { userId } = await auth();
		if (!userId) {
			return { success: false, error: 'Unauthorized' };
		}

		const supabase = await createClient();
		const emailService = new EmailService(supabase, userId);

		const result = await emailService.sendAppointmentEmail(
			validatedData.appointmentId,
			validatedData.emailType as EmailType,
			additionalData
		);

		return {
			success: result.success,
			...(result.error && { error: result.error }),
		};
	} catch (error) {
		console.error('Failed to send appointment email:', error);

		if (error instanceof z.ZodError) {
			return {
				success: false,
				error: 'Invalid request data',
			};
		}

		return {
			success: false,
			error: error instanceof Error ? error.message : 'Failed to send email',
		};
	}
}

/**
 * Resend a failed email
 */
export async function resendEmail(
	emailLogId: string
): Promise<{ success: boolean; error?: string }> {
	try {
		const { userId } = await auth();
		if (!userId) {
			return { success: false, error: 'Unauthorized' };
		}

		const supabase = await createClient();
		const emailService = new EmailService(supabase, userId);

		const result = await emailService.resendEmail(emailLogId);

		return {
			success: result.success,
			...(result.error && { error: result.error }),
		};
	} catch (error) {
		console.error('Failed to resend email:', error);
		return {
			success: false,
			error: 'Failed to resend email',
		};
	}
}
