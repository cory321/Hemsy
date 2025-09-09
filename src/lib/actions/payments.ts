'use server';

import { z } from 'zod';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { ensureUserAndShop } from './users';
import { revalidatePath } from 'next/cache';
import { sendInvoiceReceiptEmail } from './emails/invoice-emails';
import { checkPaymentStatus } from './payment-status';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
});

// Types
export interface PaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
  amountCents: number;
  currency: string;
  // Account type for tracking
  accountType?: string;
  // For direct charges with connected accounts (legacy)
  connectedAccountId?: string;
  isDirectCharge?: boolean;
}

// Validation schemas
const CreatePaymentIntentSchema = z.object({
  invoiceId: z.string().uuid(),
  paymentType: z.enum(['remainder', 'custom']),
  amountCents: z.number().int().positive().optional(), // Optional, will calculate from invoice if not provided
  returnUrl: z.string().url().optional(),
});

const ConfirmPaymentSchema = z.object({
  paymentIntentId: z.string(),
  paymentMethodId: z.string(),
});

/**
 * Create a Stripe PaymentIntent for an invoice payment
 *
 * STRIPE CONNECT FLOW FOR SEAMSTRESS PAYMENTS:
 * ============================================
 *
 * Scenario: Seamstress charges client's credit card for tailoring services
 * - Card Holder: Client (customer receiving services)
 * - Merchant: Seamstress (connected account providing services)
 * - Platform: Hemsy (facilitates the transaction)
 *
 * Payment Flow:
 * 1. Client's card is charged via Stripe PaymentIntent
 * 2. Funds are automatically transferred to seamstress's connected account
 * 3. Platform can optionally take application fees
 * 4. Seamstress receives funds directly in their bank account
 *
 * Technical Implementation:
 * - Uses "destination charges" pattern (transfer_data.destination)
 * - PaymentIntent created on platform account
 * - Funds transferred to connected account automatically
 * - No separate Transfer API call needed
 * - Connected account appears as merchant on client's statement
 *
 * Security & Compliance:
 * - Card-present transaction (lower risk)
 * - Merchant-assisted payment (seamstress inputs card details)
 * - Enhanced metadata for fraud detection
 * - Proper statement descriptors for client's bank statement
 */
