import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getShopBusinessInfo,
  updateShopBusinessInfo,
} from '@/lib/actions/shops';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

// Mock dependencies
vi.mock('@clerk/nextjs/server');
vi.mock('@/lib/supabase/server');
vi.mock('@/lib/actions/users', () => ({
  ensureUserAndShop: vi.fn(),
}));

describe('Shop Actions', () => {
  const mockAuth = vi.mocked(auth);
  const mockCreateClient = vi.mocked(createClient);
  const mockSupabase = {
    from: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateClient.mockResolvedValue(mockSupabase as any);
  });

  describe('getShopBusinessInfo', () => {
    it('should return shop business information successfully', async () => {
      const mockShop = {
        id: 'shop-123',
        name: 'Test Shop',
        business_name: 'Test Business',
        email: 'test@example.com',
        phone_number: '123-456-7890',
        mailing_address: '123 Main St',
        location_type: 'shop_location',
        payment_preference: 'after_service',
        trial_countdown_enabled: false,
      };

      const { ensureUserAndShop } = await import('@/lib/actions/users');
      vi.mocked(ensureUserAndShop).mockResolvedValue({
        user: { id: 'user-123' } as any,
        shop: mockShop as any,
      });

      const result = await getShopBusinessInfo();

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        id: 'shop-123',
        name: 'Test Shop',
        business_name: 'Test Business',
        email: 'test@example.com',
        phone_number: '123-456-7890',
        mailing_address: '123 Main St',
        location_type: 'shop_location',
        payment_preference: 'after_service',
        trial_countdown_enabled: false,
        trial_end_date: undefined,
      });
    });

    it('should use default values for missing fields', async () => {
      const mockShop = {
        id: 'shop-123',
        name: 'Test Shop',
        trial_countdown_enabled: null,
      };

      const { ensureUserAndShop } = await import('@/lib/actions/users');
      vi.mocked(ensureUserAndShop).mockResolvedValue({
        user: { id: 'user-123' } as any,
        shop: mockShop as any,
      });

      const result = await getShopBusinessInfo();

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        business_name: 'Test Shop', // Falls back to name
        email: '',
        phone_number: '',
        mailing_address: '',
        location_type: 'shop_location',
        payment_preference: 'after_service',
        trial_countdown_enabled: false,
      });
    });

    it('should handle errors gracefully', async () => {
      const { ensureUserAndShop } = await import('@/lib/actions/users');
      vi.mocked(ensureUserAndShop).mockRejectedValue(new Error('Unauthorized'));

      const result = await getShopBusinessInfo();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to load business information');
    });
  });

  describe('updateShopBusinessInfo', () => {
    it('should update shop business information successfully', async () => {
      const mockShop = { id: 'shop-123' };
      const updateData = {
        business_name: 'Updated Business',
        email: 'updated@example.com',
        phone_number: '098-765-4321',
        mailing_address: '456 Oak St',
        location_type: 'home_based' as const,
        payment_preference: 'upfront' as const,
      };

      const { ensureUserAndShop } = await import('@/lib/actions/users');
      vi.mocked(ensureUserAndShop).mockResolvedValue({
        user: { id: 'user-123' } as any,
        shop: mockShop as any,
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
      } as any);

      const result = await updateShopBusinessInfo(updateData);

      expect(result.success).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('shops');
      expect(mockUpdate).toHaveBeenCalledWith({
        ...updateData,
        updated_at: expect.any(String),
      });
    });

    it('should validate input data', async () => {
      const invalidData = {
        business_name: '', // Invalid - empty string
        email: 'invalid-email', // Invalid email
        phone_number: '',
      } as any;

      const result = await updateShopBusinessInfo(invalidData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should handle database errors', async () => {
      const mockShop = { id: 'shop-123' };
      const updateData = {
        business_name: 'Updated Business',
        email: 'updated@example.com',
        phone_number: '098-765-4321',
      };

      const { ensureUserAndShop } = await import('@/lib/actions/users');
      vi.mocked(ensureUserAndShop).mockResolvedValue({
        user: { id: 'user-123' } as any,
        shop: mockShop as any,
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          error: { message: 'Database error' },
        }),
      });

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
      } as any);

      const result = await updateShopBusinessInfo(updateData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to update business information');
    });
  });
});
