import {
  getDashboardStats,
  getTodayAppointments,
  getGarmentsDueToday,
} from '@/lib/actions/dashboard';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import { ensureUserAndShop } from '@/lib/auth/user-shop';
import { format } from 'date-fns';

// Mock dependencies
jest.mock('@/lib/supabase/server');
jest.mock('@clerk/nextjs/server');
jest.mock('@/lib/auth/user-shop');

const mockCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>;
const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockEnsureUserAndShop = ensureUserAndShop as jest.MockedFunction<
  typeof ensureUserAndShop
>;

describe('Dashboard Actions', () => {
  const mockUserId = 'user_123';
  const mockShopId = 'shop_123';
  const today = format(new Date(), 'yyyy-MM-dd');

  const mockSupabase = {
    from: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: mockUserId } as any);
    mockCreateClient.mockResolvedValue(mockSupabase as any);
    mockEnsureUserAndShop.mockResolvedValue({
      user: { id: 'db_user_123', clerk_user_id: mockUserId } as any,
      shop: { id: mockShopId } as any,
    });
  });

  describe('getTodayAppointments', () => {
    it("should return count of today's pending and confirmed appointments", async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockIn = jest.fn().mockResolvedValue({ count: 5, error: null });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        in: mockIn,
      } as any);

      const result = await getTodayAppointments();

      expect(mockSupabase.from).toHaveBeenCalledWith('appointments');
      expect(mockSelect).toHaveBeenCalledWith('*', {
        count: 'exact',
        head: true,
      });
      expect(mockEq).toHaveBeenCalledWith('shop_id', mockShopId);
      expect(mockEq).toHaveBeenCalledWith('date', today);
      expect(mockIn).toHaveBeenCalledWith('status', ['pending', 'confirmed']);
      expect(result).toBe(5);
    });

    it('should return 0 when no appointments exist', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockIn = jest.fn().mockResolvedValue({ count: null, error: null });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        in: mockIn,
      } as any);

      const result = await getTodayAppointments();

      expect(result).toBe(0);
    });

    it('should throw error when unauthorized', async () => {
      mockAuth.mockResolvedValue({ userId: null } as any);

      await expect(getTodayAppointments()).rejects.toThrow('Unauthorized');
    });
  });

  describe('getGarmentsDueToday', () => {
    it('should return count of garments due today excluding Done and Ready For Pickup', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockNeq = jest.fn();

      // First neq returns 'this' for chaining, second neq resolves the promise
      mockNeq
        .mockReturnValueOnce({
          select: mockSelect,
          eq: mockEq,
          neq: jest.fn().mockResolvedValue({ count: 3, error: null }),
        })
        .mockResolvedValueOnce({ count: 3, error: null });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        neq: mockNeq,
      } as any);

      const result = await getGarmentsDueToday();

      expect(mockSupabase.from).toHaveBeenCalledWith('garments');
      expect(mockSelect).toHaveBeenCalledWith('*', {
        count: 'exact',
        head: true,
      });
      expect(mockEq).toHaveBeenCalledWith('shop_id', mockShopId);
      expect(mockEq).toHaveBeenCalledWith('due_date', today);
      expect(mockNeq).toHaveBeenCalledWith('stage', 'Done');
      expect(result).toBe(3);
    });

    it('should return 0 when no garments are due', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockNeq = jest.fn();

      // First neq returns 'this' for chaining, second neq resolves the promise
      mockNeq
        .mockReturnValueOnce({
          select: mockSelect,
          eq: mockEq,
          neq: jest.fn().mockResolvedValue({ count: null, error: null }),
        })
        .mockResolvedValueOnce({ count: null, error: null });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        neq: mockNeq,
      } as any);

      const result = await getGarmentsDueToday();

      expect(result).toBe(0);
    });
  });

  describe('getDashboardStats', () => {
    it('should return both appointments and garments due today', async () => {
      // Mock appointments query
      const appointmentsQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({ count: 4, error: null }),
      };

      // Mock garments query
      const mockNeq = jest.fn();
      mockNeq.mockReturnValueOnce({
        neq: jest.fn().mockResolvedValue({ count: 6, error: null }),
      });

      const garmentsQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: mockNeq,
      };

      mockSupabase.from
        .mockReturnValueOnce(appointmentsQuery as any)
        .mockReturnValueOnce(garmentsQuery as any);

      const result = await getDashboardStats();

      expect(result).toEqual({
        appointmentsToday: 4,
        garmentsDueToday: 6,
      });
    });

    it('should handle errors in parallel queries', async () => {
      // Mock appointments query with error
      const appointmentsQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest
          .fn()
          .mockResolvedValue({ count: null, error: new Error('DB error') }),
      };

      // Mock garments query (needed for parallel execution)
      const mockNeq = jest.fn();
      mockNeq.mockReturnValueOnce({
        neq: jest.fn().mockResolvedValue({ count: 0, error: null }),
      });

      const garmentsQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: mockNeq,
      };

      mockSupabase.from
        .mockReturnValueOnce(appointmentsQuery as any)
        .mockReturnValueOnce(garmentsQuery as any);

      await expect(getDashboardStats()).rejects.toThrow(
        'Failed to fetch appointments'
      );
    });
  });
});
