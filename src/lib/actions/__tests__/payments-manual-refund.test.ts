import { processManualRefund } from '../payments';
import { createClient } from '@/lib/supabase/server';
import { ensureUserAndShop } from '../users';
import { revalidatePath } from 'next/cache';

// Mock dependencies
jest.mock('@/lib/supabase/server');
jest.mock('../users');
jest.mock('next/cache');

const mockSupabase: any = {
  from: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  single: jest.fn(),
  insert: jest.fn(() => mockSupabase),
  update: jest.fn(() => mockSupabase),
};

const mockUser = { id: 'user-123' };
const mockShop = { id: 'shop-123' };

const mockPayment = {
  id: 'payment-123',
  payment_method: 'cash',
  amount_cents: 5000, // $50.00
  status: 'completed',
  invoice_id: 'invoice-123',
  stripe_payment_intent_id: null,
  invoice: {
    shop_id: 'shop-123',
    invoice_number: 'INV-001',
  },
};

const mockStripePayment = {
  ...mockPayment,
  payment_method: 'stripe',
  stripe_payment_intent_id: 'pi_123',
} as any;

const mockPendingPayment = {
  ...mockPayment,
  status: 'pending',
};

const mockInvoice = {
  id: 'invoice-123',
  status: 'paid',
  amount_cents: 5000,
  payments: [mockPayment],
};

