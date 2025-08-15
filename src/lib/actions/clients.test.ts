import {
  getClients,
  createClient,
  updateClient,
  deleteClient,
} from './clients';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { ensureUserAndShop } from './users';

// Mock dependencies
jest.mock('@/lib/supabase/server');
jest.mock('./users');

const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  or: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  single: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
};

const mockEnsureUserAndShop = ensureUserAndShop as jest.MockedFunction<
  typeof ensureUserAndShop
>;
const mockCreateSupabaseClient = createSupabaseClient as jest.MockedFunction<
  typeof createSupabaseClient
>;

describe('Client Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateSupabaseClient.mockResolvedValue(mockSupabase as any);
  });

  describe('getClients', () => {
    it('should return paginated clients for authenticated user', async () => {
      mockEnsureUserAndShop.mockResolvedValue({
        user: {
          id: 'user_123',
          clerk_user_id: 'clerk_123',
          email: 'test@example.com',
          role: 'user',
          created_at: null,
          updated_at: null,
        },
        shop: {
          id: 'shop_123',
          owner_user_id: 'user_123',
          name: 'Test Shop',
          trial_countdown_enabled: null,
          created_at: null,
          updated_at: null,
        },
      });

      // Mock clients query
      mockSupabase.range.mockResolvedValue({
        data: [
          {
            id: 'client_1',
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com',
            phone_number: '5551234567',
          },
          {
            id: 'client_2',
            first_name: 'Jane',
            last_name: 'Smith',
            email: 'jane@example.com',
            phone_number: '5559876543',
          },
        ],
        count: 2,
        error: null,
      });

      const result = await getClients(1, 10);

      expect(result).toEqual({
        data: expect.arrayContaining([
          expect.objectContaining({
            id: 'client_1',
            first_name: 'John',
            last_name: 'Doe',
          }),
          expect.objectContaining({
            id: 'client_2',
            first_name: 'Jane',
            last_name: 'Smith',
          }),
        ]),
        count: 2,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      });
    });

    it('should throw error if user is not authenticated', async () => {
      mockEnsureUserAndShop.mockRejectedValue(new Error('Unauthorized'));

      await expect(getClients()).rejects.toThrow('Unauthorized');
    });

    it('should apply search filters correctly', async () => {
      mockEnsureUserAndShop.mockResolvedValue({
        user: {
          id: 'user_123',
          clerk_user_id: 'clerk_123',
          email: 'test@example.com',
          role: 'user',
          created_at: null,
          updated_at: null,
        },
        shop: {
          id: 'shop_123',
          owner_user_id: 'user_123',
          name: 'Test Shop',
          trial_countdown_enabled: null,
          created_at: null,
          updated_at: null,
        },
      });

      mockSupabase.range.mockResolvedValue({
        data: [],
        count: 0,
        error: null,
      });

      await getClients(1, 10, { search: 'john' });

      expect(mockSupabase.or).toHaveBeenCalledWith(
        expect.stringContaining('john')
      );
    });
  });

  describe('createClient', () => {
    it('should create a new client', async () => {
      mockEnsureUserAndShop.mockResolvedValue({
        user: {
          id: 'user_123',
          clerk_user_id: 'clerk_123',
          email: 'test@example.com',
          role: 'user',
          created_at: null,
          updated_at: null,
        },
        shop: {
          id: 'shop_123',
          owner_user_id: 'user_123',
          name: 'Test Shop',
          trial_countdown_enabled: null,
          created_at: null,
          updated_at: null,
        },
      });

      const newClient = {
        first_name: 'New',
        last_name: 'Client',
        email: 'new@example.com',
        phone_number: '5551112222',
        accept_email: true,
        accept_sms: false,
        notes: null,
        mailing_address: null,
      };

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'new_client_id',
          shop_id: 'shop_123',
          ...newClient,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      });

      const result = await createClient(newClient);

      expect(mockSupabase.insert).toHaveBeenCalledWith({
        ...newClient,
        shop_id: 'shop_123',
      });

      expect(result).toMatchObject({
        id: 'new_client_id',
        ...newClient,
      });
    });
  });

  describe('updateClient', () => {
    it('should update an existing client', async () => {
      mockEnsureUserAndShop.mockResolvedValue({
        user: {
          id: 'user_123',
          clerk_user_id: 'clerk_123',
          email: 'test@example.com',
          role: 'user',
          created_at: null,
          updated_at: null,
        },
        shop: {
          id: 'shop_123',
          owner_user_id: 'user_123',
          name: 'Test Shop',
          trial_countdown_enabled: null,
          created_at: null,
          updated_at: null,
        },
      });

      const updates = {
        first_name: 'Updated',
        email: 'updated@example.com',
      };

      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'client_123',
          ...updates,
          last_name: 'Client',
          phone_number: '5551234567',
          updated_at: new Date().toISOString(),
        },
        error: null,
      });

      const result = await updateClient('client_123', updates);

      expect(mockSupabase.update).toHaveBeenCalledWith(updates);
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'client_123');
      expect(result).toMatchObject(updates);
    });
  });

  describe('deleteClient', () => {
    it('should delete a client', async () => {
      mockEnsureUserAndShop.mockResolvedValue({
        user: {
          id: 'user_123',
          clerk_user_id: 'clerk_123',
          email: 'test@example.com',
          role: 'user',
          created_at: null,
          updated_at: null,
        },
        shop: {
          id: 'shop_123',
          owner_user_id: 'user_123',
          name: 'Test Shop',
          trial_countdown_enabled: null,
          created_at: null,
          updated_at: null,
        },
      });

      mockSupabase.eq.mockResolvedValue({
        error: null,
      });

      await deleteClient('client_123');

      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'client_123');
    });
  });

  describe('searchClients', () => {
    it('should return empty array for empty search term', async () => {
      const result = await searchClients('');
      expect(result).toEqual([]);
    });

    it('should return empty array for whitespace-only search term', async () => {
      const result = await searchClients('   ');
      expect(result).toEqual([]);
    });

    it('should search clients and return results', async () => {
      const mockClients = [
        {
          id: 'client-1',
          shop_id: 'shop-123',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          phone_number: '1234567890',
          address: '123 Main St',
          notes: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'client-2',
          shop_id: 'shop-123',
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane@example.com',
          phone_number: '0987654321',
          address: '456 Oak Ave',
          notes: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            or: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                range: jest.fn().mockResolvedValue({
                  data: mockClients,
                  error: null,
                  count: 2,
                }),
              }),
            }),
          }),
        }),
      });

      const result = await searchClients('john');

      expect(result).toEqual(mockClients);
      expect(mockSupabase.from).toHaveBeenCalledWith('clients');
    });

    it('should handle search errors gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            or: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                range: jest.fn().mockRejectedValue(new Error('Search failed')),
              }),
            }),
          }),
        }),
      });

      const result = await searchClients('test');

      expect(result).toEqual([]);
    });
  });
});
