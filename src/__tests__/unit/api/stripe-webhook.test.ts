/** @jest-environment node */
import Stripe from 'stripe';

// Helper to create a minimal request-like object that our handler expects
function createRequest(body: string, headers: Record<string, string> = {}) {
  const normalized: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    normalized[k.toLowerCase()] = v;
  }

  return {
    method: 'POST',
    headers: {
      get(key: string) {
        return normalized[key.toLowerCase()] ?? null;
      },
    },
    text: async () => body,
  } as unknown as Request;
}

describe('Stripe Webhook Route', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('returns 400 when missing signature header', async () => {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    jest.doMock('stripe', () => ({
      __esModule: true,
      default: class Stripe {
        webhooks = {
          constructEvent: () => ({
            id: 'evt',
            type: 'payment_intent.succeeded',
            data: { object: { id: 'pi' } },
          }),
        };
      },
    }));
    const { POST } = await import('@/app/api/webhooks/stripe/route');
    const request = createRequest('{}');
    const response = await POST(request);
    const json = await (response as any).json();
    expect((response as any).status).toBe(400);
    expect(json.error).toBe('Missing stripe-signature header');
  });

  test('returns 500 when missing secret env', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.STRIPE_TEST_WEBHOOK_SECRET;
    jest.doMock('stripe', () => ({
      __esModule: true,
      default: class Stripe {
        webhooks = {
          constructEvent: () => ({
            id: 'evt',
            type: 'payment_intent.succeeded',
            data: { object: { id: 'pi' } },
          }),
        };
      },
    }));
    const { POST } = await import('@/app/api/webhooks/stripe/route');
    const request = createRequest('{}', { 'stripe-signature': 'sig' });
    const response = await POST(request);
    const json = await (response as any).json();
    expect((response as any).status).toBe(500);
    expect(json.error).toBe('Missing STRIPE_WEBHOOK_SECRET in environment');
  });

  test('returns 400 on invalid signature', async () => {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    jest.doMock('stripe', () => ({
      __esModule: true,
      default: class Stripe {
        webhooks = {
          constructEvent: () => {
            throw new Error('bad sig');
          },
        };
      },
    }));
    const { POST } = await import('@/app/api/webhooks/stripe/route');
    const request = createRequest('{}', { 'stripe-signature': 'bad' });
    const response = await POST(request);
    const json = await (response as any).json();
    expect((response as any).status).toBe(400);
    expect(json.error).toBe('Invalid signature');
  });

  test('returns 200 on valid constructed event processing', async () => {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    jest.doMock('stripe', () => ({
      __esModule: true,
      default: class Stripe {
        webhooks = {
          constructEvent: () => ({
            id: 'evt_123',
            type: 'payment_intent.succeeded',
            data: { object: { id: 'pi_123' } },
            created: Date.now() / 1000,
            livemode: false,
            object: 'event',
            pending_webhooks: 0,
            request: { id: null, idempotency_key: null },
            api_version: '2023-10-16',
          }),
        };
      },
    }));
    const { POST } = await import('@/app/api/webhooks/stripe/route');
    const request = createRequest('{}', { 'stripe-signature': 'good' });
    const response = await POST(request);
    expect((response as any).status).toBe(200);
  });
});
