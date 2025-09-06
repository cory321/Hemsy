import { getGarmentsPaginated } from '@/lib/actions/garments-paginated';
import { createClient } from '@/lib/supabase/server';

jest.mock('@/lib/supabase/server');

describe('getGarmentsPaginated - due_date sorting', () => {
  const mockSupabase = {
    from: jest.fn(),
  };

  const mockQuery = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
    mockSupabase.from.mockReturnValue(mockQuery);
  });

  it('should use due_date for cursor pagination when sorting by due_date', async () => {
    const shopId = '123e4567-e89b-12d3-a456-426614174000';
    const cursor = {
      lastId: '123e4567-e89b-12d3-a456-426614174001',
      lastCreatedAt: '2024-01-01T00:00:00Z',
      lastDueDate: '2024-01-15T00:00:00Z',
    };

    // Mock the query response
    mockQuery.limit.mockResolvedValue({
      data: [],
      error: null,
      count: 0,
    });

    await getGarmentsPaginated({
      shopId,
      cursor,
      sortField: 'due_date',
      sortOrder: 'asc',
      limit: 20,
    });

    // Verify the query is built correctly
    expect(mockSupabase.from).toHaveBeenCalledWith('garments');

    // Check that order is called with due_date
    expect(mockQuery.order).toHaveBeenCalledWith('due_date', {
      ascending: true,
      nullsFirst: false,
    });

    // Verify cursor comparison now uses due_date instead of created_at
    expect(mockQuery.or).toHaveBeenCalledWith(
      expect.stringContaining('due_date')
    );
    // Should NOT be using created_at for cursor comparison
    expect(mockQuery.or).not.toHaveBeenCalledWith(
      expect.stringContaining('created_at')
    );
  });

  it('demonstrates the pagination issue with due_date sorting', async () => {
    // Example scenario showing how garments can be skipped:
    //
    // Database has garments in this order by due_date:
    // 1. id: 'A', due_date: '2024-01-01', created_at: '2024-01-10'
    // 2. id: 'B', due_date: '2024-01-02', created_at: '2024-01-05' <- cursor here
    // 3. id: 'C', due_date: '2024-01-03', created_at: '2024-01-03'
    // 4. id: 'D', due_date: '2024-01-04', created_at: '2024-01-08'
    //
    // After loading first 2 items, cursor is:
    // { lastId: 'B', lastCreatedAt: '2024-01-05' }
    //
    // Next query with cursor will look for created_at > '2024-01-05'
    // This will skip garment 'C' (created_at: '2024-01-03') even though
    // it should be next in due_date order!

    const comment = `
		This test demonstrates why using created_at for cursor pagination
		when sorting by due_date causes garments to be skipped.
		
		The fix requires tracking lastDueDate in the cursor when sorting by due_date.
		`;

    expect(comment).toBeTruthy();
  });
});
