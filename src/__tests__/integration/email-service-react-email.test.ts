import { EmailService } from '@/lib/services/email/email-service';
import { createClient } from '@supabase/supabase-js';

// Mock the Supabase client and Resend
jest.mock('@supabase/supabase-js');
jest.mock('resend');

const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        eq: jest.fn(() => ({
          contains: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => ({
                single: jest
                  .fn()
                  .mockResolvedValue({ data: null, error: null }),
              })),
            })),
          })),
        })),
      })),
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn().mockResolvedValue({
          data: { id: 'test-log-id' },
          error: null,
        }),
      })),
    })),
  })),
};

const mockEmailRepository = {
  getTemplate: jest.fn().mockResolvedValue({
    id: 'test-template-id',
    email_type: 'appointment_scheduled',
    subject: 'Test Subject',
    body: 'Test Body',
    is_default: true,
  }),
  createEmailLog: jest.fn().mockResolvedValue('test-log-id'),
  updateEmailLog: jest.fn().mockResolvedValue(undefined),
  getUserEmailSettings: jest.fn().mockResolvedValue(null),
  createConfirmationToken: jest.fn().mockResolvedValue({
    token: 'test-token',
  }),
};

const mockResendClient = {
  send: jest.fn().mockResolvedValue({
    success: true,
    messageId: 'test-message-id',
  }),
};

// Mock the dependencies
jest.mock('@/lib/services/email/email-repository', () => ({
  EmailRepository: jest.fn().mockImplementation(() => mockEmailRepository),
}));

jest.mock('@/lib/services/email/resend-client', () => ({
  getResendClient: () => mockResendClient,
  ResendClient: jest.fn().mockImplementation(() => mockResendClient),
}));

describe.skip('EmailService with React Email Integration', () => {
  let emailService: EmailService;
  const userId = 'test-user-id';

  beforeEach(() => {
    jest.clearAllMocks();
    emailService = new EmailService(mockSupabaseClient as any, userId);

    // Mock fetchAppointmentData
    (emailService as any).fetchAppointmentData = jest.fn().mockResolvedValue({
      id: 'test-appointment-id',
      client: {
        id: 'test-client-id',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '(555) 123-4567',
        accept_email: true,
      },
      shop: {
        id: 'test-shop-id',
        name: 'Test Shop',
        business_name: 'Test Shop',
        email: 'shop@example.com',
        phone: '(555) 987-6543',
        address: '123 Main St, City, ST 12345',
      },
      date: '2024-03-15',
      start_time: '14:00:00',
      status: 'pending',
    });

    // Mock checkDeliveryConstraints
    (emailService as any).checkDeliveryConstraints = jest
      .fn()
      .mockResolvedValue({
        shouldSend: true,
        reason: null,
      });
  });

  describe('React Email rendering', () => {
    it('uses React Email for supported email types', async () => {
      const result = await emailService.sendAppointmentEmail(
        'test-appointment-id',
        'appointment_scheduled'
      );

      expect(result.success).toBe(true);
      expect(mockResendClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'john@example.com',
          subject: 'Your appointment is scheduled with Test Shop',
          text: expect.any(String),
          html: expect.stringContaining('<html'), // Should contain HTML
        })
      );
    });

    it('falls back to traditional templates for unsupported email types', async () => {
      const result = await emailService.sendAppointmentEmail(
        'test-appointment-id',
        'appointment_no_show'
      );

      expect(result.success).toBe(true);
      expect(mockResendClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'john@example.com',
          subject: 'Test Subject', // From mocked template
          text: 'Test Body', // From mocked template
          html: undefined, // No HTML for traditional templates
        })
      );
    });

    it('includes confirmation and cancel links for pending appointments', async () => {
      const result = await emailService.sendAppointmentEmail(
        'test-appointment-id',
        'appointment_scheduled'
      );

      expect(result.success).toBe(true);
      expect(mockEmailRepository.createConfirmationToken).toHaveBeenCalledTimes(
        2
      );
      expect(mockResendClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('test-token'), // Should contain token in HTML
        })
      );
    });

    it('handles React Email rendering errors gracefully', async () => {
      // Mock ReactEmailRenderer to throw an error
      const originalConsoleWarn = console.warn;
      console.warn = jest.fn();

      // Force an error in React Email rendering
      jest.doMock('@/lib/services/email/react-email-renderer', () => ({
        ReactEmailRenderer: jest.fn().mockImplementation(() => ({
          render: jest.fn().mockRejectedValue(new Error('React Email error')),
        })),
      }));

      const result = await emailService.sendAppointmentEmail(
        'test-appointment-id',
        'appointment_scheduled'
      );

      expect(result.success).toBe(true);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('React Email rendering failed'),
        expect.any(Error)
      );

      // Should fallback to traditional template
      expect(mockResendClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Test Subject',
          text: 'Test Body',
          html: undefined,
        })
      );

      console.warn = originalConsoleWarn;
    });
  });

  describe('Email content validation', () => {
    it('generates proper email content with React Email', async () => {
      await emailService.sendAppointmentEmail(
        'test-appointment-id',
        'appointment_reminder'
      );

      const sendCall = mockResendClient.send.mock.calls[0][0];

      expect(sendCall.subject).toBe('Appointment reminder: Test Shop');
      expect(sendCall.text).toContain('John Doe');
      expect(sendCall.text).toContain('Test Shop');
      expect(sendCall.html).toContain('<html');
      expect(sendCall.html).toContain('John Doe');
      expect(sendCall.html).toContain('Test Shop');
    });

    it('includes proper shop information in emails', async () => {
      await emailService.sendAppointmentEmail(
        'test-appointment-id',
        'appointment_scheduled'
      );

      const sendCall = mockResendClient.send.mock.calls[0][0];

      expect(sendCall.html).toContain('shop@example.com');
      expect(sendCall.html).toContain('(555) 987-6543');
      expect(sendCall.html).toContain('123 Main St, City, ST 12345');
    });
  });
});
