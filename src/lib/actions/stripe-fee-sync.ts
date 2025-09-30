'use server';

import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
	apiVersion: '2025-02-24.acacia',
	typescript: true,
});

/**
 * Fetch and update Stripe fee data for a payment on-demand
 * This is useful for displaying fees immediately after payment,
 * rather than waiting for the async charge.updated webhook
 */
export async function syncStripeFeeForPayment(paymentId: string) {
	const supabase = await createClient();

	// Get the payment record with invoice relationship to find shop
	const { data: payment, error } = await supabase
		.from('payments')
		.select('*, invoice:invoices(shop_id)')
		.eq('id', paymentId)
		.single();

	if (error || !payment) {
		console.error('Payment not found:', paymentId);
		return { success: false, error: 'Payment not found' };
	}

	// Only process Stripe payments
	if (
		payment.payment_method !== 'stripe' ||
		!payment.stripe_payment_intent_id
	) {
		return { success: false, error: 'Not a Stripe payment' };
	}

	// Skip if fee data already exists
	if (payment.stripe_fee_cents && payment.stripe_fee_cents > 0) {
		return { success: true, alreadySynced: true };
	}

	try {
		// Get shop's Stripe Connect account ID for Direct Charges
		const { data: shopSettings } = await supabase
			.from('shop_settings')
			.select('stripe_connect_account_id')
			.eq('shop_id', (payment.invoice as any).shop_id)
			.single();

		const connectAccountId = shopSettings?.stripe_connect_account_id;

		// Retrieve PaymentIntent with expanded charge and balance_transaction
		// For Direct Charges, use Stripe-Account header in request options
		const retrieveOptions: Stripe.PaymentIntentRetrieveParams = {
			expand: ['latest_charge.balance_transaction'],
		};

		const requestOptions: Stripe.RequestOptions = connectAccountId
			? { stripeAccount: connectAccountId }
			: {};

		const paymentIntent = await stripe.paymentIntents.retrieve(
			payment.stripe_payment_intent_id,
			retrieveOptions,
			requestOptions
		);

		// Check if balance transaction is available
		const charge = paymentIntent.latest_charge as Stripe.Charge | null;
		if (!charge) {
			return { success: false, error: 'No charge found' };
		}

		const balanceTx =
			charge.balance_transaction as Stripe.BalanceTransaction | null;

		if (!balanceTx) {
			// Balance transaction not yet available (async processing)
			return {
				success: false,
				error: 'Balance transaction not yet available',
				pending: true,
			};
		}

		// Update payment with fee information
		const { error: updateError } = await supabase
			.from('payments')
			.update({
				stripe_fee_cents: balanceTx.fee,
				net_amount_cents: balanceTx.net,
				stripe_fee_details: {
					fee_cents: balanceTx.fee,
					net_cents: balanceTx.net,
					fee_details: balanceTx.fee_details || [],
					currency: balanceTx.currency,
					exchange_rate: balanceTx.exchange_rate,
					available_on: balanceTx.available_on,
					created: balanceTx.created,
				} as any, // Type assertion for Json compatibility
			})
			.eq('id', paymentId);

		if (updateError) {
			console.error('Failed to update payment with fee data:', updateError);
			return { success: false, error: 'Failed to update fee data' };
		}

		console.log('✅ Successfully synced fee data for payment:', paymentId);

		// Note: revalidatePath cannot be called during render
		// The webhook handler will handle revalidation when charge.updated fires

		return {
			success: true,
			fee_cents: balanceTx.fee,
			net_cents: balanceTx.net,
		};
	} catch (err) {
		console.error('Error syncing Stripe fee:', err);
		return {
			success: false,
			error: err instanceof Error ? err.message : 'Unknown error',
		};
	}
}

/**
 * Sync fees for all payments in an invoice
 * Useful for order detail pages
 */
export async function syncStripeFeesForInvoice(invoiceId: string) {
	const supabase = await createClient();

	// Get all Stripe payments for this invoice
	const { data: payments } = await supabase
		.from('payments')
		.select('*')
		.eq('invoice_id', invoiceId)
		.eq('payment_method', 'stripe')
		.eq('status', 'completed');

	if (!payments || payments.length === 0) {
		return { success: true, synced: 0 };
	}

	// Sync fees for payments that don't have fee data yet
	const results = await Promise.all(
		payments
			.filter((p) => !p.stripe_fee_cents || p.stripe_fee_cents === 0)
			.map((p) => syncStripeFeeForPayment(p.id))
	);

	const successCount = results.filter((r) => r.success).length;

	return {
		success: true,
		synced: successCount,
		total: payments.length,
	};
}