export async function createPaymentIntent(
  params: z.infer<typeof CreatePaymentIntentSchema>
): Promise<{
  success: boolean;
  data?: PaymentIntentResult | undefined;
  error?: string;
}> {
  try {
    const { shop } = await ensureUserAndShop();
    const validated = CreatePaymentIntentSchema.parse(params);
    const supabase = await createClient();

    // Get shop settings to check for Connect account
    const { data: shopSettings } = await supabase
      .from('shop_settings')
      .select(
        `
				stripe_connect_account_id,
				stripe_connect_status,
				stripe_connect_charges_enabled
			`
      )
      .eq('shop_id', shop.id)
      .single();

    // TEMPORARILY DISABLED: Check if we can create a new payment
    // const statusCheck = await checkPaymentStatus(validated.invoiceId);
    // if (!statusCheck.canCreateNewPayment) {
    // 	return {
    // 		success: false,
    // 		error: statusCheck.message,
    // 		data: statusCheck.existingPaymentIntent
    // 			? {
    // 					clientSecret: '',
    // 					paymentIntentId: statusCheck.existingPaymentIntent,
    // 					amountCents: 0,
    // 					currency: 'usd',
    // 				}
    // 			: undefined,
    // 	};
    // }

    // Get invoice details
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(
        `
        *,
        client:clients(*),
        payments(*)
      `
      )
      .eq('id', validated.invoiceId)
      .eq('shop_id', shop.id)
      .single();

    if (invoiceError || !invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.status === 'paid') {
      throw new Error('Invoice is already paid');
    }

    if (invoice.status === 'cancelled') {
      throw new Error('Cannot process payment for cancelled invoice');
    }

    // Check for existing pending Stripe payments
    const existingPendingPayments = invoice.payments.filter(
      (p: any) => p.payment_method === 'stripe' && p.status === 'pending'
    );

    if (existingPendingPayments.length > 0) {
      // Check if any pending payments are recent (within last 15 minutes)
      const recentPending = existingPendingPayments.filter((p: any) => {
        const paymentAge = Date.now() - new Date(p.created_at).getTime();
        return paymentAge < 15 * 60 * 1000; // 15 minutes
      });

      if (recentPending.length > 0) {
        const pendingPayment = recentPending[0];
        // Return existing payment intent instead of creating new one
        return {
          success: true,
          data: {
            clientSecret:
              (pendingPayment?.stripe_metadata as any)?.client_secret || '',
            paymentIntentId: pendingPayment?.stripe_payment_intent_id || '',
            amountCents: pendingPayment?.amount_cents || 0,
            currency: 'usd',
          },
        };
      }

      // If pending payments are old (>15 min), cancel them first
      for (const oldPending of existingPendingPayments) {
        if (oldPending.stripe_payment_intent_id) {
          try {
            await stripe.paymentIntents.cancel(
              oldPending.stripe_payment_intent_id
            );
            // Mark as failed in database
            await supabase
              .from('payments')
              .update({
                status: 'failed',
                processed_at: new Date().toISOString(),
              })
              .eq('id', oldPending.id);
          } catch (error) {
            console.warn('Failed to cancel old payment intent:', error);
          }
        }
      }
    }

    // Calculate amount to charge
    let amountToCharge = 0;
    // Filter out refund transactions (which have negative amounts) to avoid double-counting
    // Refunds are already tracked in the payment's refunded_amount_cents field
    const totalPaid = invoice.payments
      .filter(
        (p: any) =>
          (p.status === 'completed' ||
            p.status === 'partially_refunded' ||
            p.status === 'refunded') &&
          p.payment_type !== 'refund' // Exclude refund transactions
      )
      .reduce((sum: number, p: any) => {
        // Account for refunds by subtracting the refunded amount from the payment
        const netPayment = p.amount_cents - (p.refunded_amount_cents || 0);
        return sum + netPayment;
      }, 0);

    if (validated.amountCents) {
      // Use provided amount (for custom partial payments)
      amountToCharge = validated.amountCents;
    } else {
      // Calculate based on payment type
      switch (validated.paymentType) {
        case 'custom':
          amountToCharge =
            validated.amountCents || invoice.amount_cents - totalPaid;
          break;
        case 'remainder':
          amountToCharge = invoice.amount_cents - totalPaid;
          break;
      }
    }

    if (amountToCharge <= 0) {
      throw new Error('Invalid payment amount');
    }

    // Determine if we should use Connect account for destination charges
    // This ensures the seamstress (connected account) receives payments directly
    const useConnectAccount =
      shopSettings?.stripe_connect_account_id &&
      shopSettings?.stripe_connect_status === 'active' &&
      shopSettings?.stripe_connect_charges_enabled;

    console.log('Payment flow decision:', {
      hasConnectAccount: !!shopSettings?.stripe_connect_account_id,
      connectStatus: shopSettings?.stripe_connect_status,
      chargesEnabled: shopSettings?.stripe_connect_charges_enabled,
      useConnectAccount,
      paymentScenario: useConnectAccount
        ? 'destination_charge_to_seamstress'
        : 'platform_payment',
    });

    // Determine charge type based on configuration
    const USE_DIRECT_CHARGES = true; // Set to true to offload compliance to seamstresses

    // Base PaymentIntent configuration
    const paymentIntentConfig: Stripe.PaymentIntentCreateParams = {
      amount: amountToCharge,
      currency: 'usd',
      metadata: {
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        shop_id: shop.id,
        payment_type: validated.paymentType,
        client_name: `${invoice.client.first_name} ${invoice.client.last_name}`,
        client_email: invoice.client.email,
        payment_context: 'card_present_merchant_assisted',
        merchant_present: 'true',
        // Enhanced security metadata
        transaction_type: 'card_present',
        merchant_category: 'personal_services', // Tailoring/alterations
        pos_environment: 'seamstress_shop',
        risk_level: 'low', // Card present = lower risk
        authentication_method: 'merchant_assisted',
        // Connect account info
        connect_account_id: shopSettings?.stripe_connect_account_id || '',
        payment_flow: useConnectAccount ? 'connect_transfer' : 'direct',
      },
      description: `Payment for invoice ${invoice.invoice_number}`,
      automatic_payment_methods: {
        enabled: true,
        // Disable saved payment methods and Link for card-present
        allow_redirects: 'never', // No redirects in POS environment
      },
      // Don't send receipt email immediately - let seamstress control this
      // receipt_email: invoice.client.email,

      // Card-present specific settings
      capture_method: 'automatic', // Immediate capture for POS
      payment_method_options: {
        card: {
          request_three_d_secure: 'automatic', // Handle 3DS when required
        },
      },
      // Statement descriptor suffix for customer's bank statement (card payments only support suffix)
      // Must contain at least one Latin character (a-z, A-Z)
      statement_descriptor_suffix: `SHP${invoice.invoice_number.slice(-3)}`, // "SHP" + last 3 digits
    };

    // Create PaymentIntent based on charge type
    let paymentIntent: Stripe.PaymentIntent;

    if (
      USE_DIRECT_CHARGES &&
      useConnectAccount &&
      shopSettings?.stripe_connect_account_id
    ) {
      // DIRECT CHARGES - Seamstress is merchant of record (offloads compliance)
      // The charge happens directly on the connected account

      // Add platform fee if you want to monetize (optional)
      const PLATFORM_FEE_PERCENTAGE = 0; // Set to 0 to disable platform fee (e.g., 0.025 for 2.5% fee)
      if (PLATFORM_FEE_PERCENTAGE > 0) {
        paymentIntentConfig.application_fee_amount = Math.round(
          amountToCharge * PLATFORM_FEE_PERCENTAGE
        );
      }

      // Enhanced metadata
      paymentIntentConfig.metadata = {
        ...paymentIntentConfig.metadata,
        connect_flow_type: 'direct_charge',
        merchant_account_id: shopSettings.stripe_connect_account_id,
        payment_scenario: 'seamstress_is_merchant_of_record',
      };

      // Create payment on the CONNECTED ACCOUNT (seamstress)
      paymentIntent = await stripe.paymentIntents.create(paymentIntentConfig, {
        stripeAccount: shopSettings.stripe_connect_account_id, // Key difference!
      });
    } else if (useConnectAccount && shopSettings?.stripe_connect_account_id) {
      // DESTINATION CHARGES - Platform is merchant of record (current approach)
      // Keep existing logic for backwards compatibility or fallback

      paymentIntentConfig.transfer_data = {
        destination: shopSettings.stripe_connect_account_id,
      };

      // Optional: Add application fee (currently disabled, set to desired percentage to enable)
      // const PLATFORM_FEE_PERCENTAGE = 0; // e.g., 0.025 for 2.5% fee
      // if (PLATFORM_FEE_PERCENTAGE > 0) {
      //   paymentIntentConfig.application_fee_amount = Math.round(amountToCharge * PLATFORM_FEE_PERCENTAGE);
      // }

      paymentIntentConfig.metadata = {
        ...paymentIntentConfig.metadata,
        connect_flow_type: 'destination_charge',
        merchant_account_id: shopSettings.stripe_connect_account_id,
        payment_scenario: 'platform_is_merchant_of_record',
      };

      // Create payment on PLATFORM account
      paymentIntent = await stripe.paymentIntents.create(paymentIntentConfig);
    } else {
      // No Connect account - regular platform payment
      paymentIntent = await stripe.paymentIntents.create(paymentIntentConfig);
    }

    // Validate that the payment intent was created successfully
    if (!paymentIntent.id || !paymentIntent.client_secret) {
      throw new Error(
        'Invalid payment intent created - missing ID or client secret'
      );
    }

    // Determine if this was a direct charge for verification
    const isDirectCharge =
      USE_DIRECT_CHARGES &&
      useConnectAccount &&
      shopSettings?.stripe_connect_account_id;

    // Verify the payment intent exists in Stripe (additional safety check)
    try {
      if (isDirectCharge && shopSettings?.stripe_connect_account_id) {
        // For direct charges, verify on the connected account
        await stripe.paymentIntents.retrieve(paymentIntent.id, {
          stripeAccount: shopSettings.stripe_connect_account_id,
        });
      } else {
        // For destination charges or platform payments, verify on platform account
        await stripe.paymentIntents.retrieve(paymentIntent.id);
      }
    } catch (retrieveError: any) {
      console.error('Failed to verify payment intent exists:', retrieveError);
      throw new Error(
        'Payment intent verification failed - may indicate account mismatch'
      );
    }

    // Create pending payment record
    const { error: paymentError } = await supabase.from('payments').insert({
      invoice_id: invoice.id,
      payment_type: validated.paymentType,
      payment_method: 'stripe',
      amount_cents: amountToCharge,
      status: 'pending',
      stripe_payment_intent_id: paymentIntent.id,
      stripe_metadata: {
        client_secret: paymentIntent.client_secret,
        created_at: new Date().toISOString(),
        verified_at: new Date().toISOString(), // Track when we verified it exists
      },
    });

    if (paymentError) {
      // Cancel the PaymentIntent if we can't record it
      await stripe.paymentIntents.cancel(paymentIntent.id);
      throw new Error('Failed to record payment intent');
    }

    // Include connected account ID if this was a direct charge (already defined above)

    return {
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret!,
        paymentIntentId: paymentIntent.id,
        amountCents: amountToCharge,
        currency: paymentIntent.currency,
        // CRITICAL: Include connected account ID for direct charges
        // Frontend needs this to initialize Stripe Elements correctly
        ...(isDirectCharge && shopSettings?.stripe_connect_account_id
          ? {
              connectedAccountId: shopSettings.stripe_connect_account_id,
              isDirectCharge: true,
            }
          : {}),
      },
    };
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
        error instanceof Error
          ? error.message
          : 'Failed to create payment intent',
    };
  }
}

