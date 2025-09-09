import { getOrderStats } from '@/lib/actions/orders';
import { createClient } from '@/lib/supabase/server';
import { ensureUserAndShop } from '@/lib/auth/user-shop';

jest.mock('@/lib/supabase/server');
jest.mock('@/lib/auth/user-shop');

describe('getOrderStats', () => {
  const mockShop = {
    id: 'shop-123',
    name: 'Test Shop',
  };

  // Helper function to create a proper mock query chain
  const createMockQueryChain = (
    finalValue: any,
    finalMethod: string = 'neq'
  ) => {
    const chain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
    };

    // For the last method in the chain, return the final value
    if (finalMethod === 'eq') {
      // Special case for double eq() - return another object with eq that resolves
      chain.eq = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue(finalValue),
      });
    } else if (finalMethod === 'lte') {
      // Special case for due this week query which has .neq().neq().gte().lte()
      chain.neq = jest.fn().mockReturnValue({
        neq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockResolvedValue(finalValue),
      });
    } else {
      (chain as any)[finalMethod] = jest.fn().mockResolvedValue(finalValue);
    }

    return chain;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (ensureUserAndShop as jest.Mock).mockResolvedValue({
      shop: mockShop,
      user: { id: 'user-123' },
    });
  });

  describe('successful stats retrieval', () => {
    it('should calculate unpaid balance correctly', async () => {
      const mockUnpaidOrders = {
        data: [
          {
            total_cents: 10000, // $100
            invoices: [
              {
                payments: [
                  {
                    amount_cents: 3000,
                    status: 'completed',
                    refunded_amount_cents: 0,
                  },
                ],
              },
            ],
          },
          {
            total_cents: 5000, // $50
            invoices: [], // No payments
          },
        ],
        error: null,
      };

      const mockSupabase = {
        from: jest.fn(),
      };

      let callCount = 0;
      mockSupabase.from.mockImplementation(() => {
        callCount++;

        switch (callCount) {
          case 1: // Unpaid orders query ends with .neq()
            return createMockQueryChain(mockUnpaidOrders, 'neq');
          case 2: // Due this week query ends with .lte()
            return createMockQueryChain({ data: [], error: null }, 'lte');
          case 3: // This month payments query ends with .lt()
            return createMockQueryChain({ data: [], error: null }, 'lt');
          case 4: // Last month payments query ends with .lt()
            return createMockQueryChain({ data: [], error: null }, 'lt');
          case 5: // In progress orders query ends with .eq().eq()
            return createMockQueryChain({ data: [], error: null }, 'eq');
          default:
            return createMockQueryChain({ data: [], error: null }, 'neq');
        }
      });

      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const result = await getOrderStats();

      expect(result.unpaidCount).toBe(2);
      expect(result.unpaidAmountCents).toBe(12000); // $70 + $50 = $120 unpaid
    });

    it('should calculate due this week correctly', async () => {
      const today = new Date();
      const dueDate1 = new Date(today);
      dueDate1.setDate(dueDate1.getDate() + 3); // 3 days from now
      const dueDate2 = new Date(today);
      dueDate2.setDate(dueDate2.getDate() + 6); // 6 days from now

      const mockDueThisWeek = {
        data: [
          { total_cents: 5000, order_due_date: dueDate1.toISOString() },
          { total_cents: 3000, order_due_date: dueDate2.toISOString() },
        ],
        error: null,
      };

      const mockSupabase = {
        from: jest.fn(),
      };

      let callCount = 0;
      mockSupabase.from.mockImplementation(() => {
        callCount++;

        switch (callCount) {
          case 1: // Unpaid orders query
            return createMockQueryChain({ data: [], error: null }, 'neq');
          case 2: // Due this week query
            return createMockQueryChain(mockDueThisWeek, 'lte');
          case 3: // This month payments query
            return createMockQueryChain({ data: [], error: null }, 'lt');
          case 4: // Last month payments query
            return createMockQueryChain({ data: [], error: null }, 'lt');
          case 5: // In progress orders query
            return createMockQueryChain({ data: [], error: null }, 'eq');
          default:
            return createMockQueryChain({ data: [], error: null }, 'neq');
        }
      });

      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const result = await getOrderStats();

      expect(result.dueThisWeekCount).toBe(2);
      expect(result.dueThisWeekAmountCents).toBe(8000); // $50 + $30 = $80
    });

    it('should calculate monthly revenue and comparison', async () => {
      const mockMonthlyPayments = {
        data: [
          {
            amount_cents: 10000,
            refunded_amount_cents: 0,
            invoice: { shop_id: 'shop-123' },
          },
          {
            amount_cents: 5000,
            refunded_amount_cents: 1000, // $40 net
            invoice: { shop_id: 'shop-123' },
          },
        ],
        error: null,
      };

      const mockLastMonthPayments = {
        data: [
          {
            amount_cents: 8000,
            refunded_amount_cents: 0,
            invoice: { shop_id: 'shop-123' },
          },
        ],
        error: null,
      };

      const mockSupabase = {
        from: jest.fn(),
      };

      let callCount = 0;
      mockSupabase.from.mockImplementation(() => {
        callCount++;

        switch (callCount) {
          case 1: // Unpaid orders query
            return createMockQueryChain({ data: [], error: null }, 'neq');
          case 2: // Due this week query
            return createMockQueryChain({ data: [], error: null }, 'lte');
          case 3: // This month payments query
            return createMockQueryChain(mockMonthlyPayments, 'lt');
          case 4: // Last month payments query
            return createMockQueryChain(mockLastMonthPayments, 'lt');
          case 5: // In progress orders query
            return createMockQueryChain({ data: [], error: null }, 'eq');
          default:
            return createMockQueryChain({ data: [], error: null }, 'neq');
        }
      });

      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const result = await getOrderStats();

      expect(result.monthlyRevenueCents).toBe(14000); // $100 + $40 = $140
      expect(result.monthlyRevenueComparison).toBe(75); // 75% increase from $80 to $140
    });

    it('should handle 100% increase when last month had no revenue', async () => {
      const mockMonthlyPayments = {
        data: [
          {
            amount_cents: 5000,
            refunded_amount_cents: 0,
            invoice: { shop_id: 'shop-123' },
          },
        ],
        error: null,
      };

      const mockSupabase = {
        from: jest.fn(),
      };

      let callCount = 0;
      mockSupabase.from.mockImplementation(() => {
        callCount++;

        switch (callCount) {
          case 1: // Unpaid orders query
            return createMockQueryChain({ data: [], error: null }, 'neq');
          case 2: // Due this week query
            return createMockQueryChain({ data: [], error: null }, 'lte');
          case 3: // This month payments query
            return createMockQueryChain(mockMonthlyPayments, 'lt');
          case 4: // Last month payments query (empty)
            return createMockQueryChain({ data: [], error: null }, 'lt');
          case 5: // In progress orders query
            return createMockQueryChain({ data: [], error: null }, 'eq');
          default:
            return createMockQueryChain({ data: [], error: null }, 'neq');
        }
      });

      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const result = await getOrderStats();

      expect(result.monthlyRevenueCents).toBe(5000);
      expect(result.monthlyRevenueComparison).toBe(100); // 100% increase from $0
    });

    it('should calculate in progress orders correctly', async () => {
      const mockInProgressOrders = {
        data: [
          { total_cents: 7500 },
          { total_cents: 2500 },
          { total_cents: 5000 },
        ],
        error: null,
      };

      const mockSupabase = {
        from: jest.fn(),
      };

      let callCount = 0;
      mockSupabase.from.mockImplementation(() => {
        callCount++;

        switch (callCount) {
          case 1: // Unpaid orders query
            return createMockQueryChain({ data: [], error: null }, 'neq');
          case 2: // Due this week query
            return createMockQueryChain({ data: [], error: null }, 'lte');
          case 3: // This month payments query
            return createMockQueryChain({ data: [], error: null }, 'lt');
          case 4: // Last month payments query
            return createMockQueryChain({ data: [], error: null }, 'lt');
          case 5: // In progress orders query
            return createMockQueryChain(mockInProgressOrders, 'eq');
          default:
            return createMockQueryChain({ data: [], error: null }, 'neq');
        }
      });

      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const result = await getOrderStats();

      expect(result.inProgressCount).toBe(3);
      expect(result.inProgressAmountCents).toBe(15000); // $75 + $25 + $50 = $150
    });
  });

  describe('error handling', () => {
    it('should throw error when database query fails', async () => {
      const mockSupabase = {
        from: jest.fn(() => {
          throw new Error('Database connection failed');
        }),
      };

      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      await expect(getOrderStats()).rejects.toThrow(
        'Failed to fetch order statistics'
      );
    });

    it('should handle null/undefined data gracefully', async () => {
      const mockSupabase = {
        from: jest.fn(),
      };

      let callCount = 0;
      mockSupabase.from.mockImplementation(() => {
        callCount++;

        switch (callCount) {
          case 1: // Unpaid orders query
            return createMockQueryChain({ data: null, error: null }, 'neq');
          case 2: // Due this week query
            return createMockQueryChain({ data: null, error: null }, 'lte');
          case 3: // This month payments query
            return createMockQueryChain({ data: null, error: null }, 'lt');
          case 4: // Last month payments query
            return createMockQueryChain({ data: null, error: null }, 'lt');
          case 5: // In progress orders query
            return createMockQueryChain({ data: null, error: null }, 'eq');
          default:
            return createMockQueryChain({ data: null, error: null }, 'neq');
        }
      });

      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const result = await getOrderStats();

      expect(result).toEqual({
        unpaidCount: 0,
        unpaidAmountCents: 0,
        dueThisWeekCount: 0,
        dueThisWeekAmountCents: 0,
        monthlyRevenueCents: 0,
        monthlyRevenueComparison: 0,
        inProgressCount: 0,
        inProgressAmountCents: 0,
      });
    });
  });
});
