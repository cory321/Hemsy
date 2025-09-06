import { getOrdersByClient } from '../orders';
import { createClient } from '@/lib/supabase/server';

// Mock dependencies
jest.mock('@/lib/supabase/server');
jest.mock('../users', () => ({
  ensureUserAndShop: jest.fn().mockResolvedValue({
    user: { id: 'test-user-id' },
    shop: { id: 'test-shop-id' },
  }),
}));

const mockSupabaseClient = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  neq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
};

describe('getOrdersByClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockResolvedValue(mockSupabaseClient);
  });

  it('should fetch orders for a client successfully', async () => {
    const mockOrders = [
      {
        id: 'order-1',
        order_number: 'ORD-001',
        status: 'pending',
        total_cents: 5000,
        garments: [{ id: 'g1' }, { id: 'g2' }],
        client: {
          id: 'client-1',
          first_name: 'John',
          last_name: 'Doe',
        },
      },
      {
        id: 'order-2',
        order_number: 'ORD-002',
        status: 'completed',
        total_cents: 10000,
        garments: [{ id: 'g3' }],
        client: {
          id: 'client-1',
          first_name: 'John',
          last_name: 'Doe',
        },
      },
    ];

    mockSupabaseClient.order.mockResolvedValue({
      data: mockOrders,
      error: null,
    });

    const result = await getOrdersByClient('client-1');

    expect(result.success).toBe(true);
    expect(result.orders).toHaveLength(2);
    expect(result.orders[0]?.garment_count).toBe(2);
    expect(result.orders[1]?.garment_count).toBe(1);
    expect(result.orders[0]?.garments).toBeUndefined();
    expect(result.orders[1]?.garments).toBeUndefined();
  });

  it('should handle errors gracefully', async () => {
    mockSupabaseClient.order.mockResolvedValue({
      data: null,
      error: { message: 'Database error' },
    });

    const result = await getOrdersByClient('client-1');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Database error');
    expect(result.orders).toEqual([]);
  });

  it('should return empty array when no orders exist', async () => {
    mockSupabaseClient.order.mockResolvedValue({
      data: [],
      error: null,
    });

    const result = await getOrdersByClient('client-1');

    expect(result.success).toBe(true);
    expect(result.orders).toEqual([]);
  });
});
