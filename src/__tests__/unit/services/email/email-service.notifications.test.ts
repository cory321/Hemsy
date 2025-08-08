import { EmailService } from '@/lib/services/email/email-service';

describe('EmailService - seamstress notification preferences', () => {
  it('does not send seamstress notifications when preference is off', async () => {
    const mockSupabase: any = {};
    const emailService = new EmailService(mockSupabase, 'owner-user-id');

    // Patch private members
    (emailService as any).resendClient = {
      send: jest.fn().mockResolvedValue({ success: true, messageId: 'id' }),
    };
    (emailService as any).repository = {
      getUserEmailSettings: jest
        .fn()
        .mockResolvedValue({ receive_appointment_notifications: false }),
      getTemplate: jest
        .fn()
        .mockResolvedValue({ subject: 'subj', body: 'body' }),
    };

    const appointmentData = {
      client: { email: 'client@example.com' },
      shop: { email: 'shop@example.com' },
      date: '2099-01-01',
      start_time: '10:00',
    };

    const rendered = { subject: 'subj', body: 'body' };

    const results = await (emailService as any).sendEmails(
      'appointment_rescheduled',
      appointmentData,
      rendered
    );

    // One send to client, zero to seamstress
    expect((emailService as any).resendClient.send).toHaveBeenCalledTimes(1);
    expect(results).toHaveLength(1);
  });
});
