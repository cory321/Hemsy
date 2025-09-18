import { EmailService } from '@/lib/services/email/email-service';
import { ReactEmailRenderer } from '@/lib/services/email/react-email-renderer';
import { EmailRepository } from '@/lib/services/email/email-repository';

// Mock the dependencies
jest.mock('@/lib/services/email/react-email-renderer');
jest.mock('@/lib/services/email/email-repository');
jest.mock('@/lib/services/email/resend-client');

describe('Seamstress Email HTML Rendering', () => {
	let emailService: EmailService;
	let mockSupabase: any;
	let mockRepository: any;
	let mockResendClient: any;

	beforeEach(() => {
		// Create mock Supabase client
		mockSupabase = {
			from: jest.fn().mockReturnThis(),
			select: jest.fn().mockReturnThis(),
			eq: jest.fn().mockReturnThis(),
			contains: jest.fn().mockReturnThis(),
			order: jest.fn().mockReturnThis(),
			limit: jest.fn().mockReturnThis(),
			single: jest.fn().mockResolvedValue({
				data: {
					id: 'test-appointment-id',
					client: {
						first_name: 'John',
						last_name: 'Doe',
						email: 'john@example.com',
						accept_email: true,
					},
					shop: {
						name: 'Test Shop',
						email: 'seamstress@testshop.com',
						seamstress_name: 'Jane Seamstress',
					},
					start_time: '2024-01-15T14:00:00Z',
					status: 'confirmed',
				},
				error: null,
			}),
		};

		// Create mock repository
		mockRepository = {
			getUserEmailSettings: jest.fn().mockResolvedValue({
				receive_appointment_notifications: true,
			}),
			getTemplate: jest.fn().mockResolvedValue({
				subject: 'Appointment rescheduled: {client_name}',
				body: 'Hi {seamstress_name},\n\n{client_name} has rescheduled their appointment.',
			}),
			createEmailLog: jest.fn().mockResolvedValue('log-id'),
			updateEmailLog: jest.fn().mockResolvedValue(undefined),
		};

		// Create mock resend client
		mockResendClient = {
			send: jest
				.fn()
				.mockResolvedValue({ success: true, messageId: 'test-message-id' }),
		};

		// Mock the repository constructor
		(EmailRepository as jest.Mock).mockImplementation(() => mockRepository);

		emailService = new EmailService(mockSupabase, 'test-user-id');

		// Replace the service's dependencies with mocks
		(emailService as any).repository = mockRepository;
		(emailService as any).resendClient = mockResendClient;

		// Mock the checkDeliveryConstraints method to always allow email sending
		jest
			.spyOn(emailService as any, 'checkDeliveryConstraints')
			.mockResolvedValue({
				shouldSend: true,
			});

		// Mock the formatAppointmentTime method to avoid date parsing issues
		jest
			.spyOn(emailService as any, 'formatAppointmentTime')
			.mockImplementation((...args: unknown[]): string => {
				const dateString = args[0] as string;
				if (dateString && dateString.includes('2024-01-15')) {
					return 'Monday, January 15 at 2:00 PM';
				}
				if (dateString && dateString.includes('2024-01-14')) {
					return 'Sunday, January 14 at 2:00 PM';
				}
				return 'Mock formatted date';
			});

		// Reset all mocks
		jest.clearAllMocks();
	});

	it('should use React email renderer for seamstress notifications and include HTML', async () => {
		// Mock the React email renderer to return both HTML and text
		const mockRender = jest.fn().mockResolvedValue({
			subject: 'Appointment rescheduled: John Doe',
			html: '<html><body><h1>Appointment Rescheduled</h1><p>John Doe has rescheduled their appointment.</p></body></html>',
			text: 'Appointment Rescheduled\n\nJohn Doe has rescheduled their appointment.',
		});

		// Replace the service's React email renderer with our mock
		(emailService as any).reactEmailRenderer = { render: mockRender };

		// Test sending a rescheduled appointment email
		await emailService.sendAppointmentEmail(
			'test-appointment-id',
			'appointment_rescheduled',
			{ previous_time: '2024-01-14T14:00:00Z' }
		);

		// Verify that the React email renderer was called for seamstress email
		expect(mockRender).toHaveBeenCalledWith(
			'appointment_rescheduled_seamstress',
			expect.objectContaining({
				client_name: 'John Doe',
				seamstress_name: 'Your Seamstress',
				shop_name: 'Test Shop',
			})
		);

		// Verify that the resend client was called with HTML content
		expect(mockResendClient.send).toHaveBeenCalledWith(
			expect.objectContaining({
				to: 'test@hemsy.app',
				subject: 'Appointment rescheduled: John Doe',
				text: 'Appointment Rescheduled\n\nJohn Doe has rescheduled their appointment.',
				html: '<html><body><h1>Appointment Rescheduled</h1><p>John Doe has rescheduled their appointment.</p></body></html>',
			})
		);
	});

	it('should fall back to traditional templates if React email renderer fails', async () => {
		// Mock the React email renderer to throw an error
		const mockRender = jest
			.fn()
			.mockRejectedValue(new Error('React email rendering failed'));

		// Replace the service's React email renderer with our mock
		(emailService as any).reactEmailRenderer = { render: mockRender };

		// Test sending a rescheduled appointment email
		await emailService.sendAppointmentEmail(
			'test-appointment-id',
			'appointment_rescheduled',
			{ previous_time: '2024-01-14T14:00:00Z' }
		);

		// Verify that the traditional template was used as fallback
		expect(mockRepository.getTemplate).toHaveBeenCalledWith(
			'appointment_rescheduled_seamstress'
		);

		// Verify that the resend client was called with only text (no HTML)
		expect(mockResendClient.send).toHaveBeenCalledWith(
			expect.objectContaining({
				to: 'test@hemsy.app',
				subject: 'Appointment rescheduled: John Doe',
				text: expect.stringContaining('Hi Your Seamstress'),
				// Should not have HTML property
			})
		);

		// Verify HTML property is not present in the fallback
		const sendCall = mockResendClient.send.mock.calls[0][0];
		expect(sendCall).not.toHaveProperty('html');
	});
});
