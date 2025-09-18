'use server';

import { z } from 'zod';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { EmailRepository } from '@/lib/services/email/email-repository';
import { EmailService } from '@/lib/services/email/email-service';
import { ConfirmationTokenSchema } from '@/lib/validations/email';

/**
 * Confirm an appointment via token
 */
export async function confirmAppointment(token: string): Promise<{
	success: boolean;
	error?: string;
	appointmentId?: string;
	alreadyUsed?: boolean;
}> {
	try {
		// Extract just the token part, removing any query parameters or extra characters
		// This handles cases where email clients (like Gmail) add tracking parameters
		const cleanToken =
			token.split('?')[0]?.split('&')[0]?.trim() || token.trim();

		// Validate token format - throw 404 for invalid tokens
		let validatedData;
		try {
			validatedData = ConfirmationTokenSchema.parse({ token: cleanToken });
		} catch (error) {
			if (error instanceof z.ZodError) {
				notFound();
			}
			throw error;
		}

		const supabase = await createClient();

		// Validate token (public action - no auth required)
		const repository = new EmailRepository(supabase, 'system');
		const validation = await repository.validateToken(cleanToken);

		if (!validation.valid) {
			// If already used, treat as success (idempotent UX) and perform no further actions
			if (validation.reason === 'used') {
				return {
					success: true,
					alreadyUsed: true,
					...(validation.appointmentId
						? { appointmentId: validation.appointmentId }
						: {}),
				};
			}
			// Throw 404 for invalid tokens
			if (validation.reason === 'not_found') {
				notFound();
			}
			return {
				success: false,
				error:
					validation.reason === 'expired'
						? 'This confirmation link has expired'
						: 'Invalid confirmation link',
			};
		}

		// Update appointment status
		const { error: updateError } = await supabase
			.from('appointments')
			.update({ status: 'confirmed' })
			.eq('id', validation.appointmentId!);

		if (updateError) {
			throw updateError;
		}

		// Mark token as used
		await repository.useToken(cleanToken);

		// Invalidate all other unused tokens for this appointment
		await repository.invalidateUnusedTokensForAppointment(
			validation.appointmentId!
		);

		// Send confirmation email to seamstress
		// Fetch the shop owner's user_id via the appointment's shop
		const { data: apptWithShop, error: shopJoinError } = await supabase
			.from('appointments')
			.select('shop_id, shops(owner_user_id)')
			.eq('id', validation.appointmentId!)
			.single();

		if (!shopJoinError && apptWithShop?.shops?.owner_user_id) {
			const ownerUserId = (apptWithShop as any).shops.owner_user_id as string;

			const emailService = new EmailService(supabase, ownerUserId);
			const sendResult = await emailService.sendAppointmentEmail(
				validation.appointmentId!,
				'appointment_confirmed'
			);

			if (!sendResult.success) {
				console.warn(
					'Appointment confirmed but failed to send seamstress email:',
					sendResult.error
				);
			}
		} else {
			console.warn(
				'Appointment confirmed but could not resolve shop owner for email notification',
				shopJoinError?.message
			);
		}

		return {
			success: true,
			...(validation.appointmentId
				? { appointmentId: validation.appointmentId }
				: {}),
		};
	} catch (error) {
		// Re-throw Next.js notFound errors to trigger 404 page
		if (
			error &&
			typeof error === 'object' &&
			'digest' in error &&
			error.digest === 'NEXT_NOT_FOUND'
		) {
			throw error;
		}

		console.error('Failed to confirm appointment:', error);

		if (error instanceof z.ZodError) {
			return {
				success: false,
				error: 'Invalid confirmation link format',
			};
		}

		return {
			success: false,
			error: 'Failed to confirm appointment',
		};
	}
}

/**
 * Decline an appointment via token
 */
