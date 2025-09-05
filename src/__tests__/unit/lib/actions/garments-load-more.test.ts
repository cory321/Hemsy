import { loadMoreGarments } from '@/lib/actions/garments-load-more';
import { getGarmentsPaginated } from '@/lib/actions/garments-paginated';

// Mock the dependencies
jest.mock('@/lib/actions/garments-paginated');

describe('loadMoreGarments', () => {
  const mockGetGarmentsPaginated = getGarmentsPaginated as jest.MockedFunction<
    typeof getGarmentsPaginated
  >;

  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console logs during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should call getGarmentsPaginated with correct parameters', async () => {
    const mockCursor = {
      lastId: '123',
      lastCreatedAt: '2024-01-01T00:00:00Z',
      lastClientName: 'John Doe',
    };

    const mockResult = {
      garments: [],
      hasMore: false,
      nextCursor: null,
    };

    mockGetGarmentsPaginated.mockResolvedValue(mockResult);

    const params = {
      shopId: 'shop-123',
      cursor: mockCursor,
      stage: 'New' as const,
      search: 'dress',
      filter: 'overdue' as const,
      sortField: 'created_at' as const,
      sortOrder: 'desc' as const,
    };

    const result = await loadMoreGarments(params);

    expect(mockGetGarmentsPaginated).toHaveBeenCalledWith({
      shopId: 'shop-123',
      cursor: mockCursor,
      stage: 'New',
      search: 'dress',
      filter: 'overdue',
      sortField: 'created_at',
      sortOrder: 'desc',
      limit: 20,
    });

    expect(result).toEqual(mockResult);
  });

  it('should handle errors from getGarmentsPaginated', async () => {
    const mockError = new Error('Database error');
    mockGetGarmentsPaginated.mockRejectedValue(mockError);

    const params = {
      shopId: 'shop-123',
      cursor: {
        lastId: '123',
        lastCreatedAt: '2024-01-01T00:00:00Z',
      },
      sortField: 'created_at' as const,
      sortOrder: 'desc' as const,
    };

    // The function should propagate errors to the caller
    await expect(loadMoreGarments(params)).rejects.toThrow('Database error');
    // Error logging is now handled by the caller, not by loadMoreGarments itself
  });

  it('should work without optional parameters', async () => {
    const mockResult = {
      garments: [],
      hasMore: true,
      nextCursor: {
        lastId: '456',
        lastCreatedAt: '2024-01-02T00:00:00Z',
      },
    };

    mockGetGarmentsPaginated.mockResolvedValue(mockResult);

    const params = {
      shopId: 'shop-123',
      cursor: {
        lastId: '123',
        lastCreatedAt: '2024-01-01T00:00:00Z',
      },
      sortField: 'due_date' as const,
      sortOrder: 'asc' as const,
    };

    const result = await loadMoreGarments(params);

    expect(mockGetGarmentsPaginated).toHaveBeenCalledWith({
      shopId: 'shop-123',
      cursor: {
        lastId: '123',
        lastCreatedAt: '2024-01-01T00:00:00Z',
      },
      sortField: 'due_date',
      sortOrder: 'asc',
      limit: 20,
    });

    expect(result).toEqual(mockResult);
  });
});
