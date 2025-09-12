import { getOrdersPaginated } from '@/lib/actions/orders';
import { createClient } from '@/lib/supabase/server';
import { ensureUserAndShop } from '@/lib/auth/user-shop';

jest.mock('@/lib/supabase/server');
jest.mock('@/lib/auth/user-shop');

describe('getOrdersPaginated', () => {
  const mockSupabase = {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
    },
  };

  const mockShop = {
    id: 'shop-123',
    name: 'Test Shop',
  };

  const mockQuery = {
    select: jest.fn(),
    eq: jest.fn(),
    or: jest.fn(),
    neq: jest.fn(),
    in: jest.fn(),
    order: jest.fn(),
    range: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
    (ensureUserAndShop as jest.Mock).mockResolvedValue({
      shop: mockShop,
      user: { id: 'user-123' },
    });

    // Set up the chain of mock query methods
    mockSupabase.from.mockReturnValue(mockQuery);
    mockQuery.select.mockReturnValue(mockQuery);
    mockQuery.eq.mockReturnValue(mockQuery);
    mockQuery.or.mockReturnValue(mockQuery);
    mockQuery.neq.mockReturnValue(mockQuery);
    mockQuery.in.mockReturnValue(mockQuery);
    mockQuery.order.mockReturnValue(mockQuery);
    mockQuery.range.mockReturnValue(mockQuery);
  });

  describe('onlyActive filter', () => {
    it('should filter to only active orders when onlyActive is true', async () => {
      const mockData = [
        {
          id: 'order-1',
          status: 'new',
          order_number: 'ORD-001',
          total_cents: 5000,
          client: { id: 'client-1', first_name: 'John', last_name: 'Doe' },
          garments: [],
          invoices: [],
        },
      ];

      mockQuery.range.mockResolvedValue({
        data: mockData,
        error: null,
        count: 1,
      });

      await getOrdersPaginated(1, 10, { onlyActive: true });

      // Verify that the query filters to active statuses
      expect(mockQuery.in).toHaveBeenCalledWith('status', [
        'new',
        'in_progress',
        'ready_for_pickup',
      ]);
      expect(mockQuery.neq).not.toHaveBeenCalledWith('status', 'cancelled');
    });

    it('should include all statuses when onlyActive is false', async () => {
      const mockData = [
        {
          id: 'order-1',
          status: 'completed',
          order_number: 'ORD-001',
          total_cents: 5000,
          client: { id: 'client-1', first_name: 'John', last_name: 'Doe' },
          garments: [],
          invoices: [],
        },
      ];

      mockQuery.range.mockResolvedValue({
        data: mockData,
        error: null,
        count: 1,
      });

      await getOrdersPaginated(1, 10, { onlyActive: false });

      // Verify that the query excludes cancelled but includes completed
      expect(mockQuery.neq).toHaveBeenCalledWith('status', 'cancelled');
      expect(mockQuery.in).not.toHaveBeenCalledWith('status', [
        'new',
        'in_progress',
        'ready_for_pickup',
      ]);
    });

    it('should default to excluding cancelled orders when no active filter is specified', async () => {
      const mockData = [
        {
          id: 'order-1',
          status: 'completed',
          order_number: 'ORD-001',
          total_cents: 5000,
          client: { id: 'client-1', first_name: 'John', last_name: 'Doe' },
          garments: [],
          invoices: [],
        },
      ];

      mockQuery.range.mockResolvedValue({
        data: mockData,
        error: null,
        count: 1,
      });

      await getOrdersPaginated(1, 10, {});

      // Verify that the query excludes cancelled by default
      expect(mockQuery.neq).toHaveBeenCalledWith('status', 'cancelled');
    });

    it('should handle onlyCancelled filter correctly', async () => {
      const mockData = [
        {
          id: 'order-1',
          status: 'cancelled',
          order_number: 'ORD-001',
          total_cents: 5000,
          client: { id: 'client-1', first_name: 'John', last_name: 'Doe' },
          garments: [],
          invoices: [],
        },
      ];

      mockQuery.range.mockResolvedValue({
        data: mockData,
        error: null,
        count: 1,
      });

      await getOrdersPaginated(1, 10, { onlyCancelled: true });

      // Verify that the query filters to only cancelled orders
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'cancelled');
      expect(mockQuery.in).not.toHaveBeenCalledWith('status', [
        'new',
        'in_progress',
        'ready_for_pickup',
      ]);
    });

    it('should not apply specific status filter when onlyActive is true', async () => {
      const mockData = [
        {
          id: 'order-1',
          status: 'new',
          order_number: 'ORD-001',
          total_cents: 5000,
          client: { id: 'client-1', first_name: 'John', last_name: 'Doe' },
          garments: [],
          invoices: [],
        },
      ];

      mockQuery.range.mockResolvedValue({
        data: mockData,
        error: null,
        count: 1,
      });

      // This should filter to active orders, not specifically to 'new'
      await getOrdersPaginated(1, 10, { onlyActive: true, status: 'new' });

      // Verify that the active filter takes precedence
      expect(mockQuery.in).toHaveBeenCalledWith('status', [
        'new',
        'in_progress',
        'ready_for_pickup',
      ]);
      // Should not apply the specific status filter when onlyActive is true
      expect(mockQuery.eq).not.toHaveBeenCalledWith('status', 'new');
    });

    it('should apply specific status filter when onlyActive is false', async () => {
      const mockData = [
        {
          id: 'order-1',
          status: 'new',
          order_number: 'ORD-001',
          total_cents: 5000,
          client: { id: 'client-1', first_name: 'John', last_name: 'Doe' },
          garments: [],
          invoices: [],
        },
      ];

      mockQuery.range.mockResolvedValue({
        data: mockData,
        error: null,
        count: 1,
      });

      await getOrdersPaginated(1, 10, { onlyActive: false, status: 'new' });

      // Verify that the specific status filter is applied
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'new');
      expect(mockQuery.in).not.toHaveBeenCalledWith('status', [
        'new',
        'in_progress',
        'ready_for_pickup',
      ]);
    });

    it('should calculate payment info correctly for active orders', async () => {
      const mockData = [
        {
          id: 'order-1',
          status: 'in_progress',
          order_number: 'ORD-001',
          total_cents: 10000,
          client: { id: 'client-1', first_name: 'John', last_name: 'Doe' },
          garments: [],
          invoices: [
            {
              id: 'invoice-1',
              status: 'sent',
              amount_cents: 10000,
              payments: [
                {
                  id: 'payment-1',
                  amount_cents: 5000,
                  status: 'completed',
                  payment_method: 'card',
                  refunded_amount_cents: 0,
                },
              ],
            },
          ],
        },
      ];

      mockQuery.range.mockResolvedValue({
        data: mockData,
        error: null,
        count: 1,
      });

      const result = await getOrdersPaginated(1, 10, { onlyActive: true });

      // Verify that payment information is calculated correctly
      expect(result.data[0]?.paid_amount_cents).toBe(5000);
      expect(result.data[0]?.payment_status).toBe('partial');
    });
  });

  describe('error handling', () => {
    it('should throw error when query fails', async () => {
      mockQuery.range.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
        count: 0,
      });

      await expect(
        getOrdersPaginated(1, 10, { onlyActive: true })
      ).rejects.toThrow('Failed to fetch orders: Database error');
    });
  });

  describe('pagination', () => {
    it('should apply correct pagination parameters', async () => {
      const mockData: any[] = [];
      mockQuery.range.mockResolvedValue({
        data: mockData,
        error: null,
        count: 0,
      });

      await getOrdersPaginated(2, 25, { onlyActive: true });

      // Verify pagination parameters (page 2 with 25 items per page)
      expect(mockQuery.range).toHaveBeenCalledWith(25, 49); // (2-1)*25 = 25, 25+25-1 = 49
    });
  });
});