export async function declineAppointment(token: string): Promise<{
	success: boolean;
	error?: string;
	appointmentId?: string;
	alreadyUsed?: boolean;
}> {
	try {
		// Extract just the token part, removing any query parameters or extra characters
		// This handles cases where email clients (like Gmail) add tracking parameters
		const cleanToken =
			token.split('?')[0]?.split('&')[0]?.trim() || token.trim();

		// Validate token format - throw 404 for invalid tokens
		let validatedData;
		try {
			validatedData = ConfirmationTokenSchema.parse({ token: cleanToken });
		} catch (error) {
			if (error instanceof z.ZodError) {
				notFound();
			}
			throw error;
		}

		const supabase = await createClient();

		// Validate token (public action - no auth required)
		const repository = new EmailRepository(supabase, 'system');
		const validation = await repository.validateToken(cleanToken);

		if (!validation.valid) {
			// If already used, treat as success (idempotent UX) and perform no further actions
			if (validation.reason === 'used') {
				return {
					success: true,
					alreadyUsed: true,
					...(validation.appointmentId
						? { appointmentId: validation.appointmentId }
						: {}),
				};
			}
			// Throw 404 for invalid tokens
			if (validation.reason === 'not_found') {
				notFound();
			}
			return {
				success: false,
				error:
					validation.reason === 'expired'
						? 'This cancellation link has expired'
						: 'Invalid cancellation link',
			};
		}

		// Get appointment details for the cancellation email
		const { data: appointment, error: fetchError } = await supabase
			.from('appointments')
			.select('date, start_time, shop_id, shops(owner_user_id)')
			.eq('id', validation.appointmentId!)
			.single();

		if (fetchError || !appointment) {
			throw new Error('Appointment not found');
		}

		// Update appointment status to declined
		const { error: updateError } = await supabase
			.from('appointments')
			.update({ status: 'declined' })
			.eq('id', validation.appointmentId!);

		if (updateError) {
			throw updateError;
		}

		// Mark token as used
		await repository.useToken(cleanToken);

		// Invalidate all other unused tokens for this appointment
		await repository.invalidateUnusedTokensForAppointment(
			validation.appointmentId!
		);

		// Send cancellation email to seamstress
		if (appointment?.shops?.owner_user_id) {
			const ownerUserId = (appointment as any).shops.owner_user_id as string;
			const emailService = new EmailService(supabase, ownerUserId);

			// Format the previous time for the cancellation email
			const previousTime = `${appointment.date} ${appointment.start_time}`;

			const sendResult = await emailService.sendAppointmentEmail(
				validation.appointmentId!,
				'appointment_canceled',
				{ previous_time: previousTime }
			);

			if (!sendResult.success) {
				console.warn(
					'Appointment declined but failed to send seamstress email:',
					sendResult.error
				);
			}
		} else {
			console.warn(
				'Appointment declined but could not resolve shop owner for email notification'
			);
		}

		return {
			success: true,
			...(validation.appointmentId
				? { appointmentId: validation.appointmentId }
				: {}),
		};
	} catch (error) {
		// Re-throw Next.js notFound errors to trigger 404 page
		if (
			error &&
			typeof error === 'object' &&
			'digest' in error &&
			error.digest === 'NEXT_NOT_FOUND'
		) {
			throw error;
		}

		console.error('Failed to decline appointment:', error);

		if (error instanceof z.ZodError) {
			return {
				success: false,
				error: 'Invalid cancellation link format',
			};
		}

		return {
			success: false,
			error: 'Failed to cancel appointment',
		};
	}
}

/**
 * Check if a confirmation token is valid
 */
export async function checkConfirmationToken(token: string): Promise<{
	valid: boolean;
	reason?: 'expired' | 'used' | 'invalid';
}> {
	try {
		// Extract just the token part, removing any query parameters or extra characters
		const cleanToken =
			token.split('?')[0]?.split('&')[0]?.trim() || token.trim();

		// Validate token format - this function returns invalid rather than throwing
		const validatedData = ConfirmationTokenSchema.parse({ token: cleanToken });

		const supabase = await createClient();
		const repository = new EmailRepository(supabase, 'system');

		const validation = await repository.validateToken(cleanToken);

		return {
			valid: validation.valid,
			...(validation.reason
				? { reason: validation.reason as 'expired' | 'used' | 'invalid' }
				: {}),
		};
	} catch (error) {
		return {
			valid: false,
			reason: 'invalid',
		};
	}
}
