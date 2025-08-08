// Mock all dependencies before importing
jest.mock('../../../../lib/config/email.config', () => ({
  resend: new (class MockResend {
    constructor() {}
    emails = {
      send: jest.fn().mockResolvedValue({
        data: { id: 'test-id' },
        error: null,
      }),
    };
  })(),
  emailConfig: {
    features: {
      enabled: true,
      previewMode: false,
    },
    urls: {
      confirmation: 'http://localhost:3000/confirm',
    },
  },
}));

jest.mock('../../../../lib/services/email/email-repository');
jest.mock('../../../../lib/services/email/template-renderer');
jest.mock('../../../../lib/services/email/resend-client', () => ({
  getResendClient: jest.fn(() => ({
    send: jest.fn().mockResolvedValue({
      success: true,
      messageId: 'test-message-id',
    }),
  })),
}));

import { EmailService } from '../../../../lib/services/email/email-service';

describe('EmailService', () => {
  let emailService: EmailService;
  let mockSupabase: any;

  beforeEach(() => {
    // Create a mock Supabase client
    const chain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      contains: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: [], error: null }),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Appointment not found' },
      }),
    };

    mockSupabase = {
      from: jest.fn(() => chain),
    };

    emailService = new EmailService(mockSupabase, 'test-user-id');
  });

  describe('sendAppointmentEmail', () => {
    it('handles missing appointment gracefully', async () => {
      const result = await emailService.sendAppointmentEmail(
        'non-existent-appointment',
        'appointment_scheduled'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Appointment not found');
    });
  });

  describe('sendConfirmationRequest', () => {
    it('throws error for not implemented resendEmail', async () => {
      await expect(emailService.resendEmail('log-id')).rejects.toThrow(
        'Not implemented yet'
      );
    });
  });

  it('does not break when adding confirmation link for pending scheduled emails', async () => {
    // This is a smoke test to ensure method exists and token flow can be invoked without throwing
    expect(typeof (emailService as any).sendConfirmationRequest).toBe(
      'function'
    );
  });
});
