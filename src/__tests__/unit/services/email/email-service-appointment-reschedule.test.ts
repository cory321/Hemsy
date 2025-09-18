import { EmailService } from '@/lib/services/email/email-service';
import { EmailRepository } from '@/lib/services/email/email-repository';

// Mock dependencies
jest.mock('@/lib/services/email/email-repository');

// Mock ResendClient to capture email sends
const mockResendSend = jest.fn();
const mockResendClient = {
	send: mockResendSend,
};

jest.mock('@/lib/services/email/resend-client', () => ({
	ResendClient: jest.fn().mockImplementation(() => mockResendClient),
	getResendClient: () => mockResendClient,
}));

jest.mock('@/lib/config/email.config', () => ({
	resend: {
		emails: {
			send: jest.fn(),
		},
	},
	emailConfig: {
		features: {
			enabled: true,
			previewMode: false,
		},
		urls: {
			app: 'http://localhost:3000',
			confirmation: 'http://localhost:3000/confirm',
			decline: 'http://localhost:3000/decline',
		},
		sender: {
			address: 'test@example.com',
			name: 'Test Shop',
			formatted: 'Test Shop <test@example.com>',
		},
		limits: {
			ratePerHour: 100,
		},
	},
}));

// Mock ReactEmailRenderer to avoid dynamic import issues
jest.mock('@/lib/services/email/react-email-renderer', () => ({
	ReactEmailRenderer: jest.fn().mockImplementation(() => ({
		render: jest.fn().mockImplementation(async (emailType, data) => {
			return {
				subject: 'Test Subject',
				html: `<html><body>
					${data.confirmation_link || ''}
					${data.cancel_link || ''}
				</body></html>`,
				text: 'Test Text',
			};
		}),
	})),
}));

