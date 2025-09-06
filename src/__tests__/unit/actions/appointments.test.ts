import {
  getNextClientAppointment,
  getClientReadyForPickupCount,
} from '@/lib/actions/appointments';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import type { Appointment } from '@/types';

// Mock dependencies
jest.mock('@/lib/supabase/server');
jest.mock('@clerk/nextjs/server');

const mockCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>;
const mockAuth = auth as jest.MockedFunction<typeof auth>;

describe('getNextClientAppointment', () => {
  const mockUserId = 'user_123';
  const mockUserDbId = 'db_user_123';
  const mockShopId = 'shop_123';
  const mockClientId = 'client_123';

  const mockSupabase = {
    from: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: mockUserId } as any);
    mockCreateClient.mockResolvedValue(mockSupabase as any);
  });

  it('should return the next upcoming appointment for a client', async () => {
    const mockAppointment: Appointment = {
      id: 'appt_123',
      shop_id: mockShopId,
      client_id: mockClientId,
      date: '2024-12-20',
      start_time: '14:30',
      end_time: '15:30',
      type: 'fitting',
      status: 'confirmed',
      notes: 'Test appointment',
      reminder_sent: false,
      created_at: '2024-12-10T10:00:00Z',
      updated_at: '2024-12-10T10:00:00Z',
    };

    // Mock user verification
    const mockUserQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest
        .fn()
        .mockResolvedValue({ data: { id: mockUserDbId }, error: null }),
    };

    // Mock shop verification
    const mockShopQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest
        .fn()
        .mockResolvedValue({ data: { id: mockShopId }, error: null }),
    };

    // Mock appointment query
    const mockAppointmentQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest
        .fn()
        .mockResolvedValue({ data: [mockAppointment], error: null }),
    };

    mockSupabase.from
      .mockReturnValueOnce(mockUserQuery) // First call for users table
      .mockReturnValueOnce(mockShopQuery) // Second call for shops table
      .mockReturnValueOnce(mockAppointmentQuery); // Third call for appointments table

    const result = await getNextClientAppointment(mockShopId, mockClientId);

    expect(result).toEqual(mockAppointment);
    expect(mockSupabase.from).toHaveBeenCalledWith('users');
    expect(mockSupabase.from).toHaveBeenCalledWith('shops');
    expect(mockSupabase.from).toHaveBeenCalledWith('appointments');
  });

  it('should return null when no upcoming appointments exist', async () => {
    // Mock user verification
    const mockUserQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest
        .fn()
        .mockResolvedValue({ data: { id: mockUserDbId }, error: null }),
    };

    // Mock shop verification
    const mockShopQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest
        .fn()
        .mockResolvedValue({ data: { id: mockShopId }, error: null }),
    };

    // Mock appointment query with no results
    const mockAppointmentQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: [], error: null }),
    };

    mockSupabase.from
      .mockReturnValueOnce(mockUserQuery)
      .mockReturnValueOnce(mockShopQuery)
      .mockReturnValueOnce(mockAppointmentQuery);

    const result = await getNextClientAppointment(mockShopId, mockClientId);

    expect(result).toBeNull();
  });

  it('should throw error when user is not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null } as any);

    await expect(
      getNextClientAppointment(mockShopId, mockClientId)
    ).rejects.toThrow('Unauthorized');
  });

  it('should throw error when user data fetch fails', async () => {
    const mockUserQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest
        .fn()
        .mockResolvedValue({ data: null, error: new Error('User not found') }),
    };

    mockSupabase.from.mockReturnValueOnce(mockUserQuery);

    await expect(
      getNextClientAppointment(mockShopId, mockClientId)
    ).rejects.toThrow('Failed to fetch user');
  });

  it('should throw error when shop access is unauthorized', async () => {
    // Mock user verification
    const mockUserQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest
        .fn()
        .mockResolvedValue({ data: { id: mockUserDbId }, error: null }),
    };

    // Mock shop verification failure
    const mockShopQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest
        .fn()
        .mockResolvedValue({ data: null, error: new Error('Unauthorized') }),
    };

    mockSupabase.from
      .mockReturnValueOnce(mockUserQuery)
      .mockReturnValueOnce(mockShopQuery);

    await expect(
      getNextClientAppointment(mockShopId, mockClientId)
    ).rejects.toThrow('Unauthorized access to shop');
  });

  it('should throw error when appointment query fails', async () => {
    // Mock user verification
    const mockUserQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest
        .fn()
        .mockResolvedValue({ data: { id: mockUserDbId }, error: null }),
    };

    // Mock shop verification
    const mockShopQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest
        .fn()
        .mockResolvedValue({ data: { id: mockShopId }, error: null }),
    };

    // Mock appointment query failure
    const mockAppointmentQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest
        .fn()
        .mockResolvedValue({ data: null, error: new Error('Database error') }),
    };

    mockSupabase.from
      .mockReturnValueOnce(mockUserQuery)
      .mockReturnValueOnce(mockShopQuery)
      .mockReturnValueOnce(mockAppointmentQuery);

    await expect(
      getNextClientAppointment(mockShopId, mockClientId)
    ).rejects.toThrow('Failed to fetch next client appointment');
  });
});

