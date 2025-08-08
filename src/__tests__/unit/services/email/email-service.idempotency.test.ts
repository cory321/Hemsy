// Ensure email sending is enabled for these tests
jest.mock('@/lib/config/email.config', () => {
  const emailConfig = {
    sender: {
      address: 'test@threadfolio.com',
      name: 'Threadfolio Test',
      replyTo: undefined as string | undefined,
      get formatted() {
        return `${this.name} <${this.address}>`;
      },
    },
    features: {
      previewMode: true,
      enabled: true,
      logLevel: 'debug',
    },
    limits: { ratePerHour: 100 },
    urls: {
      app: 'http://localhost:3000',
      confirmation: 'http://localhost:3000/confirm',
    },
    dev: { overrideRecipient: 'test@threadfolio.com' },
  } as const;

  return {
    __esModule: true,
    emailConfig,
    resend: {
      emails: {
        send: jest
          .fn()
          .mockResolvedValue({ data: { id: 'mock-email-id' }, error: null }),
      },
    },
  };
});

import { EmailService } from '@/lib/services/email/email-service';

function makeSupabaseMocks(options: {
  emailLogsResult: any[];
  appointment: any;
}) {
  const emailLogsChain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    contains: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue({ data: options.emailLogsResult }),
  } as any;

  const appointmentsChain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest
      .fn()
      .mockResolvedValue({ data: options.appointment, error: null }),
  } as any;

  const from = jest.fn((table: string) => {
    if (table === 'email_logs') return emailLogsChain;
    if (table === 'appointments') return appointmentsChain;
    return emailLogsChain;
  });

  return { from, emailLogsChain, appointmentsChain };
}

describe('EmailService idempotency for reschedules', () => {
  const userId = 'owner-user-id';
  const appointmentId = 'appt-123';
  const previousTime = '2099-01-01 10:00';
  const newDate = '2099-01-02';
  const newStart = '11:00';

  const appointmentData = {
    id: appointmentId,
    status: 'pending',
    date: newDate,
    start_time: newStart,
    client: {
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'client@example.com',
      accept_email: true,
    },
    shop: {
      name: "Sarah's Alterations",
      seamstress_name: 'Sarah',
      email: 'shop@example.com',
    },
  };

  function makeEmailServiceWithMocks(emailLogsResult: any[]) {
    const mocks = makeSupabaseMocks({
      emailLogsResult,
      appointment: appointmentData,
    });
    const emailService = new EmailService({ from: mocks.from } as any, userId);
    // Patch dependencies
    (emailService as any).repository = {
      getTemplate: jest.fn().mockResolvedValue({
        id: 'tpl',
        subject: 'subj',
        body: 'body',
        is_default: true,
      }),
      createEmailLog: jest.fn().mockResolvedValue('log-1'),
      updateEmailLog: jest.fn().mockResolvedValue(undefined),
      getUserEmailSettings: jest
        .fn()
        .mockResolvedValue({ receive_appointment_notifications: true }),
      createConfirmationToken: jest.fn(),
    };
    (emailService as any).renderer = {
      render: jest.fn().mockImplementation((_template: any, _data: any) => ({
        subject: 'Rendered Subject',
        body: 'Rendered Body',
      })),
    };
    (emailService as any).resendClient = {
      send: jest.fn().mockResolvedValue({ success: true, messageId: 'msg-1' }),
    };
    return { emailService, mocks };
  }

  it('sends for a new reschedule (no prior identical key)', async () => {
    const { emailService } = makeEmailServiceWithMocks([]);

    const result = await emailService.sendAppointmentEmail(
      appointmentId,
      'appointment_rescheduled',
      { previous_time: previousTime }
    );

    expect(result.success).toBe(true);
    // createEmailLog called
    expect(
      (emailService as any).repository.createEmailLog
    ).toHaveBeenCalledTimes(1);
    const call = (emailService as any).repository.createEmailLog.mock
      .calls[0][0];
    expect(call.metadata.reschedule_key).toBe(
      `${previousTime}->${newDate} ${newStart}`
    );
    expect((emailService as any).resendClient.send).toHaveBeenCalled();
  });

  it('suppresses duplicate identical reschedule within 5 minutes', async () => {
    const nowIso = new Date().toISOString();
    const { emailService } = makeEmailServiceWithMocks([
      { id: 'existing-log', created_at: nowIso },
    ]);

    const result = await emailService.sendAppointmentEmail(
      appointmentId,
      'appointment_rescheduled',
      { previous_time: previousTime }
    );

    expect(result.success).toBe(true);
    expect(result.logId).toBe('existing-log');
    // no new log or sends
    expect(
      (emailService as any).repository.createEmailLog
    ).not.toHaveBeenCalled();
    expect((emailService as any).resendClient.send).not.toHaveBeenCalled();
  });

  it('allows resend after dedupe window passes', async () => {
    const old = new Date(Date.now() - 10 * 60 * 1000).toISOString(); // 10 minutes ago
    const { emailService } = makeEmailServiceWithMocks([
      { id: 'existing-log', created_at: old },
    ]);

    const result = await emailService.sendAppointmentEmail(
      appointmentId,
      'appointment_rescheduled',
      { previous_time: previousTime }
    );

    expect(result.success).toBe(true);
    // New log created because prior identical was older than window
    expect(
      (emailService as any).repository.createEmailLog
    ).toHaveBeenCalledTimes(1);
    expect((emailService as any).resendClient.send).toHaveBeenCalled();
  });
});