describe('EmailService - Appointment Reschedule Email Flow', () => {
	let emailService: EmailService;
	let mockSupabase: any;
	let mockRepository: any;

	beforeEach(() => {
		jest.clearAllMocks();
		mockResendSend.mockResolvedValue({ success: true, messageId: 'test-id' });

		// Create mock repository
		mockRepository = {
			createConfirmationToken: jest.fn().mockResolvedValue({
				token: 'mock-confirmation-token',
				appointment_id: 'test-appointment-id',
				expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
				used: false,
			}),
			getTemplate: jest.fn().mockResolvedValue({
				email_type: 'appointment_rescheduled',
				subject: 'Your appointment has been rescheduled',
				body: 'Your appointment has been rescheduled.',
			}),
			createEmailLog: jest.fn().mockResolvedValue({
				id: 'log-123',
				email_type: 'appointment_rescheduled',
				recipient_email: 'client@example.com',
				recipient_name: 'John Doe',
				subject: 'Your appointment has been rescheduled',
				body: 'Your appointment has been rescheduled',
				status: 'pending',
				attempts: 0,
				metadata: {},
			}),
			updateEmailLog: jest.fn().mockResolvedValue({ success: true }),
			getUserEmailSettings: jest.fn().mockResolvedValue(null),
		};

		// Mock the repository
		(EmailRepository as jest.Mock).mockImplementation(() => mockRepository);

		// Create mock Supabase client
		mockSupabase = {
			from: jest.fn().mockReturnThis(),
			select: jest.fn().mockReturnThis(),
			eq: jest.fn().mockReturnThis(),
			contains: jest.fn().mockReturnThis(),
			order: jest.fn().mockReturnThis(),
			limit: jest.fn().mockReturnThis(),
			single: jest.fn(),
		};

		emailService = new EmailService(mockSupabase, 'test-user-id');
	});

	describe('appointment_rescheduled email with tokens', () => {
		it('should generate confirm/decline tokens for pending appointments when rescheduled', async () => {
			// Mock appointment data
			const mockAppointment = {
				id: 'appt-123',
				status: 'pending',
				client: {
					email: 'client@example.com',
					first_name: 'John',
					last_name: 'Doe',
					accept_email: true,
				},
				shop: {
					name: 'Test Shop',
					email: 'shop@example.com',
					phone: '555-1234',
					address: '123 Test St',
					timezone: 'America/New_York',
				},
				date: '2025-09-25',
				start_time: '10:00',
				start_at: '2025-09-25T14:00:00Z', // UTC time
				end_at: '2025-09-25T15:00:00Z',
			};

			// Mock Supabase responses
			mockSupabase.single.mockResolvedValue({
				data: mockAppointment,
				error: null,
			});

			// Mock email logs check (no existing logs)
			mockSupabase.limit.mockResolvedValue({
				data: [],
				error: null,
			});

			// Mock token creation
			mockRepository.createConfirmationToken
				.mockResolvedValueOnce({ token: 'confirm-token-123' })
				.mockResolvedValueOnce({ token: 'decline-token-123' });

			// Send rescheduled email
			const result = await emailService.sendAppointmentEmail(
				'appt-123',
				'appointment_rescheduled',
				{ previous_time: '2025-09-20 10:00' }
			);

			// Verify success
			expect(result.success).toBe(true);

			// Verify two tokens were created (confirm and decline)
			expect(mockRepository.createConfirmationToken).toHaveBeenCalledTimes(2);
			expect(mockRepository.createConfirmationToken).toHaveBeenCalledWith(
				'appt-123'
			);

			// Verify the email was sent with the correct links
			expect(mockResendSend).toHaveBeenCalled();

			// Get the actual email content that was sent
			const sentEmailCalls = mockResendSend.mock.calls;
			// Find the client email (should be the first call)
			const clientEmailCall = sentEmailCalls.find((call) =>
				call[0].to.includes('client@example.com')
			);
			expect(clientEmailCall).toBeDefined();
			expect(clientEmailCall[0].html).toContain('confirm-token-123');
			expect(clientEmailCall[0].html).toContain('decline-token-123');
		});

		it('should NOT generate tokens for confirmed appointments when rescheduled', async () => {
			// Mock confirmed appointment
			const mockAppointment = {
				id: 'appt-123',
				status: 'confirmed', // Already confirmed
				client: {
					email: 'client@example.com',
					first_name: 'John',
					last_name: 'Doe',
					accept_email: true,
				},
				shop: {
					name: 'Test Shop',
					email: 'shop@example.com',
					timezone: 'America/New_York',
				},
				date: '2025-09-25',
				start_time: '10:00',
				start_at: '2025-09-25T14:00:00Z',
				end_at: '2025-09-25T15:00:00Z',
			};

			// Mock Supabase responses
			mockSupabase.single.mockResolvedValue({
				data: mockAppointment,
				error: null,
			});

			// Mock email logs check
			mockSupabase.limit.mockResolvedValue({
				data: [],
				error: null,
			});

			// Send rescheduled email
			const result = await emailService.sendAppointmentEmail(
				'appt-123',
				'appointment_rescheduled',
				{ previous_time: '2025-09-20 10:00' }
			);

			// Verify success
			expect(result.success).toBe(true);

			// Verify NO tokens were created
			expect(mockRepository.createConfirmationToken).not.toHaveBeenCalled();

			// Verify email was sent but without tokens
			expect(mockResendSend).toHaveBeenCalled();
			const sentEmailCalls = mockResendSend.mock.calls;
			const clientEmailCall = sentEmailCalls.find((call) =>
				call[0].to.includes('client@example.com')
			);
			expect(clientEmailCall).toBeDefined();
			expect(clientEmailCall[0].html).not.toContain('confirm-token');
			expect(clientEmailCall[0].html).not.toContain('decline-token');
		});

		it('should include both tokens in the email template data', async () => {
			// Mock appointment data
			const mockAppointment = {
				id: 'appt-123',
				status: 'pending',
				client: {
					email: 'client@example.com',
					first_name: 'John',
					last_name: 'Doe',
					accept_email: true,
				},
				shop: {
					name: 'Test Shop',
					email: 'shop@example.com',
					timezone: 'America/New_York',
				},
				date: '2025-09-25',
				start_time: '14:00',
				start_at: '2025-09-25T18:00:00Z',
				end_at: '2025-09-25T19:00:00Z',
			};

			// Mock Supabase responses
			mockSupabase.single.mockResolvedValue({
				data: mockAppointment,
				error: null,
			});

			mockSupabase.limit.mockResolvedValue({
				data: [],
				error: null,
			});

			// Track the token generation
			let confirmToken: string | undefined;
			let declineToken: string | undefined;

			mockRepository.createConfirmationToken
				.mockImplementationOnce(async () => {
					confirmToken = 'unique-confirm-token';
					return { token: confirmToken };
				})
				.mockImplementationOnce(async () => {
					declineToken = 'unique-decline-token';
					return { token: declineToken };
				});

			// Send rescheduled email
			await emailService.sendAppointmentEmail(
				'appt-123',
				'appointment_rescheduled',
				{ previous_time: '2025-09-20 10:00' }
			);

			// Verify both tokens were generated
			expect(confirmToken).toBe('unique-confirm-token');
			expect(declineToken).toBe('unique-decline-token');

			// Verify the email contains the correct links
			expect(mockResendSend).toHaveBeenCalled();
			const sentEmailCalls = mockResendSend.mock.calls;
			const clientEmailCall = sentEmailCalls.find((call) =>
				call[0].to.includes('client@example.com')
			);
			expect(clientEmailCall).toBeDefined();

			expect(clientEmailCall[0].html).toContain(
				'http://localhost:3000/confirm/unique-confirm-token'
			);
			expect(clientEmailCall[0].html).toContain(
				'http://localhost:3000/decline/unique-decline-token'
			);
		});
	});
});
