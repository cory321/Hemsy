/**
 * @jest-environment node
 */

import { getInvoicePaymentHistory } from '../payments';

// Mock the dependencies
jest.mock('@/lib/actions/users', () => ({
  ensureUserAndShop: jest.fn().mockResolvedValue({
    shop: { id: 'test-shop-id' },
    user: { id: 'test-user-id' },
  }),
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('getInvoicePaymentHistory', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    const { createClient } = require('@/lib/supabase/server');

    // We'll set up mockSupabase in each test since the queries are different
    mockSupabase = {
      from: jest.fn(),
    };

    createClient.mockResolvedValue(mockSupabase);
  });

  it('should combine payments and refunds into unified transaction history', async () => {
    const invoiceId = 'test-invoice-id';

    // Create a mock that handles different table queries
    mockSupabase.from = jest.fn().mockImplementation((table: string) => {
      if (table === 'invoices') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { shop_id: 'test-shop-id' },
            error: null,
          }),
        };
      } else if (table === 'payments') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({
            data: [
              {
                id: 'payment-1',
                payment_type: 'remainder',
                payment_method: 'cash',
                amount_cents: 5000,
                status: 'completed',
                created_at: '2025-08-28T10:00:00Z',
                processed_at: '2025-08-28T10:00:00Z',
                notes: null,
              },
              {
                id: 'payment-2',
                payment_type: 'custom',
                payment_method: 'stripe',
                amount_cents: 2500,
                status: 'partially_refunded',
                created_at: '2025-08-28T11:00:00Z',
                processed_at: '2025-08-28T11:00:00Z',
                notes: null,
              },
            ],
            error: null,
          }),
        };
      } else if (table === 'refunds') {
        return {
          select: jest.fn().mockReturnThis(),
          in: jest.fn().mockResolvedValue({
            data: [
              {
                id: 'refund-1',
                payment_id: 'payment-2',
                amount_cents: 1000,
                reason: 'Customer requested partial refund',
                status: 'succeeded',
                created_at: '2025-08-28T12:00:00Z',
                processed_at: '2025-08-28T12:00:00Z',
                refund_method: 'stripe',
                refund_type: 'partial',
                payment: {
                  id: 'payment-2',
                  payment_method: 'stripe',
                  payment_type: 'custom',
                  invoice_id: invoiceId,
                },
              },
            ],
            error: null,
          }),
        };
      }
      return {};
    });

    const result = await getInvoicePaymentHistory(invoiceId);

    expect(result).toHaveLength(3); // 2 payments + 1 refund

    // Check sorting (most recent first)
    expect(result[0].created_at).toBe('2025-08-28T12:00:00Z'); // Refund (most recent)
    expect(result[1].created_at).toBe('2025-08-28T11:00:00Z'); // Payment 2
    expect(result[2].created_at).toBe('2025-08-28T10:00:00Z'); // Payment 1

    // Check refund transactions (should be negative amounts) - first in sorted order
    expect(result[0]).toMatchObject({
      type: 'refund',
      payment_type: 'refund',
      payment_method: 'stripe',
      amount_cents: -1000, // Negative for credits
      status: 'succeeded',
      refund_method: 'stripe',
      refund_type: 'partial',
    });

    // Check payment transactions
    const payments = result.filter((t) => t.type === 'payment');
    expect(payments).toHaveLength(2);

    // Payment 2 (second in sorted order)
    expect(result[1]).toMatchObject({
      type: 'payment',
      payment_type: 'custom',
      payment_method: 'stripe',
      amount_cents: 2500,
      status: 'partially_refunded',
    });

    // Payment 1 (third in sorted order)
    expect(result[2]).toMatchObject({
      type: 'payment',
      payment_type: 'remainder',
      payment_method: 'cash',
      amount_cents: 5000,
      status: 'completed',
    });
  });

  it('should handle invoices with no refunds', async () => {
    const invoiceId = 'test-invoice-id';

    // Create a mock that handles different table queries
    mockSupabase.from = jest.fn().mockImplementation((table: string) => {
      if (table === 'invoices') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { shop_id: 'test-shop-id' },
            error: null,
          }),
        };
      } else if (table === 'payments') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({
            data: [
              {
                id: 'payment-1',
                payment_type: 'remainder',
                payment_method: 'cash',
                amount_cents: 5000,
                status: 'completed',
                created_at: '2025-08-28T10:00:00Z',
              },
            ],
            error: null,
          }),
        };
      } else if (table === 'refunds') {
        return {
          select: jest.fn().mockReturnThis(),
          in: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        };
      }
      return {};
    });

    const result = await getInvoicePaymentHistory(invoiceId);

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('payment');
  });

  it('should throw error for invoice not belonging to shop', async () => {
    const invoiceId = 'test-invoice-id';

    // Create a mock that returns wrong shop_id
    mockSupabase.from = jest.fn().mockImplementation((table: string) => {
      if (table === 'invoices') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { shop_id: 'different-shop-id' },
            error: null,
          }),
        };
      }
      return {};
    });

    await expect(getInvoicePaymentHistory(invoiceId)).rejects.toThrow(
      'Invoice not found'
    );
  });
});