/**
 * Handle successful payment from webhook
 */
export async function handleSuccessfulPayment(
  paymentIntentId: string,
  metadata?: Record<string, any>
) {
  const supabase = await createClient();

  // Find the payment record
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .select('*, invoice:invoices(*)')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .single();

  if (paymentError || !payment) {
    console.error('Payment record not found for intent:', paymentIntentId);
    throw new Error('Payment record not found');
  }

  // Update payment status
  const { error: updateError } = await supabase
    .from('payments')
    .update({
      status: 'completed',
      processed_at: new Date().toISOString(),
      stripe_metadata: {
        ...((payment.stripe_metadata as object) || {}),
        completed_at: new Date().toISOString(),
        ...metadata,
      },
    })
    .eq('id', payment.id);

  if (updateError) {
    console.error('Error updating payment status:', updateError);
    throw new Error('Failed to update payment status');
  }

  // Calculate total paid for invoice
  const { data: allPayments } = await supabase
    .from('payments')
    .select('amount_cents')
    .eq('invoice_id', payment.invoice_id)
    .eq('status', 'completed');

  const totalPaid =
    allPayments?.reduce((sum, p) => sum + p.amount_cents, 0) || 0;

  // Update invoice status
  let newStatus = payment.invoice.status;
  if (totalPaid >= payment.invoice.amount_cents) {
    newStatus = 'paid';
  } else if (totalPaid > 0) {
    newStatus = 'partially_paid';
  }

  if (newStatus !== payment.invoice.status) {
    const { error: invoiceError } = await supabase
      .from('invoices')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.invoice_id);

    if (invoiceError) {
      console.error('Error updating invoice status:', invoiceError);
    }

    // Log status change
    await supabase.from('invoice_status_history').insert({
      invoice_id: payment.invoice_id,
      previous_status: payment.invoice.status,
      new_status: newStatus,
      changed_by: 'system',
      reason: `Payment of $${(payment.amount_cents / 100).toFixed(2)} processed via Stripe`,
      metadata: { payment_intent_id: paymentIntentId },
    });
  }

  // Update order if fully paid
  if (newStatus === 'paid' && payment.invoice.order_id) {
    await supabase
      .from('orders')
      .update({
        is_paid: true,
        paid_at: new Date().toISOString(),
        // Note: Order status should be determined by garment stages, not payment status
        // The calculate_order_status() function and triggers handle this properly
      })
      .eq('id', payment.invoice.order_id);
  }

  // Send receipt email
  try {
    if (newStatus === 'paid') {
      // Send invoice receipt
      await sendInvoiceReceiptEmail(payment.invoice_id);
    }
  } catch (emailError) {
    console.error('Failed to send receipt email:', emailError);
    // Don't throw - payment was successful even if email failed
  }

  revalidatePath('/invoices');
  revalidatePath(`/invoices/${payment.invoice_id}`);
}

