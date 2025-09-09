import {
  getActiveGarments,
  getReadyForPickupGarments,
} from '@/lib/actions/dashboard';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
  currentUser: jest.fn().mockResolvedValue({
    id: 'user-123',
    firstName: 'Test',
    lastName: 'User',
    emailAddresses: [{ emailAddress: 'test@example.com' }],
  }),
}));

jest.mock('@/lib/auth/user-shop', () => ({
  ensureUserAndShop: jest.fn().mockResolvedValue({
    user: { id: 'user-123' },
    shop: { id: 'shop-123' },
  }),
}));

// Mock date utils
jest.mock('@/lib/utils/date-time-utils', () => ({
  getDueDateInfo: jest.fn((date) => {
    if (!date) return null;
    const today = new Date('2024-01-15');
    const dueDate = new Date(date);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      isOverdue: diffDays < 0,
      isToday: diffDays === 0,
      isTomorrow: diffDays === 1,
      daysUntilDue: diffDays,
    };
  }),
  isGarmentOverdue: jest.fn((garment) => {
    if (!garment.due_date) return false;
    const dueDate = new Date(garment.due_date);
    const today = new Date('2024-01-15');
    return dueDate < today;
  }),
}));

jest.mock('@/lib/utils/garment-priority', () => ({
  compareGarmentsByStageAndProgress: jest.fn(() => 0),
}));

describe('Dashboard - Active Garments Filtering', () => {
  const mockSupabase = {
    from: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
    (auth as unknown as jest.Mock).mockResolvedValue({ userId: 'user-123' });
  });

  describe('getActiveGarments', () => {
    it('should exclude garments from canceled orders', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [
            {
              id: '1',
              name: 'Active Garment',
              stage: 'In Progress',
              order_id: 'order-1',
              due_date: '2024-01-20',
              garment_services: [
                {
                  id: 's1',
                  name: 'Hemming',
                  is_done: false,
                  is_removed: false,
                },
              ],
              orders: {
                status: 'in_progress',
                clients: {
                  first_name: 'John',
                  last_name: 'Doe',
                },
              },
            },
          ],
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await getActiveGarments();

      // Verify the query structure
      expect(mockSupabase.from).toHaveBeenCalledWith('garments');

      // Verify that the select includes the necessary joins
      expect(mockQuery.select).toHaveBeenCalledWith(
        expect.stringContaining('orders!inner')
      );

      // Verify that garments in Done or Ready For Pickup stages are excluded
      expect(mockQuery.not).toHaveBeenCalledWith(
        'stage',
        'in',
        '("Done","Ready For Pickup")'
      );

      // IMPORTANT: Verify that canceled orders are excluded
      expect(mockQuery.neq).toHaveBeenCalledWith('orders.status', 'cancelled');

      // Verify the result
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: '1',
        name: 'Active Garment',
        stage: 'In Progress',
        client_name: 'John D.',
        progress: 0,
      });
    });

    it('should not return garments with canceled orders even if they are in active stages', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [], // Empty result since canceled orders should be filtered out
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await getActiveGarments();

      // Verify that the neq filter was applied
      expect(mockQuery.neq).toHaveBeenCalledWith('orders.status', 'cancelled');

      // Result should be empty
      expect(result).toHaveLength(0);
    });

    it('should handle garments without orders gracefully', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [
            {
              id: '2',
              name: 'Orphan Garment',
              stage: 'New',
              order_id: 'order-2',
              due_date: null,
              garment_services: [],
              orders: null, // No order found (shouldn't happen but handling edge case)
            },
          ],
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await getActiveGarments();

      // Should handle null orders gracefully
      expect(result[0]?.client_name).toBe('Unknown Client');
    });

    it('should prioritize overdue garments from non-canceled orders', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [
            {
              id: '1',
              name: 'Overdue Garment',
              stage: 'In Progress',
              order_id: 'order-1',
              due_date: '2024-01-10', // 5 days overdue
              garment_services: [],
              orders: {
                status: 'in_progress',
                clients: { first_name: 'Jane', last_name: 'Smith' },
              },
            },
            {
              id: '2',
              name: 'Due Today Garment',
              stage: 'New',
              order_id: 'order-2',
              due_date: '2024-01-15', // Today
              garment_services: [],
              orders: {
                status: 'in_progress',
                clients: { first_name: 'Bob', last_name: 'Johnson' },
              },
            },
          ],
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await getActiveGarments();

      // Verify that canceled orders are excluded in the query
      expect(mockQuery.neq).toHaveBeenCalledWith('orders.status', 'cancelled');

      // Result should maintain priority order (overdue first)
      expect(result[0]?.name).toBe('Overdue Garment');
      expect(result[1]?.name).toBe('Due Today Garment');
    });
  });

  describe('getReadyForPickupGarments', () => {
    it('should exclude garments from canceled orders', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [
            {
              id: '1',
              name: 'Ready Garment',
              stage: 'Ready For Pickup',
              order_id: 'order-1',
              due_date: '2024-01-10',
              created_at: '2024-01-05',
              garment_services: [
                { id: 's1', name: 'Hemming', is_done: true, is_removed: false },
              ],
              orders: {
                status: 'ready_for_pickup',
                clients: {
                  first_name: 'Alice',
                  last_name: 'Brown',
                },
              },
            },
          ],
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await getReadyForPickupGarments();

      // Verify the query structure
      expect(mockSupabase.from).toHaveBeenCalledWith('garments');

      // Verify that only 'Ready For Pickup' stage garments are selected
      expect(mockQuery.eq).toHaveBeenCalledWith('stage', 'Ready For Pickup');

      // IMPORTANT: Verify that canceled orders are excluded
      expect(mockQuery.neq).toHaveBeenCalledWith('orders.status', 'cancelled');

      // Verify the result
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: '1',
        name: 'Ready Garment',
        stage: 'Ready For Pickup',
        client_name: 'Alice B.',
        progress: 100,
      });
    });

    it('should not return ready for pickup garments with canceled orders', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [], // Empty result since canceled orders should be filtered out
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await getReadyForPickupGarments();

      // Verify that the neq filter was applied
      expect(mockQuery.neq).toHaveBeenCalledWith('orders.status', 'cancelled');

      // Result should be empty
      expect(result).toHaveLength(0);
    });

    it('should return at most 5 ready for pickup garments from non-canceled orders', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [
            {
              id: '1',
              name: 'Garment 1',
              stage: 'Ready For Pickup',
              order_id: 'order-1',
              created_at: '2024-01-05',
              garment_services: [],
              orders: {
                status: 'ready_for_pickup',
                clients: { first_name: 'Client', last_name: 'One' },
              },
            },
            {
              id: '2',
              name: 'Garment 2',
              stage: 'Ready For Pickup',
              order_id: 'order-2',
              created_at: '2024-01-04',
              garment_services: [],
              orders: {
                status: 'ready_for_pickup',
                clients: { first_name: 'Client', last_name: 'Two' },
              },
            },
            {
              id: '3',
              name: 'Garment 3',
              stage: 'Ready For Pickup',
              order_id: 'order-3',
              created_at: '2024-01-03',
              garment_services: [],
              orders: {
                status: 'ready_for_pickup',
                clients: { first_name: 'Client', last_name: 'Three' },
              },
            },
          ],
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await getReadyForPickupGarments();

      // Verify that limit is set to 5
      expect(mockQuery.limit).toHaveBeenCalledWith(5);

      // Verify that canceled orders are excluded
      expect(mockQuery.neq).toHaveBeenCalledWith('orders.status', 'cancelled');

      // Result should have at most 5 items
      expect(result).toHaveLength(3);
    });
  });
});
