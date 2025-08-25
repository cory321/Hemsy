'use server';

import { z } from 'zod';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';
import { ensureUserAndShop } from './users';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
});

// Validation schemas
const CreateConnectAccountSchema = z.object({
  email: z.string().email(),
  country: z.string().default('US'),
  business_type: z.enum(['individual', 'company']).default('individual'),
});

const CreateAccountLinkSchema = z.object({
  accountId: z.string(),
  type: z
    .enum(['account_onboarding', 'account_update'])
    .default('account_onboarding'),
});

// Types
export interface ConnectAccountStatus {
  id: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  requirements: {
    currently_due: string[];
    eventually_due: string[];
    past_due: string[];
    pending_verification: string[];
  };
  capabilities: {
    card_payments: string;
    transfers: string;
  };
}

/**
 * Create a new Stripe Connect Standard account for a seamstress
 */
export async function createConnectAccount(
  input: z.infer<typeof CreateConnectAccountSchema>
): Promise<{
  success: boolean;
  accountId?: string;
  error?: string;
}> {
  try {
    const { user, shop } = await ensureUserAndShop();
    const validated = CreateConnectAccountSchema.parse(input);
    const supabase = await createClient();

    // Check if Connect account already exists
    const { data: settings } = await supabase
      .from('shop_settings')
      .select('stripe_connect_account_id, stripe_connect_status')
      .eq('shop_id', shop.id)
      .single();

    if (settings?.stripe_connect_account_id) {
      return {
        success: false,
        error: 'Stripe Connect account already exists for this shop',
      };
    }

    // Create Stripe Connect account
    const account = await stripe.accounts.create({
      type: 'standard',
      country: validated.country,
      email: validated.email,
      business_type: validated.business_type,
      metadata: {
        shop_id: shop.id,
        shop_name: shop.name,
        platform: 'threadfolio',
      },
    });

    // Update shop settings with Connect account info
    const { error: updateError } = await supabase.from('shop_settings').upsert(
      {
        shop_id: shop.id,
        stripe_connect_account_id: account.id,
        stripe_connect_status: 'pending',
        stripe_connect_capabilities: (account.capabilities as any) || {},
        stripe_connect_requirements: (account.requirements as any) || {},
        stripe_connect_charges_enabled: account.charges_enabled,
        stripe_connect_payouts_enabled: account.payouts_enabled,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'shop_id',
      }
    );

    if (updateError) {
      console.error('Error updating shop settings:', updateError);
      return { success: false, error: 'Failed to save Connect account info' };
    }

    revalidatePath('/settings');
    return { success: true, accountId: account.id };
  } catch (error) {
    console.error('Error creating Connect account:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to create Connect account',
    };
  }
}

/**
 * Create an account link for Stripe Connect onboarding
 */
export async function createAccountLink(
  input: z.infer<typeof CreateAccountLinkSchema>
): Promise<{
  success: boolean;
  url?: string;
  error?: string;
}> {
  try {
    await ensureUserAndShop(); // Verify authentication

    const validated = CreateAccountLinkSchema.parse(input);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Create account link
    const accountLink = await stripe.accountLinks.create({
      account: validated.accountId,
      refresh_url: `${baseUrl}/settings/stripe-connect?refresh=true`,
      return_url: `${baseUrl}/settings/stripe-connect?success=true`,
      type: validated.type,
    });

    return { success: true, url: accountLink.url };
  } catch (error) {
    console.error('Error creating account link:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to create account link',
    };
  }
}

/**
 * Get Connect account status and sync with local database
 */
export async function getConnectAccountStatus(accountId: string): Promise<{
  success: boolean;
  status?: ConnectAccountStatus;
  error?: string;
}> {
  try {
    await ensureUserAndShop(); // Verify authentication

    // Retrieve account from Stripe
    const account = await stripe.accounts.retrieve(accountId);

    const status: ConnectAccountStatus = {
      id: account.id,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
      requirements: {
        currently_due: account.requirements?.currently_due || [],
        eventually_due: account.requirements?.eventually_due || [],
        past_due: account.requirements?.past_due || [],
        pending_verification: account.requirements?.pending_verification || [],
      },
      capabilities: {
        card_payments: account.capabilities?.card_payments || 'inactive',
        transfers: account.capabilities?.transfers || 'inactive',
      },
    };

    // Sync with local database
    await syncConnectAccountToDB(accountId, account);

    return { success: true, status };
  } catch (error) {
    console.error('Error getting Connect account status:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to get account status',
    };
  }
}

