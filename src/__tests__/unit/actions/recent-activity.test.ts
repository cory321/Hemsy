import { getRecentActivity } from '@/lib/actions/recent-activity';
import { createClient } from '@/lib/supabase/server';
import { ensureUserAndShop } from '@/lib/auth/user-shop';

// Mock dependencies
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/auth/user-shop');

const mockCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>;
const mockEnsureUserAndShop = ensureUserAndShop as jest.MockedFunction<
  typeof ensureUserAndShop
>;

describe('getRecentActivity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should respect the limit parameter', async () => {
    // Mock successful auth
    mockEnsureUserAndShop.mockResolvedValueOnce({
      shop: { id: 'test-shop-id' } as any,
      user: { id: 'test-user-id' } as any,
    });

    // Mock supabase client with empty results
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
    };

    // Mock all database queries to return empty arrays
    mockSupabase.limit.mockResolvedValue({ data: [] });
    mockCreateClient.mockResolvedValueOnce(mockSupabase as any);

    const result = await getRecentActivity(3);

    // Should return empty array since no data, but respects the limit
    expect(result).toHaveLength(0);
  });

  it('should return activities sorted by timestamp', async () => {
    // Mock successful auth
    mockEnsureUserAndShop.mockResolvedValueOnce({
      shop: { id: 'test-shop-id' } as any,
      user: { id: 'test-user-id' } as any,
    });

    // Mock supabase client
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
    };

    // Mock payment data (high priority)
    const mockPayments = [
      {
        id: 'payment-1',
        amount_cents: 15000, // $150 - high priority
        processed_at: '2023-12-01T10:00:00Z',
        invoice: {
          order: {
            order_number: 'ORD-001',
            client: { first_name: 'Lisa', last_name: 'C.' },
          },
        },
      },
    ];

    // Mock garment data (high priority)
    const mockGarments = [
      {
        id: 'garment-1',
        name: 'Evening dress',
        stage: 'Done',
        updated_at: '2023-12-01T09:00:00Z',
        order: {
          order_number: 'ORD-002',
          client: { first_name: 'Amy', last_name: 'R.' },
        },
      },
    ];

    // Set up mock responses for different queries
    let callCount = 0;
    mockSupabase.limit.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // Payments query
        return Promise.resolve({ data: mockPayments });
      } else if (callCount === 2) {
        // Garments query
        return Promise.resolve({ data: mockGarments });
      } else {
        // All other queries return empty
        return Promise.resolve({ data: [] });
      }
    });

    mockCreateClient.mockResolvedValueOnce(mockSupabase as any);

    const result = await getRecentActivity(5);

    expect(result).toHaveLength(2);
    // Should be sorted by timestamp (most recent first)
    expect(result[0]).toMatchObject({
      type: 'payment',
      text: 'Payment received',
    });
    expect(result[1]).toMatchObject({
      type: 'garment',
      text: 'Garment completed',
    });
  });

  it('should handle different activity types correctly', async () => {
    // Mock successful auth
    mockEnsureUserAndShop.mockResolvedValueOnce({
      shop: { id: 'test-shop-id' } as any,
      user: { id: 'test-user-id' } as any,
    });

    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
    };

    // Mock different types of activities
    const mockGarments = [
      {
        id: 'garment-1',
        name: 'Wedding dress',
        stage: 'Ready For Pickup',
        updated_at: '2023-12-01T10:00:00Z',
        order: {
          order_number: 'ORD-001',
          client: { first_name: 'Sarah', last_name: 'M.' },
        },
      },
      {
        id: 'garment-2',
        name: 'Evening dress',
        stage: 'In Progress',
        updated_at: '2023-12-01T09:00:00Z',
        order: {
          order_number: 'ORD-002',
          client: { first_name: 'Amy', last_name: 'R.' },
        },
      },
    ];

    let callCount = 0;
    mockSupabase.limit.mockImplementation(() => {
      callCount++;
      if (callCount === 2) {
        // Garments query
        return Promise.resolve({ data: mockGarments });
      } else {
        // All other queries return empty
        return Promise.resolve({ data: [] });
      }
    });

    mockCreateClient.mockResolvedValueOnce(mockSupabase as any);

    const result = await getRecentActivity(5);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      type: 'garment',
      text: 'Garment ready for pickup',
      detail: 'Wedding dress for Sarah M.',
    });
    expect(result[1]).toMatchObject({
      type: 'garment',
      text: 'Garment work started',
      detail: 'Evening dress for Amy R.',
    });
  });
});