/**
 * Handle failed payment from webhook
 */
export async function handleFailedPayment(
  paymentIntentId: string,
  failureReason?: string,
  metadata?: Record<string, any>
) {
  const supabase = await createClient();

  // Find and update the payment record
  const { error } = await supabase
    .from('payments')
    .update({
      status: 'failed',
      stripe_metadata: {
        failed_at: new Date().toISOString(),
        failure_reason: failureReason,
        ...metadata,
      },
    })
    .eq('stripe_payment_intent_id', paymentIntentId);

  if (error) {
    console.error('Error updating failed payment:', error);
    throw new Error('Failed to update payment status');
  }

  revalidatePath('/invoices');
}

/**
 * Cancel a pending Stripe payment
 */
export async function cancelPendingPayment(paymentId: string) {
  try {
    const { shop } = await ensureUserAndShop();
    const supabase = await createClient();

    // Get payment details with validation
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*, invoice:invoices!inner(shop_id)')
      .eq('id', paymentId)
      .eq('invoice.shop_id', shop.id)
      .single();

    if (paymentError || !payment) {
      throw new Error('Payment not found');
    }

    if (payment.payment_method !== 'stripe') {
      throw new Error('Can only cancel Stripe payments');
    }

    if (payment.status !== 'pending') {
      throw new Error('Can only cancel pending payments');
    }

    if (!payment.stripe_payment_intent_id) {
      throw new Error('No Stripe payment intent found');
    }

    // Cancel the payment intent on Stripe
    try {
      await stripe.paymentIntents.cancel(payment.stripe_payment_intent_id);
    } catch (stripeError: any) {
      // If already cancelled on Stripe, that's okay
      if (stripeError.code !== 'payment_intent_invalid_state') {
        throw new Error(`Failed to cancel on Stripe: ${stripeError.message}`);
      }
    }

    // Update payment status in database
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: 'failed',
        processed_at: new Date().toISOString(),
        notes: 'Cancelled by merchant',
        stripe_metadata: {
          ...((payment.stripe_metadata as object) || {}),
          cancelled_at: new Date().toISOString(),
          cancelled_by: 'merchant',
        },
      })
      .eq('id', paymentId);

    if (updateError) {
      throw new Error('Failed to update payment status');
    }

    revalidatePath('/invoices');
    revalidatePath(`/invoices/${payment.invoice_id}`);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to cancel payment',
    };
  }
}

