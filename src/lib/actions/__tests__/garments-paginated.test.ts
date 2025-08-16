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

const mockSupabaseClient = {
  from: jest.fn(() => mockSupabaseClient),
  select: jest.fn(() => mockSupabaseClient),
  eq: jest.fn(() => mockSupabaseClient),
  lt: jest.fn(() => mockSupabaseClient),
  gt: jest.fn(() => mockSupabaseClient),
  or: jest.fn(() => mockSupabaseClient),
  order: jest.fn(() => mockSupabaseClient),
  limit: jest.fn(() => mockSupabaseClient),
};

describe('getGarmentsPaginated', () => {
  const mockShop = { id: 'shop-123' };
  const mockUser = { id: 'user-123' };

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
      limit: 20,
    };

    const result = await getGarmentsPaginated(params);

    expect(result.garments).toHaveLength(2);
    expect(result.garments[0].client_name).toBe('John Doe');
    expect(result.garments[0].hasCloudinaryImage).toBe(true);
    expect(result.garments[0].imageType).toBe('cloudinary');
    expect(result.garments[1].hasCloudinaryImage).toBe(false);
    expect(result.garments[1].imageType).toBe('svg-preset');
    expect(result.totalCount).toBe(10);
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeNull();

    // Verify Supabase query chain
    expect(mockSupabaseClient.from).toHaveBeenCalledWith('garments');
    expect(mockSupabaseClient.eq).toHaveBeenCalledWith('shop_id', mockShop.id);
    expect(mockSupabaseClient.order).toHaveBeenCalledWith('created_at', {
      ascending: false,
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
      cursor: {
        lastId: 'garment-2',
        lastCreatedAt: '2024-01-02T00:00:00Z',
      },
      limit: 20,
    };

    const result = await getGarmentsPaginated(params);

    expect(result.garments).toHaveLength(1);
    expect(result.totalCount).toBeUndefined(); // Not included for paginated requests
    expect(mockSupabaseClient.lt).toHaveBeenCalledWith(
      'created_at',
      '2024-01-02T00:00:00Z'
    );
  });

  it('should apply stage filter', async () => {
    (mockSupabaseClient.limit as any).mockResolvedValue({
      data: [],
      error: null,
      count: 0,
    });

    const params: GetGarmentsPaginatedParams = {
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
      search: 'wedding dress',
      limit: 20,
    };

    await getGarmentsPaginated(params);

    expect(mockSupabaseClient.or).toHaveBeenCalledWith(
      'name.ilike.%wedding dress%,notes.ilike.%wedding dress%'
    );
  });

  it('should apply custom sorting', async () => {
    (mockSupabaseClient.limit as any).mockResolvedValue({
      data: [],
      error: null,
      count: 0,
    });

    const params: GetGarmentsPaginatedParams = {
      sortField: 'due_date',
      sortOrder: 'asc',
      limit: 20,
    };

    await getGarmentsPaginated(params);

    expect(mockSupabaseClient.order).toHaveBeenCalledWith('due_date', {
      ascending: true,
    });
  });

  it('should handle errors gracefully', async () => {
    const mockError = new Error('Database error');
    (mockSupabaseClient.limit as any).mockResolvedValue({
      data: null,
      error: mockError,
      count: null,
    });

    await expect(getGarmentsPaginated({})).rejects.toThrow(
      'Failed to fetch garments: Database error'
    );
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

    const result = await getGarmentsPaginated({ limit: 20 });

    expect(result.hasMore).toBe(true);
    expect(result.nextCursor).toEqual({
      lastId: 'garment-19',
      lastCreatedAt: '2024-01-20T00:00:00Z',
    });
  });
});
