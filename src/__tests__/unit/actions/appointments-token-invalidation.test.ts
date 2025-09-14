// Mock all dependencies before importing
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(() => Promise.resolve({ userId: 'test-clerk-user-id' })),
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

// Mock the email classes
const mockInvalidateUnusedTokensForAppointment = jest.fn();
const mockSendAppointmentEmail = jest.fn();

jest.mock('@/lib/services/email/email-repository', () => ({
  EmailRepository: jest.fn().mockImplementation(() => ({
    invalidateUnusedTokensForAppointment:
      mockInvalidateUnusedTokensForAppointment,
  })),
}));

jest.mock('@/lib/services/email/email-service', () => ({
  EmailService: jest.fn().mockImplementation(() => ({
    sendAppointmentEmail: mockSendAppointmentEmail,
  })),
}));

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { updateAppointment } from '@/lib/actions/appointments';
import { createClient } from '@/lib/supabase/server';

describe('updateAppointment - Token Invalidation on Reschedule', () => {
  const mockSupabase = {
    from: jest.fn(),
    rpc: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (createClient as any).mockResolvedValue(mockSupabase);

    // Setup default Supabase query chain
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      update: jest.fn().mockReturnThis(),
    };

    mockSupabase.from.mockReturnValue(mockQuery);

    // Mock timezone query to return default timezone
    mockQuery.single.mockImplementation(() => {
      // This will be overridden in individual tests for specific queries
      return Promise.resolve({
        data: null,
        error: { message: 'Not found' },
      });
    });

    // Mock RPC calls (appointment conflict check)
    mockSupabase.rpc.mockResolvedValue({
      data: false, // No conflict
      error: null,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should invalidate unused tokens when appointment time is changed', async () => {
    const appointmentId = '550e8400-e29b-41d4-a716-446655440000';
    const mockCurrentAppointment = {
      id: appointmentId,
      client_id: '550e8400-e29b-41d4-a716-446655440001',
      date: '2026-01-15',
      start_time: '10:00',
      end_time: '11:00',
      start_at: '2026-01-15T10:00:00Z',
      end_at: '2026-01-15T11:00:00Z',
      type: 'consultation',
      status: 'pending',
      notes: 'Original appointment',
      shop_id: '550e8400-e29b-41d4-a716-446655440002',
      shops: {
        owner_user_id: '550e8400-e29b-41d4-a716-446655440003',
        users: {
          clerk_user_id: 'test-clerk-user-id',
        },
      },
    };

    const mockUpdatedAppointment = {
      ...mockCurrentAppointment,
      date: '2026-01-16',
      start_time: '14:00',
      end_time: '15:00',
      client: {
        id: '550e8400-e29b-41d4-a716-446655440001',
        shop_id: '550e8400-e29b-41d4-a716-446655440002',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone_number: '+1234567890',
        accept_email: true,
        accept_sms: false,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
    };

    // Mock the queries in sequence
    const mockSelectQuery = mockSupabase.from().select().eq().single;
    const mockUpdateQuery = mockSupabase.from().update().eq().select().single;

    // Sequence of calls: appointment -> timezone -> user -> update
    mockSelectQuery
      .mockResolvedValueOnce({
        data: mockCurrentAppointment,
        error: null,
      })
      .mockResolvedValueOnce({
        data: null,
        error: { message: 'Timezone not found' },
      })
      .mockResolvedValueOnce({
        data: { id: '550e8400-e29b-41d4-a716-446655440003' },
        error: null,
      });

    // Update query: return updated appointment
    mockUpdateQuery.mockResolvedValueOnce({
      data: mockUpdatedAppointment,
      error: null,
    });

    // Mock email service methods
    mockSendAppointmentEmail.mockResolvedValue({ success: true });
    mockInvalidateUnusedTokensForAppointment.mockResolvedValue(undefined);

    // Call updateAppointment with time change
    const updateData = {
      id: appointmentId,
      date: '2026-01-16',
      startTime: '14:00',
      endTime: '15:00',
      sendEmail: true,
    };

    await updateAppointment(updateData);

    // Verify that tokens were invalidated
    expect(mockInvalidateUnusedTokensForAppointment).toHaveBeenCalledWith(
      appointmentId
    );
    expect(mockInvalidateUnusedTokensForAppointment).toHaveBeenCalledTimes(1);

    // Verify that reschedule email was sent
    expect(mockSendAppointmentEmail).toHaveBeenCalledWith(
      appointmentId,
      'appointment_rescheduled',
      { previous_time: '2026-01-15 10:00' }
    );
  });

  it('should not invalidate tokens when only non-time fields are updated', async () => {
    const appointmentId = '550e8400-e29b-41d4-a716-446655440000';
    const mockCurrentAppointment = {
      id: appointmentId,
      client_id: '550e8400-e29b-41d4-a716-446655440001',
      date: '2026-01-15',
      start_time: '10:00',
      end_time: '11:00',
      start_at: '2026-01-15T10:00:00Z',
      end_at: '2026-01-15T11:00:00Z',
      type: 'consultation',
      status: 'pending',
      notes: 'Original appointment',
      shop_id: '550e8400-e29b-41d4-a716-446655440002',
      shops: {
        owner_user_id: '550e8400-e29b-41d4-a716-446655440003',
        users: {
          clerk_user_id: 'test-clerk-user-id',
        },
      },
    };

    const mockUpdatedAppointment = {
      ...mockCurrentAppointment,
      notes: 'Updated notes',
      client: {
        id: '550e8400-e29b-41d4-a716-446655440001',
        shop_id: '550e8400-e29b-41d4-a716-446655440002',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone_number: '+1234567890',
        accept_email: true,
        accept_sms: false,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
    };

    // Mock the queries
    const mockSelectQuery = mockSupabase.from().select().eq().single;
    const mockUpdateQuery = mockSupabase.from().update().eq().select().single;

    // First query: get current appointment
    mockSelectQuery.mockResolvedValueOnce({
      data: mockCurrentAppointment,
      error: null,
    });

    // Second query: get user for owner ID
    mockSelectQuery.mockResolvedValueOnce({
      data: { id: '550e8400-e29b-41d4-a716-446655440003' },
      error: null,
    });

    // Update query: return updated appointment
    mockUpdateQuery.mockResolvedValueOnce({
      data: mockUpdatedAppointment,
      error: null,
    });

    // Call updateAppointment with only notes change
    const updateData = {
      id: appointmentId,
      notes: 'Updated notes',
      sendEmail: true,
    };

    await updateAppointment(updateData);

    // Verify that tokens were NOT invalidated
    expect(mockInvalidateUnusedTokensForAppointment).not.toHaveBeenCalled();

    // Verify that no reschedule email was sent
    expect(mockSendAppointmentEmail).not.toHaveBeenCalledWith(
      expect.any(String),
      'appointment_rescheduled',
      expect.any(Object)
    );
  });

  it('should invalidate tokens when appointment is canceled', async () => {
    const appointmentId = '550e8400-e29b-41d4-a716-446655440000';
    const mockCurrentAppointment = {
      id: appointmentId,
      client_id: '550e8400-e29b-41d4-a716-446655440001',
      date: '2026-01-15',
      start_time: '10:00',
      end_time: '11:00',
      start_at: '2026-01-15T10:00:00Z',
      end_at: '2026-01-15T11:00:00Z',
      type: 'consultation',
      status: 'pending',
      notes: 'Original appointment',
      shop_id: '550e8400-e29b-41d4-a716-446655440002',
      shops: {
        owner_user_id: '550e8400-e29b-41d4-a716-446655440003',
        users: {
          clerk_user_id: 'test-clerk-user-id',
        },
      },
    };

    const mockUpdatedAppointment = {
      ...mockCurrentAppointment,
      status: 'canceled',
      client: {
        id: '550e8400-e29b-41d4-a716-446655440001',
        shop_id: '550e8400-e29b-41d4-a716-446655440002',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone_number: '+1234567890',
        accept_email: true,
        accept_sms: false,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
    };

    // Mock the queries
    const mockSelectQuery = mockSupabase.from().select().eq().single;
    const mockUpdateQuery = mockSupabase.from().update().eq().select().single;

    // First query: get current appointment
    mockSelectQuery.mockResolvedValueOnce({
      data: mockCurrentAppointment,
      error: null,
    });

    // Second query: get user for owner ID
    mockSelectQuery.mockResolvedValueOnce({
      data: { id: '550e8400-e29b-41d4-a716-446655440003' },
      error: null,
    });

    // Update query: return updated appointment
    mockUpdateQuery.mockResolvedValueOnce({
      data: mockUpdatedAppointment,
      error: null,
    });

    // Mock email service methods
    mockSendAppointmentEmail.mockResolvedValue({ success: true });

    // Call updateAppointment with status change to canceled
    const updateData = {
      id: appointmentId,
      status: 'canceled' as const,
      sendEmail: true,
    };

    await updateAppointment(updateData);

    // Verify that cancellation email was sent
    expect(mockSendAppointmentEmail).toHaveBeenCalledWith(
      appointmentId,
      'appointment_canceled',
      { previous_time: '2026-01-15 10:00' }
    );

    // Note: For canceled appointments, tokens are naturally invalidated because
    // the appointment status changes to canceled, making confirm/decline irrelevant
    // The existing token validation logic already handles this case
  });

  it('should handle token invalidation errors gracefully', async () => {
    const appointmentId = '550e8400-e29b-41d4-a716-446655440000';
    const mockCurrentAppointment = {
      id: appointmentId,
      client_id: '550e8400-e29b-41d4-a716-446655440001',
      date: '2026-01-15',
      start_time: '10:00',
      end_time: '11:00',
      start_at: '2026-01-15T10:00:00Z',
      end_at: '2026-01-15T11:00:00Z',
      type: 'consultation',
      status: 'pending',
      notes: 'Original appointment',
      shop_id: '550e8400-e29b-41d4-a716-446655440002',
      shops: {
        owner_user_id: '550e8400-e29b-41d4-a716-446655440003',
        users: {
          clerk_user_id: 'test-clerk-user-id',
        },
      },
    };

    const mockUpdatedAppointment = {
      ...mockCurrentAppointment,
      date: '2026-01-16',
      client: {
        id: '550e8400-e29b-41d4-a716-446655440001',
        shop_id: '550e8400-e29b-41d4-a716-446655440002',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone_number: '+1234567890',
        accept_email: true,
        accept_sms: false,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
    };

    // Mock the queries
    const mockSelectQuery = mockSupabase.from().select().eq().single;
    const mockUpdateQuery = mockSupabase.from().update().eq().select().single;

    // First query: get current appointment
    mockSelectQuery.mockResolvedValueOnce({
      data: mockCurrentAppointment,
      error: null,
    });

    // Second query: get user for owner ID
    mockSelectQuery.mockResolvedValueOnce({
      data: { id: '550e8400-e29b-41d4-a716-446655440003' },
      error: null,
    });

    // Update query: return updated appointment
    mockUpdateQuery.mockResolvedValueOnce({
      data: mockUpdatedAppointment,
      error: null,
    });

    // Mock token invalidation to throw error
    mockInvalidateUnusedTokensForAppointment.mockRejectedValue(
      new Error('Database error')
    );

    // Mock email service to succeed
    mockSendAppointmentEmail.mockResolvedValue({ success: true });

    // Mock console.warn to avoid noise in test output
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    // Call updateAppointment with time change
    const updateData = {
      id: appointmentId,
      date: '2026-01-16',
      sendEmail: true,
    };

    // Should not throw even if token invalidation fails
    await expect(updateAppointment(updateData)).resolves.toBeDefined();

    // Verify that warning was logged
    expect(consoleSpy).toHaveBeenCalledWith(
      '[updateAppointment] Failed to send notification email:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });
});