/**
 * Get payment history for an invoice
 */
export async function getInvoicePayments(invoiceId: string) {
  const { shop } = await ensureUserAndShop();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching payments:', error);
    throw new Error('Failed to fetch payment history');
  }

  // Verify the invoice belongs to the shop
  const { data: invoice } = await supabase
    .from('invoices')
    .select('shop_id')
    .eq('id', invoiceId)
    .single();

  if (!invoice || invoice.shop_id !== shop.id) {
    throw new Error('Invoice not found');
  }

  return data;
}

/**
 * Get all payments and refunds for an invoice as a combined transaction history
 */
export async function getInvoicePaymentHistory(invoiceId: string) {
  const { shop } = await ensureUserAndShop();
  const supabase = await createClient();

  // Verify the invoice belongs to the shop first
  const { data: invoice } = await supabase
    .from('invoices')
    .select('shop_id')
    .eq('id', invoiceId)
    .single();

  if (!invoice || invoice.shop_id !== shop.id) {
    throw new Error('Invoice not found');
  }

  // Get payments
  const { data: payments, error: paymentsError } = await supabase
    .from('payments')
    .select('*')
    .eq('invoice_id', invoiceId);

  if (paymentsError) {
    console.error('Error fetching payments:', paymentsError);
    throw new Error('Failed to fetch payment history');
  }

  // Get refunds for these payments
  const paymentIds = payments.map((p) => p.id);
  let refunds: any[] = [];

  if (paymentIds.length > 0) {
    const { data: refundsData, error: refundsError } = await supabase
      .from('refunds')
      .select(
        `
				*,
				payment:payments!inner(
					id,
					payment_method,
					payment_type,
					invoice_id
				)
			`
      )
      .in('payment_id', paymentIds);

    if (refundsError) {
      console.error('Error fetching refunds:', refundsError);
      throw new Error('Failed to fetch refund history');
    }

    refunds = refundsData || [];
  }

  // Combine payments and refunds into a unified transaction history
  const transactions = [
    // Add payments as positive transactions
    ...payments.map((payment) => ({
      id: payment.id,
      type: 'payment' as const,
      payment_type: payment.payment_type,
      payment_method: payment.payment_method,
      amount_cents: payment.amount_cents,
      status: payment.status,
      stripe_payment_intent_id: payment.stripe_payment_intent_id,
      created_at: payment.created_at,
      processed_at: payment.processed_at,
      notes: payment.notes,
      stripe_metadata: payment.stripe_metadata,
      refunded_amount_cents: payment.refunded_amount_cents,
      refunded_at: payment.refunded_at,
      refund_reason: payment.refund_reason,
    })),
    // Add refunds as negative transactions (credits)
    ...refunds.map((refund) => ({
      id: refund.id,
      type: 'refund' as const,
      payment_type: 'refund',
      payment_method: refund.payment.payment_method,
      amount_cents: -refund.amount_cents, // Negative for credits
      status: refund.status,
      stripe_payment_intent_id: refund.stripe_refund_id,
      created_at: refund.created_at,
      processed_at: refund.processed_at,
      notes: refund.reason,
      stripe_metadata: refund.stripe_metadata,
      refund_method: refund.refund_method,
      refund_type: refund.refund_type,
      original_payment_id: refund.payment_id,
      merchant_notes: refund.merchant_notes,
    })),
  ];

  // Sort by creation date, most recent first
  transactions.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return transactions;
}

/**
 * Refund a payment
 */
