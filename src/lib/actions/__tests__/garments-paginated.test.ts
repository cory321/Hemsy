import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  getGarmentsPaginated,
  type GetGarmentsPaginatedParams,
} from '../garments-paginated';
import { createClient } from '@/lib/supabase/server';
import { ensureUserAndShop } from '@/lib/auth/user-shop';

// Mock dependencies
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/auth/user-shop');

const mockSupabaseClient: any = {
  from: jest.fn((): any => mockSupabaseClient),
  select: jest.fn(() => mockSupabaseClient),
  eq: jest.fn(() => mockSupabaseClient),
  neq: jest.fn(() => mockSupabaseClient),
  lt: jest.fn(() => mockSupabaseClient),
  gt: jest.fn(() => mockSupabaseClient),
  not: jest.fn(() => mockSupabaseClient),
  or: jest.fn(() => mockSupabaseClient),
  order: jest.fn(() => mockSupabaseClient),
  limit: jest.fn(() => mockSupabaseClient),
};

describe('getGarmentsPaginated', () => {
  const mockShop = { id: '123e4567-e89b-12d3-a456-426614174000' };
  const mockUser = { id: '123e4567-e89b-12d3-a456-426614174001' };

  beforeEach(() => {
    jest.clearAllMocks();
    (ensureUserAndShop as jest.MockedFunction<any>).mockResolvedValue({
      user: mockUser,
      shop: mockShop,
    });
    (createClient as jest.MockedFunction<any>).mockResolvedValue(
      mockSupabaseClient
    );
  });

  it('should fetch first page of garments', async () => {
    const mockGarments = [
      {
        id: 'garment-1',
        name: 'Test Garment 1',
        stage: 'New',
        order_id: 'order-1',
        created_at: '2024-01-01T00:00:00Z',
        is_done: false,
        image_cloud_id: 'cloud-123',
        orders: {
          clients: {
            first_name: 'John',
            last_name: 'Doe',
          },
        },
        garment_services: [],
      },
      {
        id: 'garment-2',
        name: 'Test Garment 2',
        stage: 'In Progress',
        order_id: 'order-2',
        created_at: '2024-01-02T00:00:00Z',
        is_done: false,
        preset_icon_key: 'tops.blouse',
        orders: {
          clients: {
            first_name: 'Jane',
            last_name: 'Smith',
          },
        },
        garment_services: [{ id: 'service-1', name: 'Hemming', is_done: true }],
      },
    ];

    // Mock the chain to return data
    (mockSupabaseClient.limit as any).mockResolvedValue({
      data: mockGarments,
      error: null,
      count: 10,
    });

    const params: GetGarmentsPaginatedParams = {
      shopId: mockShop.id,
      sortField: 'created_at',
      sortOrder: 'desc',
      limit: 20,
      includeCancelled: false,
      onlyCancelled: false,
    };

    const result = await getGarmentsPaginated(params);

    expect(result.garments).toHaveLength(2);
    expect(result.garments[0]?.client_name).toBe('John Doe');
    expect(result.garments[0]?.hasCloudinaryImage).toBe(true);
    expect(result.garments[0]?.imageType).toBe('cloudinary');
    expect(result.garments[1]?.hasCloudinaryImage).toBe(false);
    expect(result.garments[1]?.imageType).toBe('svg-preset');
    expect(result.totalCount).toBe(10);
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeNull();

    // Verify Supabase query chain
    expect(mockSupabaseClient.from).toHaveBeenCalledWith('garments');
    expect(mockSupabaseClient.eq).toHaveBeenCalledWith('shop_id', mockShop.id);
    expect(mockSupabaseClient.order).toHaveBeenCalledWith('created_at', {
      ascending: false,
      nullsFirst: false,
    });
    expect(mockSupabaseClient.limit).toHaveBeenCalledWith(20);
  });

  it('should fetch page with cursor', async () => {
    const mockGarments = [
      {
        id: 'garment-3',
        name: 'Test Garment 3',
        stage: 'Ready For Pickup',
        order_id: 'order-3',
        created_at: '2024-01-03T00:00:00Z',
        is_done: false,
        orders: {
          clients: {
            first_name: 'Bob',
            last_name: 'Johnson',
          },
        },
        garment_services: [],
      },
    ];

    (mockSupabaseClient.limit as any).mockResolvedValue({
      data: mockGarments,
      error: null,
      count: 10,
    });

    const params: GetGarmentsPaginatedParams = {
      shopId: mockShop.id,
      sortField: 'created_at',
      sortOrder: 'desc',
      cursor: {
        lastId: '123e4567-e89b-12d3-a456-426614174002',
        lastCreatedAt: '2024-01-02T00:00:00Z',
      },
      limit: 20,
    };

    const result = await getGarmentsPaginated(params);

    expect(result.garments).toHaveLength(1);
    expect(result.totalCount).toBeUndefined(); // Not included for paginated requests
    // Note: cursor logic is more complex in the actual implementation
    // The test should focus on the overall behavior rather than specific implementation details
  });

  it('should apply stage filter', async () => {
    (mockSupabaseClient.limit as any).mockResolvedValue({
      data: [],
      error: null,
      count: 0,
    });

    const params: GetGarmentsPaginatedParams = {
      shopId: mockShop.id,
      sortField: 'created_at',
      sortOrder: 'desc',
      stage: 'In Progress',
      limit: 20,
    };

    await getGarmentsPaginated(params);

    expect(mockSupabaseClient.eq).toHaveBeenCalledWith('stage', 'In Progress');
  });

  it('should apply search filter', async () => {
    (mockSupabaseClient.limit as any).mockResolvedValue({
      data: [],
      error: null,
      count: 0,
    });

    const params: GetGarmentsPaginatedParams = {
      shopId: mockShop.id,
      sortField: 'created_at',
      sortOrder: 'desc',
      search: 'wedding dress',
      limit: 20,
    };

    await getGarmentsPaginated(params);

    expect(mockSupabaseClient.or).toHaveBeenCalledWith(
      'name.ilike.%wedding dress%,notes.ilike.%wedding dress%,client_first_name.ilike.%wedding dress%,client_last_name.ilike.%wedding dress%,client_full_name.ilike.%wedding dress%'
    );
  });

  it('should apply custom sorting', async () => {
    (mockSupabaseClient.limit as any).mockResolvedValue({
      data: [],
      error: null,
      count: 0,
    });

    const params: GetGarmentsPaginatedParams = {
      shopId: mockShop.id,
      sortField: 'due_date',
      sortOrder: 'asc',
      limit: 20,
    };

    await getGarmentsPaginated(params);

    expect(mockSupabaseClient.order).toHaveBeenCalledWith('due_date', {
      ascending: true,
      nullsFirst: false,
    });
  });

  it('should handle errors gracefully', async () => {
    const mockError = new Error('Database error');
    (mockSupabaseClient.limit as any).mockResolvedValue({
      data: null,
      error: mockError,
      count: null,
    });

    await expect(
      getGarmentsPaginated({
        shopId: mockShop.id,
        limit: 20,
        sortField: 'created_at',
        sortOrder: 'desc',
      })
    ).rejects.toThrow('Failed to fetch garments: Database error');
  });

  it('should indicate hasMore correctly', async () => {
    const mockGarments = Array(20)
      .fill(null)
      .map((_, i) => ({
        id: `garment-${i}`,
        name: `Test Garment ${i}`,
        stage: 'New',
        order_id: `order-${i}`,
        created_at: `2024-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
        is_done: false,
        orders: {
          clients: {
            first_name: 'Test',
            last_name: 'User',
          },
        },
        garment_services: [],
      }));

    (mockSupabaseClient.limit as any).mockResolvedValue({
      data: mockGarments,
      error: null,
      count: 50,
    });

    const result = await getGarmentsPaginated({
      shopId: mockShop.id,
      limit: 20,
      sortField: 'created_at',
      sortOrder: 'desc',
    });

    expect(result.hasMore).toBe(true);
    expect(result.nextCursor).toEqual({
      lastId: 'garment-19',
      lastCreatedAt: '2024-01-20T00:00:00Z',
    });
  });

  it('should include stage counts and total garments count on first page', async () => {
    const mockGarments = [
      {
        id: 'garment-1',
        name: 'Test Garment 1',
        stage: 'New',
        order_id: 'order-1',
        created_at: '2024-01-01T00:00:00Z',
        is_done: false,
        orders: {
          clients: {
            first_name: 'John',
            last_name: 'Doe',
          },
        },
        garment_services: [],
      },
    ];

    // Mock main query
    (mockSupabaseClient.limit as any).mockResolvedValue({
      data: mockGarments,
      error: null,
      count: 1, // This is the filtered count
    });

    // Mock stage count queries
    const stageCountMocks = {
      New: 5,
      'In Progress': 3,
      'Ready For Pickup': 2,
      Done: 10,
    };

    // Save original implementations
    const originalFrom = mockSupabaseClient.from;
    const originalSelect = mockSupabaseClient.select;
    const originalEq = mockSupabaseClient.eq;

    // Track which stage we're querying
    let currentStage: string | null = null;

    // Mock from to track when we're querying for stage counts
    (mockSupabaseClient.from as any).mockImplementation((table: string) => {
      currentStage = null; // Reset for each new query
      isStageCountQuery = false; // Reset stage count flag
      return mockSupabaseClient;
    });

    // Track if we're in a stage count query
    let isStageCountQuery = false;

    // Mock select to detect stage count queries
    (mockSupabaseClient.select as any).mockImplementation(
      (query: string, options?: any) => {
        if (options?.count === 'exact' && options?.head === true) {
          isStageCountQuery = true;
        }
        return mockSupabaseClient;
      }
    );

    // Mock eq to capture stage and prepare result
    (mockSupabaseClient.eq as any).mockImplementation(
      (field: string, value: any) => {
        if (
          isStageCountQuery &&
          field === 'stage' &&
          Object.keys(stageCountMocks).includes(value)
        ) {
          // Configure the final result for this stage count query
          const stageCount =
            stageCountMocks[value as keyof typeof stageCountMocks];
          // Return a mock chain that includes neq method
          return {
            neq: jest.fn(() =>
              Promise.resolve({
                count: stageCount,
                data: null,
                error: null,
              })
            ),
          };
        }
        // For other eq calls, return the client for chaining
        return mockSupabaseClient;
      }
    );

    const params: GetGarmentsPaginatedParams = {
      shopId: mockShop.id,
      sortField: 'created_at',
      sortOrder: 'desc',
      limit: 20,
      stage: 'New', // Filter by stage to show totalCount != totalGarmentsCount
    };

    const result = await getGarmentsPaginated(params);

    expect(result.totalCount).toBe(1); // Filtered count
    expect(result.stageCounts).toEqual(stageCountMocks);
    expect(result.totalGarmentsCount).toBe(20); // Sum of all stage counts

    // Restore mocks
    mockSupabaseClient.from = originalFrom;
    mockSupabaseClient.select = originalSelect;
    mockSupabaseClient.eq = originalEq;
  });

  it('should calculate totalGarmentsCount correctly as sum of stage counts', async () => {
    const mockGarments: any[] = [];

    // Mock main query
    (mockSupabaseClient.limit as any).mockResolvedValue({
      data: mockGarments,
      error: null,
      count: 0,
    });

    // Mock stage count queries with specific values
    const expectedStageCounts = {
      New: 15,
      'In Progress': 25,
      'Ready For Pickup': 10,
      Done: 30,
    };

    // Save original implementations
    const originalEq = mockSupabaseClient.eq;
    const originalFrom = mockSupabaseClient.from;
    const originalSelect = mockSupabaseClient.select;

    // Track if we're in a stage count query
    let isStageCountQuery = false;

    // Mock from to reset state
    (mockSupabaseClient.from as any).mockImplementation((table: string) => {
      isStageCountQuery = false;
      return mockSupabaseClient;
    });

    // Mock select to detect stage count queries
    (mockSupabaseClient.select as any).mockImplementation(
      (query: string, options?: any) => {
        if (options?.count === 'exact' && options?.head === true) {
          isStageCountQuery = true;
        }
        return mockSupabaseClient;
      }
    );

    // Mock stage count responses
    (mockSupabaseClient.eq as any).mockImplementation(
      (field: string, value: any) => {
        if (
          isStageCountQuery &&
          field === 'stage' &&
          Object.keys(expectedStageCounts).includes(value)
        ) {
          const stageCount =
            expectedStageCounts[value as keyof typeof expectedStageCounts];
          // Return a mock chain that includes neq method
          return {
            neq: jest.fn(() =>
              Promise.resolve({
                count: stageCount,
                data: null,
                error: null,
              })
            ),
          };
        }
        return mockSupabaseClient;
      }
    );

    const result = await getGarmentsPaginated({
      shopId: mockShop.id,
      limit: 20,
      sortField: 'created_at',
      sortOrder: 'desc',
    });

    const expectedTotal = Object.values(expectedStageCounts).reduce(
      (sum, count) => sum + count,
      0
    );
    expect(result.totalGarmentsCount).toBe(expectedTotal); // Should be 80

    // Restore mocks
    mockSupabaseClient.eq = originalEq;
    mockSupabaseClient.from = originalFrom;
    mockSupabaseClient.select = originalSelect;
  });

  it('should not include stage counts or totalGarmentsCount on subsequent pages', async () => {
    const mockGarments: any[] = [];

    (mockSupabaseClient.limit as any).mockResolvedValue({
      data: mockGarments,
      error: null,
      count: 0,
    });

    const params: GetGarmentsPaginatedParams = {
      shopId: mockShop.id,
      sortField: 'created_at',
      sortOrder: 'desc',
      cursor: {
        lastId: '123e4567-e89b-12d3-a456-426614174002',
        lastCreatedAt: '2024-01-02T00:00:00Z',
      },
      limit: 20,
    };

    const result = await getGarmentsPaginated(params);

    expect(result.stageCounts).toBeUndefined();
    expect(result.totalGarmentsCount).toBeUndefined();
  });
});