describe('getClientReadyForPickupCount', () => {
  const mockUserId = 'user_123';
  const mockUserDbId = 'db_user_123';
  const mockShopId = 'shop_123';
  const mockClientId = 'client_123';

  const mockSupabase = {
    from: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: mockUserId } as any);
    mockCreateClient.mockResolvedValue(mockSupabase as any);
  });

  it('should return the count of ready for pickup garments for a client', async () => {
    const expectedCount = 5;

    // Mock user verification
    const mockUserQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest
        .fn()
        .mockResolvedValue({ data: { id: mockUserDbId }, error: null }),
    };

    // Mock shop verification
    const mockShopQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest
        .fn()
        .mockResolvedValue({ data: { id: mockShopId }, error: null }),
    };

    // Mock garments count query
    const mockGarmentsQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
    };

    // Chain the eq calls and return the final result
    mockGarmentsQuery.eq.mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          neq: jest
            .fn()
            .mockResolvedValue({ count: expectedCount, error: null }),
        }),
      }),
    });

    mockSupabase.from
      .mockReturnValueOnce(mockUserQuery) // First call for users table
      .mockReturnValueOnce(mockShopQuery) // Second call for shops table
      .mockReturnValueOnce(mockGarmentsQuery); // Third call for garments_with_clients view

    const result = await getClientReadyForPickupCount(mockShopId, mockClientId);

    expect(result).toBe(expectedCount);
    expect(mockSupabase.from).toHaveBeenCalledWith('users');
    expect(mockSupabase.from).toHaveBeenCalledWith('shops');
    expect(mockSupabase.from).toHaveBeenCalledWith('garments_with_clients');
  });

  it('should return 0 when no ready for pickup garments exist', async () => {
    // Mock user verification
    const mockUserQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest
        .fn()
        .mockResolvedValue({ data: { id: mockUserDbId }, error: null }),
    };

    // Mock shop verification
    const mockShopQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest
        .fn()
        .mockResolvedValue({ data: { id: mockShopId }, error: null }),
    };

    // Mock garments count query with 0 count
    const mockGarmentsQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
    };

    // Chain the eq calls and return the final result
    mockGarmentsQuery.eq.mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          neq: jest.fn().mockResolvedValue({ count: 0, error: null }),
        }),
      }),
    });

    mockSupabase.from
      .mockReturnValueOnce(mockUserQuery)
      .mockReturnValueOnce(mockShopQuery)
      .mockReturnValueOnce(mockGarmentsQuery);

    const result = await getClientReadyForPickupCount(mockShopId, mockClientId);

    expect(result).toBe(0);
  });

  it('should return 0 when count is null', async () => {
    // Mock user verification
    const mockUserQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest
        .fn()
        .mockResolvedValue({ data: { id: mockUserDbId }, error: null }),
    };

    // Mock shop verification
    const mockShopQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest
        .fn()
        .mockResolvedValue({ data: { id: mockShopId }, error: null }),
    };

    // Mock garments count query with null count
    const mockGarmentsQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
    };

    // Chain the eq calls and return the final result
    mockGarmentsQuery.eq.mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          neq: jest.fn().mockResolvedValue({ count: null, error: null }),
        }),
      }),
    });

    mockSupabase.from
      .mockReturnValueOnce(mockUserQuery)
      .mockReturnValueOnce(mockShopQuery)
      .mockReturnValueOnce(mockGarmentsQuery);

    const result = await getClientReadyForPickupCount(mockShopId, mockClientId);

    expect(result).toBe(0);
  });

  it('should throw error when user is not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null } as any);

    await expect(
      getClientReadyForPickupCount(mockShopId, mockClientId)
    ).rejects.toThrow('Unauthorized');
  });

  it('should throw error when garments query fails', async () => {
    // Mock user verification
    const mockUserQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest
        .fn()
        .mockResolvedValue({ data: { id: mockUserDbId }, error: null }),
    };

    // Mock shop verification
    const mockShopQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest
        .fn()
        .mockResolvedValue({ data: { id: mockShopId }, error: null }),
    };

    // Mock garments query failure
    const mockGarmentsQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
    };

    // Chain the eq calls and return the final result with error
    mockGarmentsQuery.eq.mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          neq: jest.fn().mockResolvedValue({
            count: null,
            error: new Error('Database error'),
          }),
        }),
      }),
    });

    mockSupabase.from
      .mockReturnValueOnce(mockUserQuery)
      .mockReturnValueOnce(mockShopQuery)
      .mockReturnValueOnce(mockGarmentsQuery);

    await expect(
      getClientReadyForPickupCount(mockShopId, mockClientId)
    ).rejects.toThrow('Failed to fetch ready for pickup count');
  });
});