export async function refundPayment(
  paymentId: string,
  amountCents?: number,
  reason?: string
) {
  try {
    const { shop, user } = await ensureUserAndShop();
    const supabase = await createClient();

    // Get payment details
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*, invoice:invoices!inner(shop_id, invoice_number)')
      .eq('id', paymentId)
      .eq('invoice.shop_id', shop.id)
      .single();

    if (paymentError || !payment) {
      throw new Error('Payment not found');
    }

    if (
      payment.status !== 'completed' &&
      payment.status !== 'partially_refunded'
    ) {
      throw new Error(
        'Can only refund completed or partially refunded payments'
      );
    }

    if (payment.payment_method !== 'stripe') {
      throw new Error('Can only refund Stripe payments through this interface');
    }

    if (!payment.stripe_payment_intent_id) {
      throw new Error('No Stripe payment intent found');
    }

    // Get shop settings to check for connected account
    const { data: shopSettings } = await supabase
      .from('shop_settings')
      .select('stripe_connect_account_id, stripe_connect_status')
      .eq('shop_id', shop.id)
      .single();

    // Calculate refund amount and check limits
    const refundAmount = amountCents || payment.amount_cents;
    const previouslyRefunded = payment.refunded_amount_cents || 0;
    const totalAfterRefund = previouslyRefunded + refundAmount;

    if (refundAmount <= 0) {
      throw new Error('Refund amount must be greater than $0');
    }

    if (totalAfterRefund > payment.amount_cents) {
      const remainingRefundable = payment.amount_cents - previouslyRefunded;
      throw new Error(
        `Refund amount exceeds remaining refundable amount. ` +
          `Maximum refundable: $${(remainingRefundable / 100).toFixed(2)}`
      );
    }

    // Check if this was a direct charge (need to refund on connected account)
    const paymentMetadata = payment.stripe_metadata as any;

    // Get connected account ID - prioritize shop settings over metadata
    const connectedAccountId =
      shopSettings?.stripe_connect_account_id ||
      paymentMetadata?.merchant_account_id ||
      paymentMetadata?.connected_account ||
      paymentMetadata?.connect_account_id ||
      paymentMetadata?.event_account;

    // Determine if this is a direct charge
    // If we have a connected account ID (from shop settings or metadata), assume it's a direct charge
    // This handles older payments that might not have the newer metadata fields
    const isDirectCharge =
      paymentMetadata?.connect_flow_type === 'direct_charge' ||
      paymentMetadata?.charge_type === 'direct' ||
      paymentMetadata?.is_connect_payment === true ||
      paymentMetadata?.payment_flow === 'connect_transfer' ||
      // If we have a connected account ID and shop has Connect enabled, it's likely a direct charge
      (connectedAccountId && shopSettings?.stripe_connect_status === 'active');

    // Log for debugging
    console.log('Refund processing:', {
      paymentId: payment.id,
      paymentIntentId: payment.stripe_payment_intent_id,
      isDirectCharge,
      connectedAccountId,
      shopSettingsAccountId: shopSettings?.stripe_connect_account_id,
      metadataAccountId: paymentMetadata?.merchant_account_id,
      connectFlowType: paymentMetadata?.connect_flow_type,
    });

    // Validate we have the necessary info for direct charges
    if (isDirectCharge && !connectedAccountId) {
      console.error('Direct charge detected but no connected account ID found');
      throw new Error(
        'Unable to process refund: Connected account information missing. ' +
          'Please contact support.'
      );
    }

    // Create Stripe refund with enhanced metadata
    let refund;
    try {
      const refundParams = {
        payment_intent: payment.stripe_payment_intent_id,
        amount: refundAmount,
        reason: 'requested_by_customer' as const,
        metadata: {
          payment_id: payment.id,
          invoice_id: payment.invoice_id,
          invoice_number: payment.invoice.invoice_number || 'N/A',
          refunded_by: user.id,
          refund_reason: reason || 'Customer requested refund',
          merchant_category: 'personal_services',
          refund_type:
            refundAmount === payment.amount_cents ? 'full' : 'partial',
          original_amount_cents: payment.amount_cents.toString(),
          refund_amount_cents: refundAmount.toString(),
        },
      };

      // Try to refund based on our best guess of where the payment lives
      let refundError: any = null;

      if (isDirectCharge && connectedAccountId) {
        console.log(
          'Processing refund on connected account:',
          connectedAccountId
        );
        try {
          // For direct charges, refund on the connected account
          refund = await stripe.refunds.create(refundParams, {
            stripeAccount: connectedAccountId,
          });
          console.log('Successfully refunded on connected account');
        } catch (error: any) {
          console.log('Failed to refund on connected account:', error.message);
          refundError = error;

          // If payment not found on connected account, try platform account as fallback
          if (
            error.code === 'resource_missing' ||
            error.message.includes('No such payment_intent')
          ) {
            console.log('Attempting fallback refund on platform account');
            try {
              refund = await stripe.refunds.create(refundParams);
              console.log(
                'Successfully refunded on platform account (fallback)'
              );
            } catch (platformError: any) {
              console.error(
                'Fallback refund on platform also failed:',
                platformError.message
              );
              throw refundError; // Throw original error
            }
          } else {
            throw error;
          }
        }
      } else {
        console.log('Processing refund on platform account');
        try {
          // For destination charges or platform payments
          refund = await stripe.refunds.create(refundParams);
          console.log('Successfully refunded on platform account');
        } catch (error: any) {
          console.log('Failed to refund on platform account:', error.message);
          refundError = error;

          // If payment not found on platform and we have a connected account, try it as fallback
          if (
            connectedAccountId &&
            (error.code === 'resource_missing' ||
              error.message.includes('No such payment_intent'))
          ) {
            console.log(
              'Attempting fallback refund on connected account:',
              connectedAccountId
            );
            try {
              refund = await stripe.refunds.create(refundParams, {
                stripeAccount: connectedAccountId,
              });
              console.log(
                'Successfully refunded on connected account (fallback)'
              );
            } catch (connectedError: any) {
              console.error(
                'Fallback refund on connected account also failed:',
                connectedError.message
              );
              throw refundError; // Throw original error
            }
          } else {
            throw error;
          }
        }
      }

      if (!refund) {
        throw new Error('Failed to create refund');
      }
    } catch (stripeError: any) {
      console.error('Stripe refund error:', stripeError);
      console.error('Refund attempt details:', {
        paymentIntentId: payment.stripe_payment_intent_id,
        isDirectCharge,
        connectedAccountId,
        refundAmount,
      });
      throw new Error(`Stripe refund failed: ${stripeError.message}`);
    }

    // Create refund record after Stripe refund succeeds
    const { data: refundRecord, error: refundInsertError } = await supabase
      .from('refunds')
      .insert({
        payment_id: payment.id,
        stripe_refund_id: refund.id,
        amount_cents: refundAmount,
        reason: reason || 'Customer requested refund',
        refund_type: refundAmount === payment.amount_cents ? 'full' : 'partial',
        initiated_by: user.id,
        merchant_notes: reason || null,
        status: 'succeeded',
        processed_at: new Date().toISOString(),
        stripe_metadata: {
          refund_id: refund.id,
          amount: refund.amount,
          currency: refund.currency,
          reason: refund.reason,
          status: refund.status,
        },
      })
      .select()
      .single();

    if (refundInsertError) {
      console.error('Refund insert error:', refundInsertError);
      console.error('Refund data attempted:', {
        payment_id: payment.id,
        stripe_refund_id: refund.id,
        amount_cents: refundAmount,
        refund_type: refundAmount === payment.amount_cents ? 'full' : 'partial',
        initiated_by: user.id,
      });
      throw new Error(
        `Failed to record refund details: ${refundInsertError.message}`
      );
    }

    // Update payment record with accumulated refund amount
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status:
          totalAfterRefund === payment.amount_cents
            ? 'refunded'
            : 'partially_refunded',
        refund_id: refund.id,
        refunded_amount_cents: totalAfterRefund, // Use accumulated total
        refunded_at: new Date().toISOString(),
        refunded_by: user.id,
        refund_reason: reason || null,
        stripe_metadata: {
          ...((payment.stripe_metadata as object) || {}),
          refund_id: refund.id,
          refunded_amount_cents: totalAfterRefund, // Use accumulated total
          last_refund_amount: refundAmount, // Track the last refund separately
          refunded_at: new Date().toISOString(),
          refund_reason: reason || null,
          refund_count:
            ((payment.stripe_metadata as any)?.refund_count || 0) + 1,
        },
      })
      .eq('id', paymentId);

    if (updateError) {
      throw new Error('Failed to update payment record');
    }

    // Update invoice status if needed
    const { data: invoice } = await supabase
      .from('invoices')
      .select('*, payments(*)')
      .eq('id', payment.invoice_id)
      .single();

    if (invoice) {
      const totalPaid =
        invoice.payments
          .filter((p: any) => p.status === 'completed' && p.id !== paymentId)
          .reduce((sum: number, p: any) => sum + p.amount_cents, 0) +
        (refundAmount === payment.amount_cents
          ? 0
          : payment.amount_cents - refundAmount);

      let newStatus = invoice.status;
      if (totalPaid === 0) {
        newStatus = 'pending';
      } else if (totalPaid < invoice.amount_cents) {
        newStatus = 'partially_paid';
      }

      if (newStatus !== invoice.status) {
        await supabase
          .from('invoices')
          .update({ status: newStatus })
          .eq('id', invoice.id);

        await supabase.from('invoice_status_history').insert({
          invoice_id: invoice.id,
          previous_status: invoice.status,
          new_status: newStatus,
          changed_by: user.id,
          reason: `Refund of $${(refundAmount / 100).toFixed(2)} processed`,
        });
      }
    }

    revalidatePath('/invoices');
    revalidatePath(`/invoices/${payment.invoice_id}`);

    return { success: true, data: { refundId: refund.id } };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to process refund',
    };
  }
}

