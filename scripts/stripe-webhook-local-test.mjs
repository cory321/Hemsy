import Stripe from 'stripe';

const secret = process.env.STRIPE_LOCAL_WEBHOOK_SECRET;
const url =
	process.env.STRIPE_LOCAL_WEBHOOK_URL ||
	'http://localhost:3000/api/webhooks/stripe';

if (!secret) {
	console.error('Missing STRIPE_LOCAL_WEBHOOK_SECRET env var');
	process.exit(1);
}

const stripe = new Stripe('sk_test_dummy', { apiVersion: '2025-02-24.acacia' });

// Minimal payment_intent.succeeded payload
const payloadObj = {
	id: 'evt_local_test_1',
	object: 'event',
	type: 'payment_intent.succeeded',
	data: {
		object: {
			id: 'pi_local_test_1',
			object: 'payment_intent',
			amount: 2000,
			currency: 'usd',
			status: 'succeeded',
			metadata: { invoice_id: 'inv_local_1' },
		},
	},
};

const payload = JSON.stringify(payloadObj);

const signature = stripe.webhooks.generateTestHeaderString({ payload, secret });

const res = await fetch(url, {
	method: 'POST',
	headers: {
		'content-type': 'application/json',
		'stripe-signature': signature,
	},
	body: payload,
});

const text = await res.text();
console.log('Webhook POST status:', res.status);
console.log('Webhook response:', text);

if (!res.ok) process.exit(2);
