import { processManualRefund } from '../payments';
import { createClient } from '@/lib/supabase/client';
import { ensureUserAndShop } from '@/lib/auth/user-shop';
import { revalidatePath } from 'next/cache';

// Mock dependencies
jest.mock('@/lib/supabase/client');
jest.mock('@/lib/auth/user-shop');
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

const mockInvoice = {
  id: 'invoice-123',
  status: 'paid',
  amount_cents: 5000,
  payments: [mockPayment],
};

describe('processManualRefund', () => {
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
      // Set up the mock chain properly
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);

      // Mock payment lookup
      mockQuery.single
        .mockResolvedValueOnce({
          data: mockPayment,
          error: null,
        })
        // Mock refund record creation
        .mockResolvedValueOnce({
          data: { id: 'refund-123' },
          error: null,
        })
        // Mock invoice lookup for status update
        .mockResolvedValueOnce({
          data: mockInvoice,
          error: null,
        });

      // Mock payment update
      mockQuery.eq.mockResolvedValueOnce({
        data: null,
        error: null,
      });

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

      // Verify refund record was created correctly
      expect(mockQuery.insert).toHaveBeenCalledWith({
        payment_id: 'payment-123',
        amount_cents: 5000,
        reason: 'Customer requested refund',
        refund_type: 'full',
        initiated_by: 'user-123',
        merchant_notes: 'Customer requested refund',
        status: 'succeeded',
        processed_at: expect.any(String),
        refund_method: 'cash',
        stripe_metadata: null,
      });

      // Verify payment was updated to refunded status
      expect(mockQuery.update).toHaveBeenCalledWith({
        status: 'refunded',
        refunded_amount_cents: 5000,
        refunded_at: expect.any(String),
        refunded_by: 'user-123',
        refund_reason: 'Customer requested refund',
        stripe_metadata: {
          manual_refund: true,
          refund_method: 'cash',
          refunded_amount_cents: 5000,
          refunded_at: expect.any(String),
          refund_reason: 'Customer requested refund',
        },
      });
    });

    it('should process a partial external POS refund successfully', async () => {
      // Mock payment lookup
      mockSupabase.single.mockResolvedValueOnce({
        data: { ...mockPayment, payment_method: 'external_pos' },
        error: null,
      });

      // Mock refund record creation
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'refund-456' },
        error: null,
      });

      // Mock payment update
      mockSupabase.eq.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Mock invoice lookup for status update
      mockSupabase.single.mockResolvedValueOnce({
        data: mockInvoice,
        error: null,
      });

      const result = await processManualRefund(
        'payment-123',
        2500, // Partial refund ($25.00)
        'Partial refund for alteration issue',
        'external_pos'
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        refundId: 'refund-456',
        refundMethod: 'external_pos',
        amountRefunded: 2500,
      });

      // Verify refund record was created as partial
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          refund_type: 'partial',
          refund_method: 'external_pos',
          amount_cents: 2500,
        })
      );

      // Verify payment was updated to partially_refunded status
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'partially_refunded',
          refunded_amount_cents: 2500,
        })
      );
    });
  });

  describe('validation errors', () => {
    beforeEach(() => {
      mockSupabase.single.mockResolvedValueOnce({
        data: mockPayment,
        error: null,
      });
    });

    it('should reject refunds for Stripe payments', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { ...mockPayment, payment_method: 'stripe' },
        error: null,
      });

      const result = await processManualRefund(
        'payment-123',
        5000,
        'Test refund',
        'cash'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        'Use the Stripe refund process for credit card payments'
      );
    });

    it('should reject refunds for non-completed payments', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { ...mockPayment, status: 'pending' },
        error: null,
      });

      const result = await processManualRefund(
        'payment-123',
        5000,
        'Test refund',
        'cash'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Can only refund completed payments');
    });

    it('should reject refunds with zero or negative amounts', async () => {
      const result = await processManualRefund(
        'payment-123',
        0,
        'Test refund',
        'cash'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Refund amount must be greater than $0');
    });

    it('should reject refunds exceeding payment amount', async () => {
      const result = await processManualRefund(
        'payment-123',
        6000, // More than $50.00 payment
        'Test refund',
        'cash'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Refund amount cannot exceed payment amount');
    });

    it('should reject refunds without a reason', async () => {
      const result = await processManualRefund(
        'payment-123',
        2500,
        '', // Empty reason
        'cash'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Refund reason is required for manual refunds');
    });

    it('should reject refunds with whitespace-only reason', async () => {
      const result = await processManualRefund(
        'payment-123',
        2500,
        '   ', // Whitespace-only reason
        'cash'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Refund reason is required for manual refunds');
    });
  });

  describe('database errors', () => {
    it('should handle payment not found error', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Payment not found' },
      });

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
      mockSupabase.single
        .mockResolvedValueOnce({
          data: mockPayment,
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'Failed to insert refund' },
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
      mockSupabase.single
        .mockResolvedValueOnce({
          data: mockPayment,
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: 'refund-123' },
          error: null,
        });

      mockSupabase.eq.mockResolvedValueOnce({
        data: null,
        error: { message: 'Failed to update payment' },
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
      // Mock payment lookup
      mockSupabase.single.mockResolvedValueOnce({
        data: mockPayment,
        error: null,
      });

      // Mock refund record creation
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'refund-123' },
        error: null,
      });

      // Mock payment update
      mockSupabase.eq.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Mock invoice lookup - invoice with only this payment
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          ...mockInvoice,
          payments: [mockPayment], // Only one payment
        },
        error: null,
      });

      await processManualRefund(
        'payment-123',
        5000, // Full refund
        'Customer requested refund',
        'cash'
      );

      // Should update invoice status to pending since no payments remain
      expect(mockSupabase.update).toHaveBeenCalledWith({ status: 'pending' });
    });

    it('should update invoice status to partially_paid when partially refunded', async () => {
      // Mock payment lookup
      mockSupabase.single.mockResolvedValueOnce({
        data: mockPayment,
        error: null,
      });

      // Mock refund record creation
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'refund-123' },
        error: null,
      });

      // Mock payment update
      mockSupabase.eq.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Mock invoice lookup
      mockSupabase.single.mockResolvedValueOnce({
        data: mockInvoice,
        error: null,
      });

      await processManualRefund(
        'payment-123',
        2500, // Partial refund
        'Partial refund requested',
        'cash'
      );

      // Should update invoice status to partially_paid
      expect(mockSupabase.update).toHaveBeenCalledWith({
        status: 'partially_paid',
      });
    });
  });

  describe('path revalidation', () => {
    it('should revalidate invoice paths after successful refund', async () => {
      // Mock successful refund flow
      mockSupabase.single
        .mockResolvedValueOnce({
          data: mockPayment,
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: 'refund-123' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: mockInvoice,
          error: null,
        });

      mockSupabase.eq.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      await processManualRefund('payment-123', 2500, 'Test refund', 'cash');

      expect(revalidatePath).toHaveBeenCalledWith('/invoices');
      expect(revalidatePath).toHaveBeenCalledWith('/invoices/invoice-123');
    });
  });
});
