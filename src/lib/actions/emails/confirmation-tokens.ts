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
      // If already used, treat as success (idempotent UX) and perform no further actions
      if (validation.reason === 'used') {
        return {
          success: true,
          ...(validation.appointmentId
            ? { appointmentId: validation.appointmentId }
            : {}),
        };
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
    await repository.useToken(validatedData.token);

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
