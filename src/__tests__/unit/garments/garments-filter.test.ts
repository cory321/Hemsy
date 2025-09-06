import { getGarmentsPaginated } from '@/lib/actions/garments-paginated';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

// Mock getTodayString to return consistent date
jest.mock('@/lib/utils/date-time-utils', () => ({
  getTodayString: jest.fn(() => '2024-03-15'),
}));

describe('Garments Filter - Due Today and Overdue', () => {
  const mockSupabase = {
    from: jest.fn(),
  };

  const mockQuery = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
    mockSupabase.from.mockReturnValue(mockQuery);

    // Mock the final query result
    mockQuery.limit.mockResolvedValue({
      data: [],
      error: null,
      count: 0,
    });
  });

  describe('Due Today Filter', () => {
    it('should filter garments due today', async () => {
      const todayStr = '2024-03-15'; // Use mocked date

      await getGarmentsPaginated({
        shopId: '00000000-0000-0000-0000-000000000000',
        filter: 'due-today',
        sortField: 'created_at',
        sortOrder: 'desc',
        limit: 20,
      });

      // Verify the due_date filter was applied correctly
      expect(mockQuery.eq).toHaveBeenCalledWith(
        'shop_id',
        '00000000-0000-0000-0000-000000000000'
      );
      expect(mockQuery.eq).toHaveBeenCalledWith('due_date', todayStr);
    });

    it('should combine due today filter with stage filter', async () => {
      const todayStr = '2024-03-15'; // Use mocked date

      await getGarmentsPaginated({
        shopId: '00000000-0000-0000-0000-000000000000',
        filter: 'due-today',
        stage: 'In Progress',
        sortField: 'created_at',
        sortOrder: 'desc',
        limit: 20,
      });

      // Verify both filters were applied
      expect(mockQuery.eq).toHaveBeenCalledWith(
        'shop_id',
        '00000000-0000-0000-0000-000000000000'
      );
      expect(mockQuery.eq).toHaveBeenCalledWith('stage', 'In Progress');
      expect(mockQuery.eq).toHaveBeenCalledWith('due_date', todayStr);
    });
  });

  describe('Overdue Filter', () => {
    it('should filter overdue garments excluding Done and Ready For Pickup stages', async () => {
      const todayStr = '2024-03-15'; // Use mocked date

      await getGarmentsPaginated({
        shopId: '00000000-0000-0000-0000-000000000000',
        filter: 'overdue',
        sortField: 'created_at',
        sortOrder: 'desc',
        limit: 20,
      });

      // Verify the due_date filter was applied correctly for overdue items
      expect(mockQuery.eq).toHaveBeenCalledWith(
        'shop_id',
        '00000000-0000-0000-0000-000000000000'
      );
      expect(mockQuery.lt).toHaveBeenCalledWith('due_date', todayStr);
      // Verify that Done and Ready For Pickup stages are excluded
      expect(mockQuery.not).toHaveBeenCalledWith(
        'stage',
        'in',
        '("Done","Ready For Pickup")'
      );
    });

    it('should work with search queries', async () => {
      const todayStr = '2024-03-15'; // Use mocked date

      // Set up the view query
      const viewQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(viewQuery);
      viewQuery.limit.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      await getGarmentsPaginated({
        shopId: '00000000-0000-0000-0000-000000000000',
        filter: 'overdue',
        search: 'wedding',
        sortField: 'created_at',
        sortOrder: 'desc',
        limit: 20,
      });

      // Verify the view was used for search
      expect(mockSupabase.from).toHaveBeenCalledWith('garments_with_clients');
      expect(viewQuery.lt).toHaveBeenCalledWith('due_date', todayStr);
      expect(viewQuery.not).toHaveBeenCalledWith(
        'stage',
        'in',
        '("Done","Ready For Pickup")'
      );
      expect(viewQuery.or).toHaveBeenCalledWith(
        expect.stringContaining('wedding')
      );
    });
  });

  describe('Filter with Pagination', () => {
    it('should maintain filter when paginating', async () => {
      const todayStr = '2024-03-15'; // Use mocked date

      const cursor = {
        lastId: '11111111-1111-1111-1111-111111111111',
        lastCreatedAt: '2024-01-01T00:00:00Z',
      };

      await getGarmentsPaginated({
        shopId: '00000000-0000-0000-0000-000000000000',
        filter: 'due-today',
        cursor,
        sortField: 'created_at',
        sortOrder: 'desc',
        limit: 20,
      });

      // Verify filter is maintained with cursor
      expect(mockQuery.eq).toHaveBeenCalledWith('due_date', todayStr);
      expect(mockQuery.or).toHaveBeenCalledWith(
        expect.stringContaining('created_at')
      );
    });
  });

  describe('Filter with Sorting', () => {
    it('should work with due_date sorting and overdue filter', async () => {
      const todayStr = '2024-03-15'; // Use mocked date

      await getGarmentsPaginated({
        shopId: '00000000-0000-0000-0000-000000000000',
        filter: 'overdue',
        sortField: 'due_date',
        sortOrder: 'asc',
        limit: 20,
      });

      // Verify filter and sort order
      expect(mockQuery.lt).toHaveBeenCalledWith('due_date', todayStr);
      expect(mockQuery.not).toHaveBeenCalledWith(
        'stage',
        'in',
        '("Done","Ready For Pickup")'
      );
      expect(mockQuery.order).toHaveBeenCalledWith('due_date', {
        ascending: true,
        nullsFirst: false,
      });
    });

    it('should work with client_name sorting', async () => {
      const todayStr = '2024-03-15'; // Use mocked date

      // Set up the view query for client name sorting
      const viewQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(viewQuery);
      viewQuery.limit.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      await getGarmentsPaginated({
        shopId: '00000000-0000-0000-0000-000000000000',
        filter: 'overdue',
        sortField: 'client_name',
        sortOrder: 'asc',
        limit: 20,
      });

      // Verify the view was used and filter was applied
      expect(mockSupabase.from).toHaveBeenCalledWith('garments_with_clients');
      expect(viewQuery.lt).toHaveBeenCalledWith('due_date', todayStr);
      expect(viewQuery.not).toHaveBeenCalledWith(
        'stage',
        'in',
        '("Done","Ready For Pickup")'
      );
      expect(viewQuery.order).toHaveBeenCalledWith('client_full_name', {
        ascending: true,
        nullsFirst: false,
      });
    });
  });
});
