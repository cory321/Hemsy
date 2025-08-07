'use server';

import { z } from 'zod';
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
}> {
  try {
    // Validate token format
    const validatedData = ConfirmationTokenSchema.parse({ token });

    const supabase = await createClient();

    // Validate token (public action - no auth required)
    const repository = new EmailRepository(supabase, 'system');
    const validation = await repository.validateToken(validatedData.token);

    if (!validation.valid) {
      return {
        success: false,
        error:
          validation.reason === 'expired'
            ? 'This confirmation link has expired'
            : validation.reason === 'used'
              ? 'This confirmation link has already been used'
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
    await repository.useToken(validatedData.token);

    // Send confirmation email to seamstress
    // Get appointment details to find the seamstress
    const { data: appointment } = await supabase
      .from('appointments')
      .select('user_id')
      .eq('id', validation.appointmentId!)
      .single();

    if (appointment) {
      const emailService = new EmailService(supabase, appointment.user_id);
      await emailService.sendAppointmentEmail(
        validation.appointmentId!,
        'appointment_confirmed'
      );
    }

    return {
      success: true,
      appointmentId: validation.appointmentId,
    };
  } catch (error) {
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
 * Check if a confirmation token is valid
 */
export async function checkConfirmationToken(token: string): Promise<{
  valid: boolean;
  reason?: 'expired' | 'used' | 'invalid';
}> {
  try {
    // Validate token format
    const validatedData = ConfirmationTokenSchema.parse({ token });

    const supabase = await createClient();
    const repository = new EmailRepository(supabase, 'system');

    const validation = await repository.validateToken(validatedData.token);

    return {
      valid: validation.valid,
      reason: validation.reason,
    };
  } catch (error) {
    return {
      valid: false,
      reason: 'invalid',
    };
  }
}