/**
 * Process a manual refund for cash or external POS payments
 * This creates a refund record and updates payment status without processing through Stripe
 */
export async function processManualRefund(
  paymentId: string,
  amountCents: number,
  reason: string,
  refundMethod: 'cash' | 'external_pos' | 'other' = 'cash'
) {
  try {
    const { shop, user } = await ensureUserAndShop();
    const supabase = await createClient();

    // Get payment details
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*, invoice:invoices!inner(shop_id, invoice_number)')
      .eq('id', paymentId)
      .eq('invoice.shop_id', shop.id)
      .single();

    if (paymentError || !payment) {
      throw new Error('Payment not found');
    }

    if (
      payment.status !== 'completed' &&
      payment.status !== 'partially_refunded'
    ) {
      throw new Error(
        'Can only refund completed or partially refunded payments'
      );
    }

    // Only allow manual refunds for non-Stripe payments
    if (payment.payment_method === 'stripe') {
      throw new Error('Use the Stripe refund process for credit card payments');
    }

    // Validate refund amount
    if (amountCents <= 0) {
      throw new Error('Refund amount must be greater than $0');
    }

    const previouslyRefunded = payment.refunded_amount_cents || 0;
    const totalAfterRefund = previouslyRefunded + amountCents;

    if (totalAfterRefund > payment.amount_cents) {
      const remainingRefundable = payment.amount_cents - previouslyRefunded;
      throw new Error(
        `Refund amount exceeds remaining refundable amount. ` +
          `Maximum refundable: $${(remainingRefundable / 100).toFixed(2)}`
      );
    }

    // Reason is optional for manual refunds, but we'll use a default if not provided
    const refundReason =
      reason && reason.trim().length > 0
        ? reason.trim()
        : 'Manual refund processed';

    // Create refund record
    const { data: refundRecord, error: refundInsertError } = await supabase
      .from('refunds')
      .insert({
        payment_id: payment.id,
        amount_cents: amountCents,
        reason: refundReason,
        refund_type: amountCents === payment.amount_cents ? 'full' : 'partial',
        initiated_by: user.id,
        merchant_notes: refundReason,
        status: 'succeeded', // Manual refunds are immediately considered successful
        processed_at: new Date().toISOString(),
        refund_method: refundMethod,
        stripe_metadata: null, // No Stripe involvement for manual refunds
      })
      .select()
      .single();

    if (refundInsertError) {
      console.error('Manual refund insert error:', refundInsertError);
      throw new Error(
        `Failed to record refund details: ${refundInsertError.message}`
      );
    }

    // Update payment record with accumulated refund amount
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status:
          totalAfterRefund === payment.amount_cents
            ? 'refunded'
            : 'partially_refunded',
        refunded_amount_cents: totalAfterRefund, // Use accumulated total
        refunded_at: new Date().toISOString(),
        refunded_by: user.id,
        refund_reason: refundReason,
        // Add manual refund info to metadata
        stripe_metadata: {
          ...((payment.stripe_metadata as object) || {}),
          manual_refund: true,
          refund_method: refundMethod,
          refunded_amount_cents: totalAfterRefund, // Use accumulated total
          last_refund_amount: amountCents, // Track the last refund separately
          refunded_at: new Date().toISOString(),
          refund_reason: refundReason,
          refund_count:
            ((payment.stripe_metadata as any)?.refund_count || 0) + 1,
        },
      })
      .eq('id', paymentId);

    if (updateError) {
      throw new Error('Failed to update payment record');
    }

    // Update invoice status if needed
    const { data: invoice } = await supabase
      .from('invoices')
      .select('*, payments(*)')
      .eq('id', payment.invoice_id)
      .single();

    if (invoice) {
      const totalPaid =
        invoice.payments
          .filter((p: any) => p.status === 'completed' && p.id !== paymentId)
          .reduce((sum: number, p: any) => sum + p.amount_cents, 0) +
        (amountCents === payment.amount_cents
          ? 0
          : payment.amount_cents - amountCents);

      let newStatus = invoice.status;
      if (totalPaid === 0) {
        newStatus = 'pending';
      } else if (totalPaid < invoice.amount_cents) {
        newStatus = 'partially_paid';
      }

      if (newStatus !== invoice.status) {
        await supabase
          .from('invoices')
          .update({ status: newStatus })
          .eq('id', invoice.id);

        await supabase.from('invoice_status_history').insert({
          invoice_id: invoice.id,
          previous_status: invoice.status,
          new_status: newStatus,
          changed_by: user.id,
          reason: `Manual refund of $${(amountCents / 100).toFixed(2)} processed (${refundMethod})`,
        });
      }
    }

    revalidatePath('/invoices');
    revalidatePath(`/invoices/${payment.invoice_id}`);

    return {
      success: true,
      data: {
        refundId: refundRecord.id,
        refundMethod,
        amountRefunded: amountCents,
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to process manual refund',
    };
  }
}
