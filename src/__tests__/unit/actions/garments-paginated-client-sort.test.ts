import { describe, it, expect, beforeEach } from '@jest/globals';
import { getGarmentsPaginated } from '@/lib/actions/garments-paginated';
import { createClient } from '@/lib/supabase/server';

// Mock dependencies
jest.mock('@/lib/supabase/server');

describe('getGarmentsPaginated - Client Name Sorting', () => {
  const mockShopId = '123e4567-e89b-12d3-a456-426614174000';

  // Mock supabase client for view queries
  const mockViewQuery: any = {
    from: jest.fn(() => mockViewQuery),
    select: jest.fn(() => mockViewQuery),
    eq: jest.fn(() => mockViewQuery),
    neq: jest.fn(() => mockViewQuery),
    not: jest.fn(() => mockViewQuery),
    lt: jest.fn(() => mockViewQuery),
    or: jest.fn(() => mockViewQuery),
    order: jest.fn(() => mockViewQuery),
    limit: jest.fn(() => mockViewQuery),
  };

  // Mock supabase client for regular queries
  const mockRegularQuery: any = {
    from: jest.fn(() => mockRegularQuery),
    select: jest.fn(() => mockRegularQuery),
    eq: jest.fn(() => mockRegularQuery),
    neq: jest.fn(() => mockRegularQuery),
    not: jest.fn(() => mockRegularQuery),
    lt: jest.fn(() => mockRegularQuery),
    or: jest.fn(() => mockRegularQuery),
    order: jest.fn(() => mockRegularQuery),
    limit: jest.fn(() => mockRegularQuery),
  };

  const mockSupabaseClient = {
    from: jest.fn((table: string) => {
      if (table === 'garments_with_clients') {
        return mockViewQuery;
      }
      return mockRegularQuery;
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.MockedFunction<any>).mockResolvedValue(
      mockSupabaseClient
    );
  });

  it('should use garments_with_clients view when sorting by client_name', async () => {
    const mockGarments = [
      {
        id: '1',
        name: 'Dress',
        stage: 'New',
        order_id: 'order1',
        created_at: '2024-01-01T00:00:00Z',
        is_done: false,
        client_full_name: 'Alice Smith',
        client_first_name: 'Alice',
        client_last_name: 'Smith',
      },
      {
        id: '2',
        name: 'Shirt',
        stage: 'In Progress',
        order_id: 'order2',
        created_at: '2024-01-02T00:00:00Z',
        is_done: false,
        client_full_name: 'Bob Jones',
        client_first_name: 'Bob',
        client_last_name: 'Jones',
      },
    ];

    mockViewQuery.select.mockReturnValue(mockViewQuery);
    mockViewQuery.eq.mockReturnValue(mockViewQuery);
    mockViewQuery.order.mockReturnValue(mockViewQuery);
    mockViewQuery.limit.mockReturnValue(mockViewQuery);
    mockViewQuery.limit.mockResolvedValue({
      data: mockGarments,
      error: null,
      count: 2,
    });

    const result = await getGarmentsPaginated({
      shopId: mockShopId,
      sortField: 'client_name',
      sortOrder: 'asc',
      limit: 20,
    });

    // Verify it used the view
    expect(mockSupabaseClient.from).toHaveBeenCalledWith(
      'garments_with_clients'
    );

    // Verify sorting was applied
    expect(mockViewQuery.order).toHaveBeenCalledWith('client_full_name', {
      ascending: true,
      nullsFirst: false,
    });

    // Check the results
    expect(result.garments).toHaveLength(2);
    expect(result.garments[0]?.client_name).toBe('Alice Smith');
    expect(result.garments[1]?.client_name).toBe('Bob Jones');
  });

  it('should include client name in cursor when sorting by client_name', async () => {
    const mockGarments = [
      {
        id: '1',
        name: 'Dress',
        stage: 'New',
        order_id: 'order1',
        created_at: '2024-01-01T00:00:00Z',
        is_done: false,
        client_full_name: 'Alice Smith',
        client_first_name: 'Alice',
        client_last_name: 'Smith',
      },
    ];

    mockViewQuery.select.mockReturnValue(mockViewQuery);
    mockViewQuery.eq.mockReturnValue(mockViewQuery);
    mockViewQuery.order.mockReturnValue(mockViewQuery);
    mockViewQuery.limit.mockReturnValue(mockViewQuery);
    mockViewQuery.limit.mockResolvedValue({
      data: mockGarments,
      error: null,
      count: 10, // More than limit to trigger hasMore
    });

    const result = await getGarmentsPaginated({
      shopId: mockShopId,
      sortField: 'client_name',
      sortOrder: 'asc',
      limit: 1,
    });

    // Check that cursor includes client name
    expect(result.nextCursor).toBeDefined();
    expect(result.nextCursor?.lastClientName).toBe('Alice Smith');
    expect(result.nextCursor?.lastId).toBe('1');
    expect(result.nextCursor?.lastCreatedAt).toBe('2024-01-01T00:00:00Z');
  });

  it('should apply client name cursor filter for pagination', async () => {
    mockViewQuery.select.mockReturnValue(mockViewQuery);
    mockViewQuery.eq.mockReturnValue(mockViewQuery);
    mockViewQuery.or.mockReturnValue(mockViewQuery);
    mockViewQuery.order.mockReturnValue(mockViewQuery);
    mockViewQuery.limit.mockReturnValue(mockViewQuery);
    mockViewQuery.limit.mockResolvedValue({
      data: [],
      error: null,
      count: 0,
    });

    await getGarmentsPaginated({
      shopId: mockShopId,
      sortField: 'client_name',
      sortOrder: 'asc',
      cursor: {
        lastId: '123e4567-e89b-12d3-a456-426614174001',
        lastCreatedAt: '2024-01-01T00:00:00Z',
        lastClientName: 'Alice Smith',
      },
      limit: 20,
    });

    // Verify cursor filter was applied
    expect(mockViewQuery.or).toHaveBeenCalledWith(
      expect.stringContaining('client_full_name.gt.Alice Smith')
    );
  });
});