/**
 * Sync Connect account data with local database
 */
export async function syncConnectAccountToDB(
  accountId: string,
  account?: Stripe.Account
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = createAdminClient();

    // If account not provided, fetch from Stripe
    if (!account) {
      account = await stripe.accounts.retrieve(accountId);
    }

    // Determine status based on account state
    let status = 'pending';
    if (account.charges_enabled && account.payouts_enabled) {
      status = 'active';
    } else if (account.requirements?.disabled_reason) {
      status = 'restricted';
    }

    // Update shop settings
    const { error } = await supabase
      .from('shop_settings')
      .update({
        stripe_connect_status: status,
        stripe_connect_capabilities: (account.capabilities as any) || {},
        stripe_connect_requirements: (account.requirements as any) || {},
        stripe_connect_charges_enabled: account.charges_enabled,
        stripe_connect_payouts_enabled: account.payouts_enabled,
        stripe_connect_onboarded_at: account.charges_enabled
          ? new Date().toISOString()
          : null,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_connect_account_id', accountId);

    if (error) {
      console.error('Error syncing Connect account:', error);
      return { success: false, error: 'Failed to sync account data' };
    }

    revalidatePath('/settings');
    return { success: true };
  } catch (error) {
    console.error('Error syncing Connect account:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sync account',
    };
  }
}

/**
 * Check if shop has active Connect account
 */
export async function hasActiveConnectAccount(): Promise<{
  success: boolean;
  hasAccount?: boolean;
  accountId?: string;
  status?: string;
  error?: string;
}> {
  try {
    const { shop } = await ensureUserAndShop();
    const supabase = await createClient();

    // Get shop settings
    const { data: settings } = await supabase
      .from('shop_settings')
      .select(
        `
        stripe_connect_account_id,
        stripe_connect_status,
        stripe_connect_charges_enabled,
        stripe_connect_payouts_enabled
      `
      )
      .eq('shop_id', shop.id)
      .single();

    if (!settings) {
      return { success: true, hasAccount: false };
    }
    const hasAccount = !!settings.stripe_connect_account_id;
    const isActive =
      settings.stripe_connect_status === 'active' &&
      (settings.stripe_connect_charges_enabled || false);

    const result: {
      success: boolean;
      hasAccount?: boolean;
      accountId?: string;
      status?: string;
      error?: string;
    } = {
      success: true,
      hasAccount: isActive,
    };

    if (settings.stripe_connect_account_id) {
      result.accountId = settings.stripe_connect_account_id;
    }
    if (settings.stripe_connect_status) {
      result.status = settings.stripe_connect_status;
    }

    return result;
  } catch (error) {
    console.error('Error checking Connect account:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check account',
    };
  }
}

/**
 * Get Connect account info for current user's shop
 */
export async function getCurrentShopConnectInfo(): Promise<{
  success: boolean;
  connectInfo?: {
    accountId: string | null;
    status: string;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    requirements: any;
    capabilities: any;
  };
  error?: string;
}> {
  try {
    const { shop } = await ensureUserAndShop();
    const supabase = await createClient();

    const { data: settings } = await supabase
      .from('shop_settings')
      .select(
        `
        stripe_connect_account_id,
        stripe_connect_status,
        stripe_connect_charges_enabled,
        stripe_connect_payouts_enabled,
        stripe_connect_requirements,
        stripe_connect_capabilities
      `
      )
      .eq('shop_id', shop.id)
      .single();

    if (!settings) {
      return {
        success: true,
        connectInfo: {
          accountId: null,
          status: 'not_started',
          chargesEnabled: false,
          payoutsEnabled: false,
          requirements: {},
          capabilities: {},
        },
      };
    }

    return {
      success: true,
      connectInfo: {
        accountId: settings.stripe_connect_account_id || null,
        status: settings.stripe_connect_status || 'not_started',
        chargesEnabled: settings.stripe_connect_charges_enabled || false,
        payoutsEnabled: settings.stripe_connect_payouts_enabled || false,
        requirements: settings.stripe_connect_requirements,
        capabilities: settings.stripe_connect_capabilities,
      },
    };
  } catch (error) {
    console.error('Error getting Connect info:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to get Connect info',
    };
  }
}

/**
 * Update Connect account with test data for development/testing
 * This bypasses real SSN and document requirements and enables charges
 */
export async function updateConnectAccountWithTestData(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { shop } = await ensureUserAndShop();
    const supabase = await createClient();

    // Get shop settings to get Connect account ID
    const { data: settings } = await supabase
      .from('shop_settings')
      .select('stripe_connect_account_id')
      .eq('shop_id', shop.id)
      .single();

    if (!settings?.stripe_connect_account_id) {
      return {
        success: false,
        error:
          'No Stripe Connect account found. Please complete onboarding first.',
      };
    }

    const accountId = settings.stripe_connect_account_id;

    // Get account details first to check the type and access
    let account: Stripe.Account;
    try {
      account = await stripe.accounts.retrieve(accountId);
    } catch (error: any) {
      if (
        error.type === 'StripePermissionError' ||
        error.code === 'account_invalid'
      ) {
        // Account access was revoked or account doesn't exist
        console.error('Connect account access error:', error.message);

        // Clear the invalid account ID from database
        await supabase
          .from('shop_settings')
          .update({
            stripe_connect_account_id: null,
            stripe_connect_status: 'not_started',
            stripe_connect_capabilities: null,
            stripe_connect_requirements: null,
            stripe_connect_charges_enabled: false,
            stripe_connect_payouts_enabled: false,
            stripe_connect_onboarded_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq('shop_id', shop.id);

        return {
          success: false,
          error: `Connect account access was revoked or account doesn't exist. The account has been cleared from your settings. Please create a new Connect account using the "Create Test Merchant" option.`,
        };
      }
      throw error; // Re-throw other errors
    }

    if (account.type === 'standard') {
      // For Standard accounts, we can't set TOS acceptance or most verification data
      // Standard accounts must complete their own onboarding flow
      console.log(
        'Standard account detected - limited test data can be applied'
      );

      // We can only update basic business profile information
      await stripe.accounts.update(accountId, {
        business_profile: {
          mcc: '5045', // Computer software stores
          url: 'https://threadfolio.com',
        },
      });

      // For Standard accounts, the merchant needs to complete onboarding
      // But we can check if they're already verified
      if (account.charges_enabled) {
        console.log('Standard account already has charges enabled');
      } else {
        console.log('Standard account needs to complete onboarding flow');
        // Return early - we can't bypass verification for Standard accounts
        await syncConnectAccountToDB(accountId, account);
        return {
          success: false,
          error:
            'Standard accounts require completing the onboarding flow. Please use the Connect onboarding link.',
        };
      }
    } else {
      // For Custom accounts, we can set all the test data
      await stripe.accounts.update(accountId, {
        tos_acceptance: {
          date: Math.floor(Date.now() / 1000), // Current timestamp
          ip: '127.0.0.1', // Test IP
        },
        business_profile: {
          mcc: '5045', // Computer software stores
          url: 'https://threadfolio.com',
        },
        // For individual accounts (most seamstresses)
        individual: {
          first_name: 'Test',
          last_name: 'Seamstress',
          email: shop.email || 'test@example.com',
          phone: '+15555551234',
          ssn_last_4: '0000', // Test SSN
          address: {
            line1: '123 Main St',
            city: 'San Francisco',
            state: 'CA',
            postal_code: '94102',
            country: 'US',
          },
          dob: {
            day: 1,
            month: 1,
            year: 1990,
          },
          // Test document (this satisfies document requirements)
          verification: {
            document: {
              front: 'file_identity_document_success', // Test file token
            },
          },
        },
        // For company accounts (if business type is company)
        company: {
          name: shop.name || 'Test Seamstress Shop',
          tax_id: '000000000', // Test EIN
          phone: '+15555551234',
          address: {
            line1: '123 Main St',
            city: 'San Francisco',
            state: 'CA',
            postal_code: '94102',
            country: 'US',
          },
          // Test document for company verification
          verification: {
            document: {
              front: 'file_identity_document_success', // Test file token
            },
          },
        },
        // External account (bank account) for payouts
        external_account: {
          object: 'bank_account',
          country: 'US',
          currency: 'usd',
          routing_number: '110000000', // Test routing number
          account_number: '000123456789', // Test account number
          account_holder_type: 'individual',
        },
      });
    }

    // Sync the updated account data back to our database
    await syncConnectAccountToDB(accountId);

    return { success: true };
  } catch (error) {
    console.error('Error updating Connect account with test data:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to update account with test data',
    };
  }
}

/**
 * Diagnose Connect account issues and provide guidance
 */
export async function diagnoseConnectAccount(): Promise<{
  success: boolean;
  diagnosis?: {
    hasAccount: boolean;
    accountId?: string;
    accountType?: string;
    accountStatus?: string;
    accessError?: boolean;
    recommendations: string[];
  };
  error?: string;
}> {
  try {
    const { shop } = await ensureUserAndShop();
    const supabase = await createClient();

    // Get shop settings
    const { data: settings } = await supabase
      .from('shop_settings')
      .select('stripe_connect_account_id, stripe_connect_status')
      .eq('shop_id', shop.id)
      .single();

    const diagnosis: {
      hasAccount: boolean;
      accountId?: string;
      accountType?: string;
      accountStatus?: string;
      accessError?: boolean;
      recommendations: string[];
    } = {
      hasAccount: !!settings?.stripe_connect_account_id,
      recommendations: [],
    };

    if (settings?.stripe_connect_account_id) {
      diagnosis.accountId = settings.stripe_connect_account_id;
    }

    if (settings?.stripe_connect_status) {
      diagnosis.accountStatus = settings.stripe_connect_status;
    } else {
      diagnosis.accountStatus = 'not_started';
    }

    diagnosis.accessError = false;

    if (!settings?.stripe_connect_account_id) {
      diagnosis.recommendations.push(
        'No Connect account found. Use "Create Test Merchant" to create a new Custom account for testing.'
      );
      return { success: true, diagnosis };
    }

    // Try to retrieve account details
    try {
      const account = await stripe.accounts.retrieve(
        settings.stripe_connect_account_id
      );
      diagnosis.accountType = account.type;

      if (account.type === 'standard') {
        diagnosis.recommendations.push(
          'Standard account detected. These require completing the onboarding flow and cannot be bypassed with test data.'
        );
        if (!account.charges_enabled) {
          diagnosis.recommendations.push(
            'Account needs to complete onboarding. Use the Connect onboarding link in your settings.'
          );
        }
      } else if (account.type === 'custom') {
        diagnosis.recommendations.push(
          'Custom account detected. This can be populated with test data for immediate testing.'
        );
      }

      if (account.charges_enabled) {
        diagnosis.recommendations.push(
          '✅ Account has charges enabled and is ready for payments.'
        );
      } else {
        diagnosis.recommendations.push(
          '❌ Account does not have charges enabled yet.'
        );
      }
    } catch (error: any) {
      diagnosis.accessError = true;
      if (
        error.type === 'StripePermissionError' ||
        error.code === 'account_invalid'
      ) {
        diagnosis.recommendations.push(
          '❌ Platform no longer has access to this Connect account. It may have been disconnected or deleted.'
        );
        diagnosis.recommendations.push(
          'Clear the account and create a new one using "Create Test Merchant".'
        );
      } else {
        diagnosis.recommendations.push(
          `❌ Error accessing account: ${error.message}`
        );
      }
    }

    return { success: true, diagnosis };
  } catch (error) {
    console.error('Error diagnosing Connect account:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to diagnose account',
    };
  }
}

/**
 * Clear the existing Connect account from settings
 * Use this when the account is inaccessible or problematic
 */
export async function clearConnectAccount(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { shop } = await ensureUserAndShop();
    const supabase = await createClient();

    // Clear all Connect account data from shop settings
    const { error: updateError } = await supabase
      .from('shop_settings')
      .update({
        stripe_connect_account_id: null,
        stripe_connect_status: 'not_started',
        stripe_connect_capabilities: null,
        stripe_connect_requirements: null,
        stripe_connect_charges_enabled: false,
        stripe_connect_payouts_enabled: false,
        stripe_connect_onboarded_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('shop_id', shop.id);

    if (updateError) {
      console.error('Error clearing Connect account:', updateError);
      return {
        success: false,
        error: 'Failed to clear Connect account settings',
      };
    }

    revalidatePath('/settings');
    return { success: true };
  } catch (error) {
    console.error('Error clearing Connect account:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to clear account',
    };
  }
}

/**
 * Create a fully activated test merchant account for development
 * This creates a CUSTOM account (not Standard) with test data pre-populated
 */
export async function createTestMerchant(input: {
  email: string;
  businessName: string;
  country?: string;
  businessType?: 'individual' | 'company';
}): Promise<{
  success: boolean;
  accountId?: string;
  error?: string;
}> {
  try {
    const { shop } = await ensureUserAndShop();
    const supabase = await createClient();

    // Check if Connect account already exists
    const { data: settings } = await supabase
      .from('shop_settings')
      .select('stripe_connect_account_id, stripe_connect_status')
      .eq('shop_id', shop.id)
      .single();

    if (settings?.stripe_connect_account_id) {
      return {
        success: false,
        error:
          'A Connect account already exists for this shop. Use "Activate Existing Account" instead.',
      };
    }

    // Create CUSTOM Connect account with test data pre-populated
    // Custom accounts allow us to bypass verification for testing
    const accountParams: Stripe.AccountCreateParams = {
      type: 'custom', // Use Custom instead of Standard for testing
      country: input.country || 'US',
      email: input.email,
      business_type: input.businessType || 'individual',
      metadata: {
        shop_id: shop.id,
        shop_name: shop.name,
        platform: 'threadfolio',
        test_account: 'true',
      },
      // Pre-populate with test data to enable charges immediately
      tos_acceptance: {
        date: Math.floor(Date.now() / 1000),
        ip: '127.0.0.1',
      },
      business_profile: {
        mcc: '5045', // Computer software stores
        url: 'https://threadfolio.com',
      },
      // Request capabilities
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      // External account for payouts
      external_account: {
        object: 'bank_account',
        country: input.country || 'US',
        currency: 'usd',
        routing_number: '110000000',
        account_number: '000123456789',
        account_holder_type: input.businessType || 'individual',
      },
    };

    // Add individual or company info based on business type
    if (input.businessType === 'individual') {
      accountParams.individual = {
        first_name: 'Test',
        last_name: 'Seamstress',
        email: input.email,
        phone: '+15555551234',
        ssn_last_4: '0000',
        address: {
          line1: '123 Main St',
          city: 'San Francisco',
          state: 'CA',
          postal_code: '94102',
          country: input.country || 'US',
        },
        dob: {
          day: 1,
          month: 1,
          year: 1990,
        },
        verification: {
          document: {
            front: 'file_identity_document_success',
          },
        },
      };
    } else {
      accountParams.company = {
        name: input.businessName,
        tax_id: '000000000',
        phone: '+15555551234',
        address: {
          line1: '123 Main St',
          city: 'San Francisco',
          state: 'CA',
          postal_code: '94102',
          country: input.country || 'US',
        },
        verification: {
          document: {
            front: 'file_identity_document_success',
          },
        },
      };
    }

    const account = await stripe.accounts.create(accountParams);

    // Update shop settings with Connect account info
    const { error: updateError } = await supabase.from('shop_settings').upsert(
      {
        shop_id: shop.id,
        stripe_connect_account_id: account.id,
        stripe_connect_status: account.charges_enabled ? 'active' : 'pending',
        stripe_connect_capabilities: (account.capabilities as any) || {},
        stripe_connect_requirements: (account.requirements as any) || {},
        stripe_connect_charges_enabled: account.charges_enabled,
        stripe_connect_payouts_enabled: account.payouts_enabled,
        stripe_connect_onboarded_at: account.charges_enabled
          ? new Date().toISOString()
          : null,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'shop_id',
      }
    );

    if (updateError) {
      console.error('Error updating shop settings:', updateError);
      return { success: false, error: 'Failed to save Connect account info' };
    }

    revalidatePath('/settings');
    return {
      success: true,
      accountId: account.id,
    };
  } catch (error) {
    console.error('Error creating test merchant:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to create test merchant',
    };
  }
}
