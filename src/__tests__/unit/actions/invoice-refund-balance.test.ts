import { getInvoiceBalance } from '@/lib/actions/invoice-sync';
import { createClient } from '@/lib/supabase/admin';
import { ensureUserAndShop } from '@/lib/auth/user-shop';

// Mock dependencies
jest.mock('@/lib/supabase/admin');
jest.mock('@/lib/auth/user-shop');

const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn(),
};

(createClient as jest.Mock).mockReturnValue(mockSupabase);
(ensureUserAndShop as jest.Mock).mockResolvedValue({
  shop: { id: 'shop-1' },
  user: { id: 'user-1' },
});

describe('Invoice Balance with Refunds', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should calculate balance correctly with no refunds', async () => {
    const mockOrder = {
      id: 'order-1',
      invoices: [
        {
          id: 'invoice-1',
          amount_cents: 10000, // $100
          deposit_amount_cents: 3000, // $30
          status: 'partial',
          payments: [
            {
              amount_cents: 5000, // $50 paid
              status: 'completed',
              refunded_amount_cents: 0,
            },
          ],
        },
      ],
    };

    mockSupabase.single.mockResolvedValue({ data: mockOrder, error: null });

    const result = await getInvoiceBalance('order-1');

    expect(result.success).toBe(true);
    expect(result.balance).toEqual({
      invoiceId: 'invoice-1',
      totalAmount: 10000,
      totalPaid: 5000,
      totalRefunded: 0,
      netPaid: 5000,
      balanceDue: 5000, // $100 - $50 = $50 due
      depositRequired: 3000,
      depositPaid: 3000, // Min of $50 paid and $30 required
      depositRemaining: 0,
      status: 'partial',
      canStartWork: true,
      hasRefunds: false,
      hasCredit: false,
    });
  });

  it('should calculate balance correctly with partial refunds', async () => {
    const mockOrder = {
      id: 'order-1',
      invoices: [
        {
          id: 'invoice-1',
          amount_cents: 10000, // $100
          deposit_amount_cents: 3000, // $30
          status: 'partial',
          payments: [
            {
              amount_cents: 8000, // $80 paid
              status: 'completed',
              refunded_amount_cents: 2000, // $20 refunded
            },
          ],
        },
      ],
    };

    mockSupabase.single.mockResolvedValue({ data: mockOrder, error: null });

    const result = await getInvoiceBalance('order-1');

    expect(result.success).toBe(true);
    expect(result.balance).toEqual({
      invoiceId: 'invoice-1',
      totalAmount: 10000,
      totalPaid: 8000,
      totalRefunded: 2000,
      netPaid: 6000, // $80 - $20 = $60 net paid
      balanceDue: 4000, // $100 - $60 = $40 due
      depositRequired: 3000,
      depositPaid: 3000,
      depositRemaining: 0,
      status: 'partial',
      canStartWork: true,
      hasRefunds: true,
      hasCredit: false,
    });
  });

  it('should calculate balance correctly with over-refund (credit scenario)', async () => {
    const mockOrder = {
      id: 'order-1',
      invoices: [
        {
          id: 'invoice-1',
          amount_cents: 10000, // $100
          deposit_amount_cents: 3000, // $30
          status: 'paid',
          payments: [
            {
              amount_cents: 12000, // $120 paid
              status: 'completed',
              refunded_amount_cents: 3000, // $30 refunded
            },
          ],
        },
      ],
    };

    mockSupabase.single.mockResolvedValue({ data: mockOrder, error: null });

    const result = await getInvoiceBalance('order-1');

    expect(result.success).toBe(true);
    expect(result.balance).toEqual({
      invoiceId: 'invoice-1',
      totalAmount: 10000,
      totalPaid: 12000,
      totalRefunded: 3000,
      netPaid: 9000, // $120 - $30 = $90 net paid
      balanceDue: 1000, // $100 - $90 = $10 due (still owed)
      depositRequired: 3000,
      depositPaid: 3000,
      depositRemaining: 0,
      status: 'paid',
      canStartWork: true,
      hasRefunds: true,
      hasCredit: false,
    });
  });

  it('should handle credit balance when refunds exceed invoice amount', async () => {
    const mockOrder = {
      id: 'order-1',
      invoices: [
        {
          id: 'invoice-1',
          amount_cents: 10000, // $100
          deposit_amount_cents: 3000, // $30
          status: 'paid',
          payments: [
            {
              amount_cents: 12000, // $120 paid
              status: 'completed',
              refunded_amount_cents: 1000, // $10 refunded
            },
          ],
        },
      ],
    };

    mockSupabase.single.mockResolvedValue({ data: mockOrder, error: null });

    const result = await getInvoiceBalance('order-1');

    expect(result.success).toBe(true);
    expect(result.balance).toEqual({
      invoiceId: 'invoice-1',
      totalAmount: 10000,
      totalPaid: 12000,
      totalRefunded: 1000,
      netPaid: 11000, // $120 - $10 = $110 net paid
      balanceDue: -1000, // $100 - $110 = -$10 (credit)
      depositRequired: 3000,
      depositPaid: 3000,
      depositRemaining: 0,
      status: 'paid',
      canStartWork: true,
      hasRefunds: true,
      hasCredit: true,
    });
  });

  it('should handle multiple payments with mixed refund scenarios', async () => {
    const mockOrder = {
      id: 'order-1',
      invoices: [
        {
          id: 'invoice-1',
          amount_cents: 15000, // $150
          deposit_amount_cents: 5000, // $50
          status: 'partial',
          payments: [
            {
              amount_cents: 5000, // $50 paid (deposit)
              status: 'completed',
              refunded_amount_cents: 0, // No refund
            },
            {
              amount_cents: 8000, // $80 paid
              status: 'completed',
              refunded_amount_cents: 3000, // $30 refunded
            },
            {
              amount_cents: 2000, // $20 paid
              status: 'failed',
              refunded_amount_cents: 0, // Failed payment, not counted
            },
          ],
        },
      ],
    };

    mockSupabase.single.mockResolvedValue({ data: mockOrder, error: null });

    const result = await getInvoiceBalance('order-1');

    expect(result.success).toBe(true);
    expect(result.balance).toEqual({
      invoiceId: 'invoice-1',
      totalAmount: 15000,
      totalPaid: 13000, // $50 + $80 = $130 (failed payment not counted)
      totalRefunded: 3000, // $30 total refunded
      netPaid: 10000, // $130 - $30 = $100 net paid
      balanceDue: 5000, // $150 - $100 = $50 due
      depositRequired: 5000,
      depositPaid: 5000, // Min of $130 paid and $50 required
      depositRemaining: 0,
      status: 'partial',
      canStartWork: true,
      hasRefunds: true,
      hasCredit: false,
    });
  });

  it('should handle invoice with no payments', async () => {
    const mockOrder = {
      id: 'order-1',
      invoices: [
        {
          id: 'invoice-1',
          amount_cents: 10000, // $100
          deposit_amount_cents: 3000, // $30
          status: 'pending',
          payments: [],
        },
      ],
    };

    mockSupabase.single.mockResolvedValue({ data: mockOrder, error: null });

    const result = await getInvoiceBalance('order-1');

    expect(result.success).toBe(true);
    expect(result.balance).toEqual({
      invoiceId: 'invoice-1',
      totalAmount: 10000,
      totalPaid: 0,
      totalRefunded: 0,
      netPaid: 0,
      balanceDue: 10000, // Full amount due
      depositRequired: 3000,
      depositPaid: 0,
      depositRemaining: 3000,
      status: 'pending',
      canStartWork: false,
      hasRefunds: false,
      hasCredit: false,
    });
  });
});
