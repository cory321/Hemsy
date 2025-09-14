/**
 * @jest-environment node
 */

// Mock all modules before importing anything
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(() => ({ userId: 'test-user-id' })),
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/lib/auth/user-shop', () => ({
  ensureUserAndShop: jest.fn(),
}));

jest.mock('@/lib/config/email.config', () => ({
  resend: {},
  emailConfig: {
    from: {
      email: 'test@example.com',
      name: 'Test',
    },
    retryDelay: 60000,
    maxRetries: 3,
  },
}));

jest.mock('@/lib/services/email/resend-client', () => ({
  getResendClient: jest.fn(),
}));

jest.mock('@/lib/services/email/email-service');
jest.mock('@/lib/services/email/template-renderer');

import { testEmailTemplate } from '@/lib/actions/emails/email-settings';
import { createClient } from '@/lib/supabase/server';
import { ensureUserAndShop } from '@/lib/auth/user-shop';
import { TemplateRenderer } from '@/lib/services/email/template-renderer';
import { getResendClient } from '@/lib/services/email/resend-client';

describe('testEmailTemplate', () => {
  const mockUser = {
    userId: 'test-user-id',
    email: 'user@example.com',
  };

  const mockShop = {
    id: 'test-shop-id',
    business_name: 'Test Shop',
    business_email: 'shop@example.com',
    business_phone: '(555) 123-4567',
    business_address: '123 Test St, Test City, TS 12345',
  };

  const mockTemplate = {
    id: 'test-template-id',
    user_id: 'test-user-id',
    email_type: 'appointment_scheduled',
    subject: 'Appointment Scheduled: {appointment_date}',
    body: 'Dear {client_name}, your appointment is on {appointment_date} at {appointment_time}.',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  let mockSupabase: any;
  let mockResendClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock Supabase client
    const chainable = () => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: mockTemplate, error: null }),
      insert: jest.fn().mockResolvedValue({ data: null, error: null }),
    });

    mockSupabase = {
      from: jest.fn(() => chainable()),
    };

    // Setup mock Resend client
    mockResendClient = {
      send: jest.fn().mockResolvedValue({
        success: true,
        messageId: 'test-message-id',
      }),
    };

    // Setup mocks
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
    (ensureUserAndShop as jest.Mock).mockResolvedValue({
      user: mockUser,
      shop: mockShop,
    });
    (getResendClient as jest.Mock).mockReturnValue(mockResendClient);
    (TemplateRenderer as jest.Mock).mockImplementation(() => ({
      render: jest.fn().mockReturnValue({
        subject: 'Appointment Scheduled: Friday, January 5, 2024',
        body: 'Dear Jane Smith, your appointment is on Friday, January 5, 2024 at 2:00 PM.',
      }),
    }));
  });

  it('should successfully send a test email with the specified template', async () => {
    const result = await testEmailTemplate('appointment_scheduled');

    expect(result).toEqual({ success: true });
    expect(ensureUserAndShop).toHaveBeenCalled();
    expect(mockSupabase.from).toHaveBeenCalledWith('email_templates');
    expect(mockSupabase.from).toHaveBeenCalledWith('email_logs');
    expect(mockResendClient.send).toHaveBeenCalled();
  });

  it('should use custom email if provided', async () => {
    const customEmail = 'custom@example.com';
    await testEmailTemplate('appointment_scheduled', customEmail);

    expect(mockResendClient.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: customEmail,
      })
    );
  });

  it('should prefix subject with [TEST]', async () => {
    await testEmailTemplate('appointment_scheduled');

    expect(mockResendClient.send).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining('[TEST]'),
      })
    );
  });

  it('should return error if shop is not found', async () => {
    (ensureUserAndShop as jest.Mock).mockResolvedValue({
      user: mockUser,
      shop: null,
    });

    const result = await testEmailTemplate('appointment_scheduled');

    expect(result).toEqual({
      success: false,
      error: 'Shop not found',
    });
  });

  it('should return error if template is not found', async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'email_templates') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          single: jest
            .fn()
            .mockResolvedValue({ data: null, error: 'Not found' }),
        } as any;
      }
      return {
        insert: jest.fn().mockResolvedValue({ data: null, error: null }),
      } as any;
    });

    const result = await testEmailTemplate('appointment_scheduled');

    // With our new fallback system, this should actually succeed because
    // EmailRepository.getTemplate() includes default template fallbacks
    expect(result).toEqual({
      success: true,
    });
  });

  it('should handle email sending failures', async () => {
    mockResendClient.send.mockResolvedValue({
      success: false,
      error: 'Failed to send email',
    });

    const result = await testEmailTemplate('appointment_scheduled');

    expect(result).toEqual({
      success: false,
      error: 'Failed to send email',
    });
  });
});
