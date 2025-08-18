import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  getShopBusinessInfo,
  updateShopBusinessInfo,
} from '@/lib/actions/shops';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { createMockUser, createMockShop } from '@/lib/testing/mock-factories';

// Mock dependencies
jest.mock('@clerk/nextjs/server');
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/auth/user-shop', () => ({
  ensureUserAndShop: jest.fn(),
}));

// Import after mocking
const { ensureUserAndShop } = require('@/lib/auth/user-shop');
const mockEnsureUserAndShop = ensureUserAndShop as jest.MockedFunction<any>;

describe('Shop Actions', () => {
  const mockAuth = auth as unknown as jest.MockedFunction<typeof auth>;
  const mockCreateClient = createClient as unknown as jest.MockedFunction<
    typeof createClient
  >;
  const mockSupabase: any = {
    from: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateClient.mockResolvedValue(mockSupabase);
  });

  describe('getShopBusinessInfo', () => {
    it('should return shop business information successfully', async () => {
      const mockUser = createMockUser({ id: 'user-123' });
      const mockShop = createMockShop({
        id: 'shop-123',
        name: 'Test Shop',
        business_name: 'Test Business',
        email: 'test@example.com',
        phone_number: '123-456-7890',
        mailing_address: '123 Main St',
        location_type: 'shop_location',
        payment_preference: 'after_service',
        trial_countdown_enabled: false,
      });

      mockEnsureUserAndShop.mockResolvedValue({
        user: mockUser,
        shop: mockShop,
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
        trial_end_date: null,
      });
    });

    it('should use default values for missing fields', async () => {
      const mockUser = createMockUser({ id: 'user-123' });
      const mockShop = createMockShop({
        id: 'shop-123',
        name: 'Test Shop',
        trial_countdown_enabled: null,
        business_name: null,
        email: null,
        phone_number: null,
        mailing_address: null,
        location_type: null,
        payment_preference: null,
      });

      mockEnsureUserAndShop.mockResolvedValue({
        user: mockUser,
        shop: mockShop,
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
      mockEnsureUserAndShop.mockRejectedValue(new Error('Unauthorized'));

      const result = await getShopBusinessInfo();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to load business information');
    });
  });

  describe('updateShopBusinessInfo', () => {
    it('should update shop business information successfully', async () => {
      const mockUser = createMockUser({ id: 'user-123' });
      const mockShop = createMockShop({ id: 'shop-123' });
      const updateData = {
        business_name: 'Updated Business',
        email: 'updated@example.com',
        phone_number: '098-765-4321',
        mailing_address: '456 Oak St',
        location_type: 'home_based' as const,
        payment_preference: 'upfront' as const,
      };

      mockEnsureUserAndShop.mockResolvedValue({
        user: mockUser,
        shop: mockShop,
      });

      const mockEq = jest.fn(() =>
        Promise.resolve({ error: null, data: null } as any)
      );
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });

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
      const mockUser = createMockUser({ id: 'user-123' });
      const mockShop = createMockShop({ id: 'shop-123' });
      const updateData = {
        business_name: 'Updated Business',
        email: 'updated@example.com',
        phone_number: '098-765-4321',
      };

      mockEnsureUserAndShop.mockResolvedValue({
        user: mockUser,
        shop: mockShop,
      });

      const mockEq = jest.fn(() =>
        Promise.resolve({
          error: { message: 'Database error' },
          data: null,
        } as any)
      );
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
      } as any);

      const result = await updateShopBusinessInfo(updateData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to update business information');
    });
  });
});
