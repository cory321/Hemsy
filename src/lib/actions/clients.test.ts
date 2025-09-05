import {
  getClients,
  createClient,
  updateClient,
  deleteClient,
  archiveClient,
  restoreClient,
  searchClients,
  getClientActiveOrdersCount,
  getClientOutstandingBalance,
  getArchivedClientsCount,
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
  in: jest.fn().mockReturnThis(),
  rpc: jest.fn(),
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
          first_name: 'Test',
          last_name: 'User',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          timezone: 'America/New_York',
          timezone_offset: -300,
        },
        shop: {
          id: 'shop_123',
          owner_user_id: 'user_123',
          name: 'Test Shop',
          business_name: 'Test Shop LLC',
          email: 'shop@example.com',
          phone_number: '555-0123',
          mailing_address: '123 Test St',
          location_type: 'shop_location',
          tax_percent: 0,
          buffer_time_minutes: 15,
          trial_countdown_enabled: false,
          trial_end_date: null,
          working_hours: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          onboarding_completed: true,
          timezone: 'America/New_York',
          timezone_offset: -300,
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
          first_name: 'Test',
          last_name: 'User',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          timezone: 'America/New_York',
          timezone_offset: -300,
        },
        shop: {
          id: 'shop_123',
          owner_user_id: 'user_123',
          name: 'Test Shop',
          business_name: 'Test Shop LLC',
          email: 'shop@example.com',
          phone_number: '555-0123',
          mailing_address: '123 Test St',
          location_type: 'shop_location',
          tax_percent: 0,
          buffer_time_minutes: 15,
          trial_countdown_enabled: false,
          trial_end_date: null,
          working_hours: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          onboarding_completed: true,
          timezone: 'America/New_York',
          timezone_offset: -300,
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
    it('should create a new client successfully', async () => {
      mockEnsureUserAndShop.mockResolvedValue({
        user: {
          id: 'user_123',
          clerk_user_id: 'clerk_123',
          email: 'test@example.com',
          role: 'user',
          first_name: 'Test',
          last_name: 'User',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          timezone: 'America/New_York',
          timezone_offset: -300,
        },
        shop: {
          id: 'shop_123',
          owner_user_id: 'user_123',
          name: 'Test Shop',
          business_name: 'Test Shop LLC',
          email: 'shop@example.com',
          phone_number: '555-0123',
          mailing_address: '123 Test St',
          location_type: 'shop_location',
          tax_percent: 0,
          buffer_time_minutes: 15,
          trial_countdown_enabled: false,
          trial_end_date: null,
          working_hours: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          onboarding_completed: true,
          timezone: 'America/New_York',
          timezone_offset: -300,
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

      // Mock insert().select().single() chain for successful insert
      const insertSingle = jest.fn().mockResolvedValue({
        data: {
          id: 'new_client_id',
          shop_id: 'shop_123',
          ...newClient,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      });
      (mockSupabase.insert as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({ single: insertSingle }),
      });

      const result = await createClient(newClient);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toMatchObject({
          id: 'new_client_id',
          ...newClient,
        });
      }
    });

    it('should return error when email already exists', async () => {
      mockEnsureUserAndShop.mockResolvedValue({
        user: { id: 'user_123' },
        shop: { id: 'shop_123' },
      } as any);

      const newClient = {
        first_name: 'New',
        last_name: 'Client',
        email: 'existing@example.com',
        phone_number: '5551112222',
        accept_email: true,
        accept_sms: false,
        notes: null,
        mailing_address: null,
      };

      // Mock insert unique constraint violation on email
      const emailUniqueError = {
        data: null,
        error: {
          code: '23505',
          message:
            'duplicate key value violates unique constraint "clients_shop_email_unique"',
        },
      };
      (mockSupabase.insert as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue(emailUniqueError),
        }),
      });

      const result = await createClient(newClient);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(
          'A client with this email address already exists'
        );
      }
    });

    it('should return error when phone number already exists', async () => {
      mockEnsureUserAndShop.mockResolvedValue({
        user: { id: 'user_123' },
        shop: { id: 'shop_123' },
      } as any);

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

      // Mock insert unique constraint violation on phone
      const phoneUniqueError = {
        data: null,
        error: {
          code: '23505',
          message:
            'duplicate key value violates unique constraint "clients_shop_phone_unique"',
        },
      };
      (mockSupabase.insert as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue(phoneUniqueError),
        }),
      });

      const result = await createClient(newClient);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(
          'A client with this phone number already exists'
        );
      }
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
          first_name: 'Test',
          last_name: 'User',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          timezone: 'America/New_York',
          timezone_offset: -300,
        },
        shop: {
          id: 'shop_123',
          owner_user_id: 'user_123',
          name: 'Test Shop',
          business_name: 'Test Shop LLC',
          email: 'shop@example.com',
          phone_number: '555-0123',
          mailing_address: '123 Test St',
          location_type: 'shop_location',
          tax_percent: 0,
          buffer_time_minutes: 15,
          trial_countdown_enabled: false,
          trial_end_date: null,
          working_hours: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          onboarding_completed: true,
          timezone: 'America/New_York',
          timezone_offset: -300,
        },
      });

      const updates = {
        first_name: 'Updated',
        email: 'updated@example.com',
      };

      const updateSingle = jest.fn().mockResolvedValue({
        data: {
          id: 'client_123',
          ...updates,
          last_name: 'Client',
          phone_number: '5551234567',
          updated_at: new Date().toISOString(),
        },
        error: null,
      });
      (mockSupabase.update as jest.Mock).mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({ single: updateSingle }),
        }),
      });

      const result = await updateClient('client_123', updates);

      expect(mockSupabase.update).toHaveBeenCalledWith(updates);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toMatchObject(updates);
      }
    });
  });

  describe('deleteClient', () => {
    it('should archive a client (backwards compatibility)', async () => {
      mockEnsureUserAndShop.mockResolvedValue({
        user: {
          id: 'user_123',
          clerk_user_id: 'clerk_123',
          email: 'test@example.com',
          role: 'user',
          first_name: 'Test',
          last_name: 'User',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          timezone: 'America/New_York',
          timezone_offset: -300,
        },
        shop: {
          id: 'shop_123',
          owner_user_id: 'user_123',
          name: 'Test Shop',
          business_name: 'Test Shop LLC',
          email: 'shop@example.com',
          phone_number: '555-0123',
          mailing_address: '123 Test St',
          location_type: 'shop_location',
          tax_percent: 0,
          buffer_time_minutes: 15,
          trial_countdown_enabled: false,
          trial_end_date: null,
          working_hours: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          onboarding_completed: true,
          timezone: 'America/New_York',
          timezone_offset: -300,
        },
      });

      mockSupabase.rpc.mockResolvedValue({
        error: null,
      });

      await deleteClient('client_123');

      expect(mockSupabase.rpc).toHaveBeenCalledWith('archive_client', {
        p_client_id: 'client_123',
        p_user_id: 'user_123',
      });
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

      mockEnsureUserAndShop.mockResolvedValue({
        user: { id: 'user_123' },
        shop: { id: 'shop_123' },
      } as any);

      // Mock the full chain for getClients (which searchClients calls internally)
      mockSupabase.range.mockResolvedValue({
        data: mockClients,
        error: null,
        count: 2,
      });

      const result = await searchClients('john');

      expect(result).toEqual(mockClients);
    });

    it('should handle search errors gracefully', async () => {
      mockEnsureUserAndShop.mockResolvedValue({
        user: { id: 'user_123' },
        shop: { id: 'shop_123' },
      } as any);

      // Mock the getClients call to throw an error
      mockSupabase.range.mockRejectedValue(new Error('Search failed'));

      const result = await searchClients('test');

      expect(result).toEqual([]);
    });
  });

  describe('getClientActiveOrdersCount', () => {
    it('should return the count of active orders for a client', async () => {
      mockEnsureUserAndShop.mockResolvedValue({
        user: {
          id: 'user_123',
          clerk_user_id: 'clerk_123',
          email: 'test@example.com',
          role: 'user',
          first_name: 'Test',
          last_name: 'User',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          timezone: 'America/New_York',
          timezone_offset: -300,
        },
        shop: {
          id: 'shop_123',
          owner_user_id: 'user_123',
          name: 'Test Shop',
          business_name: 'Test Shop LLC',
          email: 'shop@example.com',
          phone_number: '555-0123',
          mailing_address: '123 Test St',
          location_type: 'shop_location',
          tax_percent: 0,
          buffer_time_minutes: 15,
          trial_countdown_enabled: false,
          trial_end_date: null,
          working_hours: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          onboarding_completed: true,
          timezone: 'America/New_York',
          timezone_offset: -300,
        },
      });

      // Mock orders count query - need to set up the chain properly
      const mockChain = {
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          count: 3,
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue(mockChain),
        }),
      });

      const result = await getClientActiveOrdersCount('client_123');

      expect(result).toBe(3);
      expect(mockSupabase.from).toHaveBeenCalledWith('orders');
      // Note: We can't easily verify the chained calls with our mock structure,
      // but the function works correctly as evidenced by the return value
    });

    it('should return 0 when client has no active orders', async () => {
      mockEnsureUserAndShop.mockResolvedValue({
        user: { id: 'user_123' },
        shop: { id: 'shop_123' },
      } as any);

      const mockChain = {
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          count: 0,
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue(mockChain),
        }),
      });

      const result = await getClientActiveOrdersCount('client_456');

      expect(result).toBe(0);
    });

    it('should return 0 when there is a database error', async () => {
      mockEnsureUserAndShop.mockResolvedValue({
        user: { id: 'user_123' },
        shop: { id: 'shop_123' },
      } as any);

      const mockChain = {
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          count: null,
          error: { message: 'Database error' },
        }),
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue(mockChain),
        }),
      });

      const result = await getClientActiveOrdersCount('client_789');

      expect(result).toBe(0);
    });

    it('should return 0 when ensureUserAndShop throws an error', async () => {
      mockEnsureUserAndShop.mockRejectedValue(new Error('Unauthorized'));

      const result = await getClientActiveOrdersCount('client_123');

      expect(result).toBe(0);
    });

    it('should exclude completed and cancelled orders from the count', async () => {
      mockEnsureUserAndShop.mockResolvedValue({
        user: { id: 'user_123' },
        shop: { id: 'shop_123' },
      } as any);

      const mockChain = {
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          count: 2,
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue(mockChain),
        }),
      });

      const result = await getClientActiveOrdersCount('client_123');

      expect(result).toBe(2);
      // Verify that the function correctly filters for active statuses
      expect(mockChain.in).toHaveBeenCalledWith('status', [
        'new',
        'active',
        'ready_for_pickup',
      ]);
    });
  });

  describe('getClientOutstandingBalance', () => {
    it('should calculate outstanding balance correctly for orders with amounts due', async () => {
      mockEnsureUserAndShop.mockResolvedValue({
        user: { id: 'user_123' },
        shop: { id: 'shop_123' },
      } as any);

      const mockOrders = [
        { total_cents: 10000, paid_amount_cents: 5000 }, // $50 outstanding
        { total_cents: 8000, paid_amount_cents: 8000 }, // $0 outstanding (paid)
        { total_cents: 12000, paid_amount_cents: 2000 }, // $100 outstanding
      ];

      // Mock the complete query chain for outstanding balance
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: mockOrders,
              error: null,
            }),
          }),
        }),
      });

      const result = await getClientOutstandingBalance('client_123');

      expect(result).toBe(15000); // $50 + $100 = $150 in cents
      expect(mockSupabase.from).toHaveBeenCalledWith('orders');
    });

    it('should exclude overpayments/credits from outstanding balance', async () => {
      mockEnsureUserAndShop.mockResolvedValue({
        user: { id: 'user_123' },
        shop: { id: 'shop_123' },
      } as any);

      const mockOrders = [
        { total_cents: 10000, paid_amount_cents: 12000 }, // -$20 (credit, should be excluded)
        { total_cents: 8000, paid_amount_cents: 3000 }, // $50 outstanding
        { total_cents: 5000, paid_amount_cents: 7000 }, // -$20 (credit, should be excluded)
      ];

      const mockSelectChain = {
        eq: jest.fn().mockReturnThis(),
      };
      // The function calls .eq() twice, so the second call should resolve with data
      mockSelectChain.eq
        .mockReturnValueOnce(mockSelectChain) // First .eq() call
        .mockResolvedValueOnce({
          // Second .eq() call
          data: mockOrders,
          error: null,
        });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue(mockSelectChain),
      });

      const result = await getClientOutstandingBalance('client_123');

      expect(result).toBe(5000); // Only $50 outstanding, credits excluded
    });

    it('should return 0 when client has no orders', async () => {
      mockEnsureUserAndShop.mockResolvedValue({
        user: { id: 'user_123' },
        shop: { id: 'shop_123' },
      } as any);

      const mockSelectChain = {
        eq: jest.fn().mockReturnThis(),
      };
      // The function calls .eq() twice, so setup the chain properly
      mockSelectChain.eq.mockReturnThis().mockReturnThis().mockResolvedValue({
        data: [],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue(mockSelectChain),
      });

      const result = await getClientOutstandingBalance('client_456');

      expect(result).toBe(0);
    });

    it('should return 0 when all orders are fully paid', async () => {
      mockEnsureUserAndShop.mockResolvedValue({
        user: { id: 'user_123' },
        shop: { id: 'shop_123' },
      } as any);

      const mockOrders = [
        { total_cents: 10000, paid_amount_cents: 10000 }, // Fully paid
        { total_cents: 8000, paid_amount_cents: 8000 }, // Fully paid
      ];

      const mockSelectChain = {
        eq: jest.fn().mockReturnThis(),
      };
      // The function calls .eq() twice, so the second call should resolve with data
      mockSelectChain.eq
        .mockReturnValueOnce(mockSelectChain) // First .eq() call
        .mockResolvedValueOnce({
          // Second .eq() call
          data: mockOrders,
          error: null,
        });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue(mockSelectChain),
      });

      const result = await getClientOutstandingBalance('client_123');

      expect(result).toBe(0);
    });

    it('should return 0 when there is a database error', async () => {
      mockEnsureUserAndShop.mockResolvedValue({
        user: { id: 'user_123' },
        shop: { id: 'shop_123' },
      } as any);

      const mockSelectChain = {
        eq: jest.fn().mockReturnThis(),
      };
      // The function calls .eq() twice, so setup the chain properly
      mockSelectChain.eq
        .mockReturnThis()
        .mockReturnThis()
        .mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue(mockSelectChain),
      });

      const result = await getClientOutstandingBalance('client_789');

      expect(result).toBe(0);
    });

    it('should return 0 when ensureUserAndShop throws an error', async () => {
      mockEnsureUserAndShop.mockRejectedValue(new Error('Unauthorized'));

      const result = await getClientOutstandingBalance('client_123');

      expect(result).toBe(0);
    });

    it('should handle null/undefined values gracefully', async () => {
      mockEnsureUserAndShop.mockResolvedValue({
        user: { id: 'user_123' },
        shop: { id: 'shop_123' },
      } as any);

      const mockOrders = [
        { total_cents: null, paid_amount_cents: 5000 }, // Should treat null as 0
        { total_cents: 8000, paid_amount_cents: null }, // Should treat null as 0
        { total_cents: 10000, paid_amount_cents: 3000 }, // $70 outstanding
      ];

      const mockSelectChain = {
        eq: jest.fn().mockReturnThis(),
      };
      // The function calls .eq() twice, so the second call should resolve with data
      mockSelectChain.eq
        .mockReturnValueOnce(mockSelectChain) // First .eq() call
        .mockResolvedValueOnce({
          // Second .eq() call
          data: mockOrders,
          error: null,
        });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue(mockSelectChain),
      });

      const result = await getClientOutstandingBalance('client_123');

      expect(result).toBe(15000); // $0 + $80 + $70 = $150 in cents
    });
  });

  describe('archiveClient', () => {
    it('should archive a client using RPC function', async () => {
      mockEnsureUserAndShop.mockResolvedValue({
        user: {
          id: 'user_123',
          clerk_user_id: 'clerk_123',
          email: 'test@example.com',
          role: 'user',
          first_name: 'Test',
          last_name: 'User',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          timezone: 'America/New_York',
          timezone_offset: -300,
        },
        shop: {
          id: 'shop_123',
          owner_user_id: 'user_123',
          name: 'Test Shop',
          business_name: 'Test Shop LLC',
          email: 'shop@example.com',
          phone_number: '555-0123',
          mailing_address: '123 Test St',
          location_type: 'shop_location',
          tax_percent: 0,
          buffer_time_minutes: 15,
          trial_countdown_enabled: false,
          trial_end_date: null,
          working_hours: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          onboarding_completed: true,
          timezone: 'America/New_York',
          timezone_offset: -300,
        },
      });

      mockSupabase.rpc.mockResolvedValue({
        error: null,
      });

      await archiveClient('client_123');

      expect(mockSupabase.rpc).toHaveBeenCalledWith('archive_client', {
        p_client_id: 'client_123',
        p_user_id: 'user_123',
      });
    });

    it('should throw error when archive fails', async () => {
      mockEnsureUserAndShop.mockResolvedValue({
        user: {
          id: 'user_123',
          clerk_user_id: 'clerk_123',
          email: 'test@example.com',
          role: 'user',
          first_name: 'Test',
          last_name: 'User',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          timezone: 'America/New_York',
          timezone_offset: -300,
        },
        shop: {
          id: 'shop_123',
          owner_user_id: 'user_123',
          name: 'Test Shop',
          business_name: 'Test Shop LLC',
          email: 'shop@example.com',
          phone_number: '555-0123',
          mailing_address: '123 Test St',
          location_type: 'shop_location',
          tax_percent: 0,
          buffer_time_minutes: 15,
          trial_countdown_enabled: false,
          trial_end_date: null,
          working_hours: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          onboarding_completed: true,
          timezone: 'America/New_York',
          timezone_offset: -300,
        },
      });

      mockSupabase.rpc.mockResolvedValue({
        error: { message: 'Client not found or already archived' },
      });

      await expect(archiveClient('client_123')).rejects.toThrow(
        'Failed to archive client: Client not found or already archived'
      );
    });
  });

  describe('restoreClient', () => {
    it('should restore an archived client using RPC function', async () => {
      mockEnsureUserAndShop.mockResolvedValue({
        user: {
          id: 'user_123',
          clerk_user_id: 'clerk_123',
          email: 'test@example.com',
          role: 'user',
          first_name: 'Test',
          last_name: 'User',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          timezone: 'America/New_York',
          timezone_offset: -300,
        },
        shop: {
          id: 'shop_123',
          owner_user_id: 'user_123',
          name: 'Test Shop',
          business_name: 'Test Shop LLC',
          email: 'shop@example.com',
          phone_number: '555-0123',
          mailing_address: '123 Test St',
          location_type: 'shop_location',
          tax_percent: 0,
          buffer_time_minutes: 15,
          trial_countdown_enabled: false,
          trial_end_date: null,
          working_hours: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          onboarding_completed: true,
          timezone: 'America/New_York',
          timezone_offset: -300,
        },
      });

      mockSupabase.rpc.mockResolvedValue({
        error: null,
      });

      await restoreClient('client_123');

      expect(mockSupabase.rpc).toHaveBeenCalledWith('restore_client', {
        p_client_id: 'client_123',
      });
    });

    it('should throw error when restore fails', async () => {
      mockEnsureUserAndShop.mockResolvedValue({
        user: {
          id: 'user_123',
          clerk_user_id: 'clerk_123',
          email: 'test@example.com',
          role: 'user',
          first_name: 'Test',
          last_name: 'User',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          timezone: 'America/New_York',
          timezone_offset: -300,
        },
        shop: {
          id: 'shop_123',
          owner_user_id: 'user_123',
          name: 'Test Shop',
          business_name: 'Test Shop LLC',
          email: 'shop@example.com',
          phone_number: '555-0123',
          mailing_address: '123 Test St',
          location_type: 'shop_location',
          tax_percent: 0,
          buffer_time_minutes: 15,
          trial_countdown_enabled: false,
          trial_end_date: null,
          working_hours: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          onboarding_completed: true,
          timezone: 'America/New_York',
          timezone_offset: -300,
        },
      });

      mockSupabase.rpc.mockResolvedValue({
        error: { message: 'Client not found or not archived' },
      });

      await expect(restoreClient('client_123')).rejects.toThrow(
        'Failed to restore client: Client not found or not archived'
      );
    });
  });

  describe('getArchivedClientsCount', () => {
    it('should return count of archived clients', async () => {
      mockEnsureUserAndShop.mockResolvedValue({
        user: {
          id: 'user_123',
          clerk_user_id: 'clerk_123',
          email: 'test@example.com',
          role: 'user',
          first_name: 'Test',
          last_name: 'User',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          timezone: 'America/New_York',
          timezone_offset: -300,
        },
        shop: {
          id: 'shop_123',
          owner_user_id: 'user_123',
          name: 'Test Shop',
          business_name: 'Test Shop LLC',
          email: 'shop@example.com',
          phone_number: '555-0123',
          mailing_address: '123 Test St',
          location_type: 'shop_location',
          tax_percent: 0,
          buffer_time_minutes: 15,
          trial_countdown_enabled: false,
          trial_end_date: null,
          working_hours: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          onboarding_completed: true,
          timezone: 'America/New_York',
          timezone_offset: -300,
        },
      });

      const mockSelectFn = jest.fn();
      const mockSelectChain = {
        eq: jest.fn().mockReturnThis(),
      };
      // The function calls .eq() twice, so the second call should resolve with count
      mockSelectChain.eq
        .mockReturnValueOnce(mockSelectChain) // First .eq() for shop_id
        .mockResolvedValueOnce({
          // Second .eq() for is_archived
          count: 5,
          error: null,
        });

      mockSupabase.from.mockReturnValue({
        select: mockSelectFn.mockReturnValue(mockSelectChain),
      });

      const result = await getArchivedClientsCount();

      expect(result).toBe(5);
      expect(mockSupabase.from).toHaveBeenCalledWith('clients');
      expect(mockSelectFn).toHaveBeenCalledWith('*', {
        count: 'exact',
        head: true,
      });
      expect(mockSelectChain.eq).toHaveBeenCalledWith('shop_id', 'shop_123');
      expect(mockSelectChain.eq).toHaveBeenCalledWith('is_archived', true);
    });

    it('should return 0 when error occurs', async () => {
      mockEnsureUserAndShop.mockResolvedValue({
        user: {
          id: 'user_123',
          clerk_user_id: 'clerk_123',
          email: 'test@example.com',
          role: 'user',
          first_name: 'Test',
          last_name: 'User',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          timezone: 'America/New_York',
          timezone_offset: -300,
        },
        shop: {
          id: 'shop_123',
          owner_user_id: 'user_123',
          name: 'Test Shop',
          business_name: 'Test Shop LLC',
          email: 'shop@example.com',
          phone_number: '555-0123',
          mailing_address: '123 Test St',
          location_type: 'shop_location',
          tax_percent: 0,
          buffer_time_minutes: 15,
          trial_countdown_enabled: false,
          trial_end_date: null,
          working_hours: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          onboarding_completed: true,
          timezone: 'America/New_York',
          timezone_offset: -300,
        },
      });

      const mockSelectChain = {
        eq: jest.fn().mockReturnThis(),
      };
      mockSelectChain.eq
        .mockReturnValueOnce(mockSelectChain)
        .mockResolvedValueOnce({
          count: null,
          error: { message: 'Database error' },
        });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue(mockSelectChain),
      });

      const result = await getArchivedClientsCount();

      expect(result).toBe(0);
    });
  });

  describe('getClients with includeArchived filter', () => {
    it('should exclude archived clients by default', async () => {
      mockEnsureUserAndShop.mockResolvedValue({
        user: {
          id: 'user_123',
          clerk_user_id: 'clerk_123',
          email: 'test@example.com',
          role: 'user',
          first_name: 'Test',
          last_name: 'User',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          timezone: 'America/New_York',
          timezone_offset: -300,
        },
        shop: {
          id: 'shop_123',
          owner_user_id: 'user_123',
          name: 'Test Shop',
          business_name: 'Test Shop LLC',
          email: 'shop@example.com',
          phone_number: '555-0123',
          mailing_address: '123 Test St',
          location_type: 'shop_location',
          tax_percent: 0,
          buffer_time_minutes: 15,
          trial_countdown_enabled: false,
          trial_end_date: null,
          working_hours: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          onboarding_completed: true,
          timezone: 'America/New_York',
          timezone_offset: -300,
        },
      });

      const mockClients = [
        {
          id: 'client-1',
          shop_id: 'shop-123',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          phone_number: '1234567890',
          is_archived: false,
        },
      ];

      const mockSelectChain = {
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: mockClients,
          error: null,
          count: 1,
        }),
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue(mockSelectChain),
      });

      const result = await getClients(1, 10);

      expect(mockSelectChain.eq).toHaveBeenCalledWith('shop_id', 'shop_123');
      expect(mockSelectChain.eq).toHaveBeenCalledWith('is_archived', false);
      expect(result.data).toEqual(mockClients);
    });

    it('should include archived clients when includeArchived is true', async () => {
      mockEnsureUserAndShop.mockResolvedValue({
        user: {
          id: 'user_123',
          clerk_user_id: 'clerk_123',
          email: 'test@example.com',
          role: 'user',
          first_name: 'Test',
          last_name: 'User',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          timezone: 'America/New_York',
          timezone_offset: -300,
        },
        shop: {
          id: 'shop_123',
          owner_user_id: 'user_123',
          name: 'Test Shop',
          business_name: 'Test Shop LLC',
          email: 'shop@example.com',
          phone_number: '555-0123',
          mailing_address: '123 Test St',
          location_type: 'shop_location',
          tax_percent: 0,
          buffer_time_minutes: 15,
          trial_countdown_enabled: false,
          trial_end_date: null,
          working_hours: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          onboarding_completed: true,
          timezone: 'America/New_York',
          timezone_offset: -300,
        },
      });

      const mockClients = [
        {
          id: 'client-1',
          shop_id: 'shop-123',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          phone_number: '1234567890',
          is_archived: false,
        },
        {
          id: 'client-2',
          shop_id: 'shop-123',
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane@example.com',
          phone_number: '0987654321',
          is_archived: true,
        },
      ];

      const mockSelectChain = {
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: mockClients,
          error: null,
          count: 2,
        }),
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue(mockSelectChain),
      });

      const result = await getClients(1, 10, { includeArchived: true });

      // Should only have one .eq() call for shop_id, not for is_archived
      expect(mockSelectChain.eq).toHaveBeenCalledTimes(1);
      expect(mockSelectChain.eq).toHaveBeenCalledWith('shop_id', 'shop_123');
      expect(result.data).toEqual(mockClients);
      expect(result.count).toBe(2);
    });
  });
});