describe('processManualRefund', () => {
  // Helper function to set up successful mocks
  const setupSuccessfulMocks = (
    paymentData = mockPayment,
    refundId = 'refund-123'
  ) => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'payments') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: paymentData,
                  error: null,
                }),
              }),
            }),
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        };
      }
      if (table === 'refunds') {
        return {
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: refundId },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'invoices') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockInvoice,
                error: null,
              }),
            }),
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        };
      }
      if (table === 'invoice_status_history') {
        return {
          insert: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        };
      }
      return mockSupabase;
    });
  };

  // Helper function to set up mocks that return payment not found
  const setupPaymentNotFoundMocks = () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'payments') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Payment not found' },
                }),
              }),
            }),
          }),
        };
      }
      return mockSupabase;
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (
      createClient as jest.MockedFunction<typeof createClient>
    ).mockResolvedValue(mockSupabase as never);
    (
      ensureUserAndShop as jest.MockedFunction<typeof ensureUserAndShop>
    ).mockResolvedValue({ user: mockUser as any, shop: mockShop as any });
    (
      revalidatePath as jest.MockedFunction<typeof revalidatePath>
    ).mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('successful manual refunds', () => {
    it('should process a full cash refund successfully', async () => {
      setupSuccessfulMocks();

      const result = await processManualRefund(
        'payment-123',
        5000, // Full refund
        'Customer requested refund',
        'cash'
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        refundId: 'refund-123',
        refundMethod: 'cash',
        amountRefunded: 5000,
      });
    });

    it('should process a partial external POS refund successfully', async () => {
      setupSuccessfulMocks(mockPayment, 'refund-456');

      const result = await processManualRefund(
        'payment-123',
        2500, // Partial refund
        'Partial refund requested',
        'external_pos'
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        refundId: 'refund-456',
        refundMethod: 'external_pos',
        amountRefunded: 2500,
      });
    });

    it('should process refund with empty reason using default', async () => {
      setupSuccessfulMocks();

      const result = await processManualRefund(
        'payment-123',
        2500,
        '', // Empty reason
        'cash'
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        refundId: 'refund-123',
        refundMethod: 'cash',
        amountRefunded: 2500,
      });
    });

    it('should process refund with whitespace-only reason using default', async () => {
      setupSuccessfulMocks();

      const result = await processManualRefund(
        'payment-123',
        2500,
        '   ', // Whitespace only
        'cash'
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        refundId: 'refund-123',
        refundMethod: 'cash',
        amountRefunded: 2500,
      });
    });
  });

  describe('validation errors', () => {
    it('should reject refunds for Stripe payments', async () => {
      setupSuccessfulMocks(mockStripePayment);

      const result = await processManualRefund(
        'payment-123',
        2500,
        'Test refund',
        'cash'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        'Use the Stripe refund process for credit card payments'
      );
    });

    it('should reject refunds for non-completed payments', async () => {
      setupSuccessfulMocks(mockPendingPayment);

      const result = await processManualRefund(
        'payment-123',
        2500,
        'Test refund',
        'cash'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        'Can only refund completed or partially refunded payments'
      );
    });

    it('should reject refunds with zero or negative amounts', async () => {
      setupSuccessfulMocks();

      const result = await processManualRefund(
        'payment-123',
        0, // Invalid amount
        'Test refund',
        'cash'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Refund amount must be greater than $0');
    });

    it('should reject refunds exceeding payment amount', async () => {
      setupSuccessfulMocks();

      const result = await processManualRefund(
        'payment-123',
        6000, // Exceeds $50 payment
        'Test refund',
        'cash'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain(
        'Refund amount exceeds remaining refundable amount'
      );
      expect(result.error).toContain('Maximum refundable: $50.00');
    });
  });

  describe('database errors', () => {
    it('should handle payment not found error', async () => {
      setupPaymentNotFoundMocks();

      const result = await processManualRefund(
        'nonexistent-payment',
        2500,
        'Test refund',
        'cash'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Payment not found');
    });

    it('should handle refund record creation error', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'payments') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockPayment,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'refunds') {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Failed to insert refund' },
                }),
              }),
            }),
          };
        }
        return mockSupabase;
      });

      const result = await processManualRefund(
        'payment-123',
        2500,
        'Test refund',
        'cash'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        'Failed to record refund details: Failed to insert refund'
      );
    });

    it('should handle payment update error', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'payments' && mockSupabase.from.mock.calls.length === 1) {
          // First call - payment lookup
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockPayment,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'refunds') {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'refund-123' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'payments') {
          // Second call - payment update
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Update failed' },
              }),
            }),
          };
        }
        return mockSupabase;
      });

      const result = await processManualRefund(
        'payment-123',
        2500,
        'Test refund',
        'cash'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to update payment record');
    });
  });

  describe('invoice status updates', () => {
    it('should update invoice status to pending when fully refunded', async () => {
      const mockInvoiceUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'payments' && mockSupabase.from.mock.calls.length === 1) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockPayment,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'refunds') {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'refund-123' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (
          table === 'invoices' &&
          mockSupabase.from.mock.calls.filter(
            (call: any) => call[0] === 'invoices'
          ).length === 1
        ) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    ...mockInvoice,
                    payments: [{ ...mockPayment, status: 'refunded' }],
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'invoices') {
          return {
            update: mockInvoiceUpdate,
          };
        }
        if (table === 'payments') {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          };
        }
        if (table === 'invoice_status_history') {
          return {
            insert: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        }
        return mockSupabase;
      });

      await processManualRefund('payment-123', 5000, 'Full refund', 'cash');

      // Should update invoice status to pending since no payments remain
      expect(mockInvoiceUpdate).toHaveBeenCalledWith({ status: 'pending' });
    });

    it('should update invoice status to partially_paid when partially refunded', async () => {
      const mockInvoiceUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'payments' && mockSupabase.from.mock.calls.length === 1) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockPayment,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'refunds') {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'refund-123' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (
          table === 'invoices' &&
          mockSupabase.from.mock.calls.filter(
            (call: any) => call[0] === 'invoices'
          ).length === 1
        ) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    ...mockInvoice,
                    payments: [
                      { ...mockPayment, status: 'partially_refunded' },
                    ],
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'invoices') {
          return {
            update: mockInvoiceUpdate,
          };
        }
        if (table === 'payments') {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          };
        }
        if (table === 'invoice_status_history') {
          return {
            insert: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        }
        return mockSupabase;
      });

      await processManualRefund('payment-123', 2500, 'Partial refund', 'cash');

      // Should update invoice status to partially_paid
      expect(mockInvoiceUpdate).toHaveBeenCalledWith({
        status: 'partially_paid',
      });
    });
  });

  describe('path revalidation', () => {
    it('should revalidate invoice paths after successful refund', async () => {
      setupSuccessfulMocks();

      await processManualRefund('payment-123', 2500, 'Test refund', 'cash');

      expect(revalidatePath).toHaveBeenCalledWith('/invoices');
      expect(revalidatePath).toHaveBeenCalledWith('/invoices/invoice-123');
    });
  });
});
