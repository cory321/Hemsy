import { getBusinessHealthData } from '@/lib/actions/dashboard';
import { createClient } from '@/lib/supabase/server';
import { ensureUserAndShop } from '@/lib/auth/user-shop';
import { auth } from '@clerk/nextjs/server';

jest.mock('@/lib/supabase/server');
jest.mock('@/lib/auth/user-shop');
jest.mock('@clerk/nextjs/server');

describe('getBusinessHealthData', () => {
  const mockSupabase = {
    from: jest.fn(),
  };

  const mockShop = {
    id: 'shop-123',
    name: 'Test Shop',
    timezone: 'America/New_York',
  };

  const mockUser = {
    id: 'user-123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
    (ensureUserAndShop as jest.Mock).mockResolvedValue({
      shop: mockShop,
      user: mockUser,
    });
    (auth as unknown as jest.Mock).mockResolvedValue({
      userId: 'clerk-user-123',
    });

    // Mock the timezone lookup that happens at the beginning of getBusinessHealthData
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'shops') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { timezone: 'America/New_York' },
            error: null,
          }),
        };
      }
      // Default fallback for other tables
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockResolvedValue({ data: [] }),
      };
    });
  });

  describe('successful data retrieval', () => {
    it('should calculate business health data correctly', async () => {
      const today = new Date();
      const firstDayThisMonth = new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      );
      const firstDayLastMonth = new Date(
        today.getFullYear(),
        today.getMonth() - 1,
        1
      );

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
      };

      const mockThisMonthPayments = {
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
      };

      const mockLastMonthPayments = {
        data: [
          {
            amount_cents: 8000,
            refunded_amount_cents: 0,
            invoice: { shop_id: 'shop-123' },
          },
        ],
      };

      let callCount = 0;
      mockSupabase.from.mockImplementation((table: string) => {
        callCount++;

        // Always handle timezone lookup first
        if (table === 'shops') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { timezone: 'America/New_York' },
              error: null,
            }),
          };
        } else if (table === 'orders') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            neq: jest.fn().mockResolvedValue(mockUnpaidOrders),
          };
        } else if (table === 'payments') {
          const isThisMonth = callCount === 3; // Adjusted for timezone call
          const isLastMonth = callCount === 4; // Adjusted for timezone call

          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            in: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            lt: jest
              .fn()
              .mockResolvedValue(
                isThisMonth
                  ? mockThisMonthPayments
                  : isLastMonth
                    ? mockLastMonthPayments
                    : { data: [] }
              ),
          };
        }

        // Default fallback
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          neq: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          lt: jest.fn().mockResolvedValue({ data: [] }),
        };
      });

      const result = await getBusinessHealthData();

      expect(result.unpaidBalanceCents).toBe(12000); // $70 + $50 = $120 unpaid
      expect(result.unpaidOrdersCount).toBe(2);
      expect(result.currentMonthRevenueCents).toBe(14000); // $100 + $40 = $140
      expect(result.lastMonthRevenueCents).toBe(8000); // $80
      expect(result.monthlyRevenueComparison).toBe(75); // 75% increase
      expect(result.currentPeriodLabel).toMatch(/^\w{3} \d+-\d+$/); // e.g., "Dec 1-8"
      expect(result.comparisonPeriodLabel).toMatch(/^\w{3} \d+-\d+$/); // e.g., "Nov 1-8"
      expect(result.rolling30DayLabel).toMatch(/^\w{3} \d+ - \w{3} \d+$/); // e.g., "Nov 9 - Dec 8"
      expect(result.previous30DayLabel).toMatch(/^\w{3} \d+ - \w{3} \d+$/); // e.g., "Oct 9 - Nov 8"
    });

    it('should handle 100% increase when last month had no revenue', async () => {
      const mockThisMonthPayments = {
        data: [
          {
            amount_cents: 5000,
            refunded_amount_cents: 0,
            invoice: { shop_id: 'shop-123' },
          },
        ],
      };

      let callCount = 0;
      mockSupabase.from.mockImplementation((table: string) => {
        callCount++;

        // Always handle timezone lookup first
        if (table === 'shops') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { timezone: 'America/New_York' },
              error: null,
            }),
          };
        } else if (table === 'orders') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            neq: jest.fn().mockResolvedValue({ data: [] }),
          };
        } else if (table === 'payments') {
          const isThisMonth = callCount === 3; // Adjusted for timezone call

          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            in: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            lt: jest
              .fn()
              .mockResolvedValue(
                isThisMonth ? mockThisMonthPayments : { data: [] }
              ),
          };
        }

        // Default fallback
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          neq: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          lt: jest.fn().mockResolvedValue({ data: [] }),
        };
      });

      const result = await getBusinessHealthData();

      expect(result.currentMonthRevenueCents).toBe(5000);
      expect(result.lastMonthRevenueCents).toBe(0);
      expect(result.monthlyRevenueComparison).toBe(100); // 100% increase from $0
      expect(result.currentPeriodLabel).toBeDefined();
      expect(result.comparisonPeriodLabel).toBeDefined();
      expect(result.rolling30DayLabel).toBeDefined();
      expect(result.previous30DayLabel).toBeDefined();
    });

    it('should handle zero revenue correctly', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        // Always handle timezone lookup first
        if (table === 'shops') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { timezone: 'America/New_York' },
              error: null,
            }),
          };
        }

        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          neq: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          lt: jest.fn().mockResolvedValue({ data: [] }),
        };
      });

      const result = await getBusinessHealthData();

      expect(result.unpaidBalanceCents).toBe(0);
      expect(result.unpaidOrdersCount).toBe(0);
      expect(result.currentMonthRevenueCents).toBe(0);
      expect(result.lastMonthRevenueCents).toBe(0);
      expect(result.monthlyRevenueComparison).toBe(0);
      expect(result.currentPeriodLabel).toBeDefined();
      expect(result.comparisonPeriodLabel).toBeDefined();
      expect(result.rolling30DayLabel).toBeDefined();
      expect(result.previous30DayLabel).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should throw error when database query fails', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      await expect(getBusinessHealthData()).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should throw error when user is not authenticated', async () => {
      (auth as unknown as jest.Mock).mockResolvedValue({ userId: null });

      await expect(getBusinessHealthData()).rejects.toThrow('Unauthorized');
    });
  });
});
