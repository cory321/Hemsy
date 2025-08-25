'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { ensureUserAndShop } from './users';
import type { Tables, TablesInsert, TablesUpdate } from '@/types/supabase';

// Validation schemas
const PaymentMethodSettingsSchema = z.object({
  stripeEnabled: z.boolean(),
  cashEnabled: z.boolean(),
  externalPosEnabled: z.boolean(),
  paymentRequiredBeforeService: z.boolean(),
  invoicePrefix: z
    .string()
    .regex(
      /^[A-Z0-9-]{1,10}$/,
      'Invoice prefix must be 1-10 characters (A-Z, 0-9, -)'
    ),
});

export type PaymentMethodSettings = z.infer<typeof PaymentMethodSettingsSchema>;

/**
 * Get shop settings, creating defaults if they don't exist
 */
export async function getShopSettings(): Promise<Tables<'shop_settings'>> {
  const { shop } = await ensureUserAndShop();
  const supabase = await createSupabaseClient();

  // Try to get existing settings
  const { data: settings, error } = await supabase
    .from('shop_settings')
    .select('*')
    .eq('shop_id', shop.id)
    .single();

  if (error && error.code === 'PGRST116') {
    // No settings exist, create defaults
    const { data: newSettings, error: createError } = await supabase
      .from('shop_settings')
      .insert({
        shop_id: shop.id,
        payment_required_before_service: true,
        invoice_prefix: 'INV',
        last_invoice_number: 999,
        stripe_enabled: true,
        cash_enabled: false,
        external_pos_enabled: false,
        payment_settings: {},
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating shop settings:', createError);
      throw new Error('Failed to create shop settings');
    }

    return newSettings;
  }

  if (error) {
    console.error('Error fetching shop settings:', error);
    throw new Error('Failed to fetch shop settings');
  }

  return settings;
}

/**
 * Update payment method settings
 */
export async function updatePaymentMethodSettings(
  settings: PaymentMethodSettings
) {
  try {
    const { shop } = await ensureUserAndShop();
    const validatedSettings = PaymentMethodSettingsSchema.parse(settings);
    const supabase = await createSupabaseClient();

    // Ensure settings exist first
    await getShopSettings();

    // Update settings
    const { data, error } = await supabase
      .from('shop_settings')
      .update({
        stripe_enabled: validatedSettings.stripeEnabled,
        cash_enabled: validatedSettings.cashEnabled,
        external_pos_enabled: validatedSettings.externalPosEnabled,
        payment_required_before_service:
          validatedSettings.paymentRequiredBeforeService,
        invoice_prefix: validatedSettings.invoicePrefix,
        updated_at: new Date().toISOString(),
      })
      .eq('shop_id', shop.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating payment settings:', error);
      throw new Error('Failed to update payment settings');
    }

    revalidatePath('/settings');
    revalidatePath('/invoices');

    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map((e) => e.message).join(', '),
      };
    }
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to update settings',
    };
  }
}

/**
 * Get Stripe account status and configuration
 */
export async function getStripeAccountStatus() {
  const { shop } = await ensureUserAndShop();
  const supabase = await createSupabaseClient();

  const { data: settings } = await supabase
    .from('shop_settings')
    .select(
      `
      stripe_enabled, 
      payment_settings,
      stripe_connect_account_id,
      stripe_connect_status,
      stripe_connect_charges_enabled,
      stripe_connect_payouts_enabled
    `
    )
    .eq('shop_id', shop.id)
    .single();

  // Check Connect account status
  const hasConnectAccount = !!settings?.stripe_connect_account_id;
  const connectActive =
    settings?.stripe_connect_status === 'active' &&
    settings?.stripe_connect_charges_enabled;

  return {
    connected: !!settings?.stripe_enabled,
    paymentMethodsEnabled: settings?.stripe_enabled ? ['card'] : [],
    testMode: true, // Always true for development
    connect: {
      hasAccount: hasConnectAccount,
      accountId: settings?.stripe_connect_account_id,
      status: settings?.stripe_connect_status || 'not_started',
      active: connectActive,
      chargesEnabled: settings?.stripe_connect_charges_enabled || false,
      payoutsEnabled: settings?.stripe_connect_payouts_enabled || false,
    },
  };
}

/**
 * Update Stripe webhook configuration
 */
/**
 * Validate that Stripe payments can be processed
 * (either direct Stripe or Connect account is active)
 */
export async function validateStripePaymentCapability(): Promise<{
  canProcessPayments: boolean;
  requiresConnectOnboarding: boolean;
  error?: string;
}> {
  try {
    const status = await getStripeAccountStatus();

    if (!status.connected) {
      return {
        canProcessPayments: false,
        requiresConnectOnboarding: false,
        error: 'Stripe is not enabled for this shop',
      };
    }

    // Check if Connect is required (you can add feature flag logic here)
    const connectRequired = process.env.STRIPE_CONNECT_REQUIRED === 'true';

    if (connectRequired) {
      if (!status.connect.hasAccount) {
        return {
          canProcessPayments: false,
          requiresConnectOnboarding: true,
          error: 'Stripe Connect account setup is required',
        };
      }

      if (!status.connect.active) {
        return {
          canProcessPayments: false,
          requiresConnectOnboarding: true,
          error: 'Stripe Connect account is not fully activated',
        };
      }
    }

    return {
      canProcessPayments: true,
      requiresConnectOnboarding: false,
    };
  } catch (error) {
    return {
      canProcessPayments: false,
      requiresConnectOnboarding: false,
      error: 'Failed to validate payment capability',
    };
  }
}

/**
 * Update Stripe webhook configuration
 */
export async function updateStripeWebhookConfig(
  webhookUrl: string,
  webhookSecret: string
) {
  try {
    const { shop } = await ensureUserAndShop();
    const supabase = await createSupabaseClient();

    // Ensure settings exist first
    await getShopSettings();

    // Update payment_settings JSONB
    const { data: currentSettings } = await supabase
      .from('shop_settings')
      .select('payment_settings')
      .eq('shop_id', shop.id)
      .single();

    const updatedPaymentSettings = {
      ...((currentSettings?.payment_settings as object) || {}),
      stripe: {
        ...((currentSettings?.payment_settings as any)?.stripe || {}),
        webhookUrl,
        webhookSecret,
        lastUpdated: new Date().toISOString(),
      },
    };

    const { data, error } = await supabase
      .from('shop_settings')
      .update({
        payment_settings: updatedPaymentSettings,
        updated_at: new Date().toISOString(),
      })
      .eq('shop_id', shop.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating Stripe webhook config:', error);
      throw new Error('Failed to update webhook configuration');
    }

    revalidatePath('/settings');

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to update webhook configuration',
    };
  }
}
