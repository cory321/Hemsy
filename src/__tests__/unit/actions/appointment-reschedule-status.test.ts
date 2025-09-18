import { updateAppointment } from '@/lib/actions/appointments';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';

// Mock dependencies
jest.mock('@/lib/supabase/server');
jest.mock('@clerk/nextjs/server');
jest.mock('@/lib/services/email/email-service');
jest.mock('@/lib/services/email/email-repository');
jest.mock('@/lib/utils/timezone-helpers', () => ({
	getShopTimezone: jest.fn().mockResolvedValue('America/New_York'),
}));

const mockSupabase = {
	from: jest.fn().mockReturnThis(),
	select: jest.fn().mockReturnThis(),
	insert: jest.fn().mockReturnThis(),
	update: jest.fn().mockReturnThis(),
	eq: jest.fn().mockReturnThis(),
	is: jest.fn().mockReturnThis(),
	single: jest.fn().mockReturnThis(),
	limit: jest.fn().mockReturnThis(),
	order: jest.fn().mockReturnThis(),
	contains: jest.fn().mockReturnThis(),
	rpc: jest.fn().mockResolvedValue({ data: false, error: null }),
};

describe('Appointment Reschedule Status Management', () => {
	beforeEach(() => {
		jest.clearAllMocks();

		// Reset mockSupabase to ensure chaining works properly
		mockSupabase.from.mockReturnThis();
		mockSupabase.select.mockReturnThis();
		mockSupabase.insert.mockReturnThis();
		mockSupabase.update.mockReturnThis();
		mockSupabase.eq.mockReturnThis();
		mockSupabase.is.mockReturnThis();
		mockSupabase.limit.mockReturnThis();
		mockSupabase.order.mockReturnThis();
		mockSupabase.contains.mockReturnThis();

		const mockCreateClient = jest.mocked(createClient);
		mockCreateClient.mockResolvedValue(mockSupabase as any);
		const mockAuth = jest.mocked(auth);
		(mockAuth as any).mockReturnValue({ userId: 'test-user-id' });
	});

	describe('Status reset to pending on reschedule', () => {
		it.each([
			['confirmed', 'pending'],
			['declined', 'pending'],
			['no_show', 'pending'],
			['pending', 'pending'],
		])(
			'should change status from %s to %s when rescheduling',
			async (currentStatus, expectedStatus) => {
				// Mock existing appointment with various statuses
				const mockAppointment = {
					id: '123e4567-e89b-12d3-a456-426614174000',
					shop_id: '123e4567-e89b-12d3-a456-426614174001',
					date: '2025-09-20',
					start_time: '10:00',
					end_time: '11:00',
					status: currentStatus,
					shops: {
						owner_user_id: '123e4567-e89b-12d3-a456-426614174002',
						users: { clerk_user_id: 'test-user-id' },
					},
				};

				// Mock fetching the appointment
				mockSupabase.single.mockResolvedValueOnce({
					data: mockAppointment,
					error: null,
				});

				// Mock the update result - single is called after update
				mockSupabase.single.mockResolvedValueOnce({
					data: {
						...mockAppointment,
						date: '2025-09-25',
						status: expectedStatus,
					},
					error: null,
				});

				// Reschedule the appointment (changing date)
				const result = await updateAppointment({
					id: '123e4567-e89b-12d3-a456-426614174000',
					date: '2025-09-25',
				});

				// Verify the update was called with status = 'pending'
				expect(mockSupabase.update).toHaveBeenCalledWith(
					expect.objectContaining({
						date: '2025-09-25',
						status: 'pending',
					})
				);

				expect(result.status).toBe(expectedStatus);
			}
		);

		it('should set status to pending when only time is changed', async () => {
			const mockAppointment = {
				id: '123e4567-e89b-12d3-a456-426614174000',
				shop_id: '123e4567-e89b-12d3-a456-426614174001',
				date: '2025-09-20',
				start_time: '10:00',
				end_time: '11:00',
				status: 'confirmed',
				shops: {
					owner_user_id: '123e4567-e89b-12d3-a456-426614174002',
					users: { clerk_user_id: 'test-user-id' },
				},
			};

			// Mock fetching the appointment
			mockSupabase.single.mockResolvedValueOnce({
				data: mockAppointment,
				error: null,
			});

			// Mock the update result
			mockSupabase.single.mockResolvedValueOnce({
				data: { ...mockAppointment, start_time: '14:00', status: 'pending' },
				error: null,
			});

			// Reschedule the appointment (changing time only)
			await updateAppointment({
				id: '123e4567-e89b-12d3-a456-426614174000',
				startTime: '14:00',
			});

			// Verify the update was called with status = 'pending'
			expect(mockSupabase.update).toHaveBeenCalledWith(
				expect.objectContaining({
					start_time: '14:00',
					status: 'pending',
				})
			);
		});

		it('should not change status when explicitly canceling during reschedule', async () => {
			const mockAppointment = {
				id: '123e4567-e89b-12d3-a456-426614174000',
				shop_id: '123e4567-e89b-12d3-a456-426614174001',
				date: '2025-09-20',
				start_time: '10:00',
				end_time: '11:00',
				status: 'confirmed',
				shops: {
					owner_user_id: '123e4567-e89b-12d3-a456-426614174002',
					users: { clerk_user_id: 'test-user-id' },
				},
			};

			// Mock fetching the appointment
			mockSupabase.single.mockResolvedValueOnce({
				data: mockAppointment,
				error: null,
			});

			// Mock the update result
			mockSupabase.single.mockResolvedValueOnce({
				data: { ...mockAppointment, status: 'canceled' },
				error: null,
			});

			// Cancel the appointment (even though date is also changing)
			await updateAppointment({
				id: '123e4567-e89b-12d3-a456-426614174000',
				date: '2025-09-25',
				status: 'canceled',
			});

			// Verify the update was called with status = 'canceled'
			expect(mockSupabase.update).toHaveBeenCalledWith(
				expect.objectContaining({
					status: 'canceled',
				})
			);
		});

		it('should not change status when only updating notes', async () => {
			const mockAppointment = {
				id: '123e4567-e89b-12d3-a456-426614174000',
				shop_id: '123e4567-e89b-12d3-a456-426614174001',
				date: '2025-09-20',
				start_time: '10:00',
				end_time: '11:00',
				status: 'confirmed',
				shops: {
					owner_user_id: '123e4567-e89b-12d3-a456-426614174002',
					users: { clerk_user_id: 'test-user-id' },
				},
			};

			// Mock fetching the appointment
			mockSupabase.single.mockResolvedValueOnce({
				data: mockAppointment,
				error: null,
			});

			// Mock the update result
			mockSupabase.single.mockResolvedValueOnce({
				data: { ...mockAppointment, notes: 'Updated notes' },
				error: null,
			});

			// Update only notes (not a reschedule)
			await updateAppointment({
				id: '123e4567-e89b-12d3-a456-426614174000',
				notes: 'Updated notes',
			});

			// Verify the update was NOT called with status change
			expect(mockSupabase.update).toHaveBeenCalledWith(
				expect.not.objectContaining({
					status: expect.any(String),
				})
			);
		});

		it('should allow explicit status update without date/time change', async () => {
			const mockAppointment = {
				id: '123e4567-e89b-12d3-a456-426614174000',
				shop_id: '123e4567-e89b-12d3-a456-426614174001',
				date: '2025-09-20',
				start_time: '10:00',
				end_time: '11:00',
				status: 'pending',
				shops: {
					owner_user_id: '123e4567-e89b-12d3-a456-426614174002',
					users: { clerk_user_id: 'test-user-id' },
				},
			};

			// Mock fetching the appointment
			mockSupabase.single.mockResolvedValueOnce({
				data: mockAppointment,
				error: null,
			});

			// Mock the update result
			mockSupabase.single.mockResolvedValueOnce({
				data: { ...mockAppointment, status: 'no_show' },
				error: null,
			});

			// Update status to no_show (not a reschedule)
			await updateAppointment({
				id: '123e4567-e89b-12d3-a456-426614174000',
				status: 'no_show',
			});

			// Verify the update was called with the explicit status
			expect(mockSupabase.update).toHaveBeenCalledWith(
				expect.objectContaining({
					status: 'no_show',
				})
			);
		});
	});

	describe('Email notifications with correct status', () => {
		it('should send rescheduled email with pending status tokens', async () => {
			const mockAppointment = {
				id: '123e4567-e89b-12d3-a456-426614174000',
				shop_id: '123e4567-e89b-12d3-a456-426614174001',
				date: '2025-09-20',
				start_time: '10:00',
				end_time: '11:00',
				status: 'confirmed', // Previously confirmed
				client: {
					email: 'client@example.com',
					accept_email: true,
				},
				shops: {
					owner_user_id: '123e4567-e89b-12d3-a456-426614174002',
					users: { clerk_user_id: 'test-user-id' },
				},
			};

			// Mock fetching the appointment
			mockSupabase.single.mockResolvedValueOnce({
				data: mockAppointment,
				error: null,
			});

			// Mock the update result with pending status
			mockSupabase.single.mockResolvedValueOnce({
				data: { ...mockAppointment, date: '2025-09-25', status: 'pending' },
				error: null,
			});

			// Mock EmailService
			const EmailService =
				require('@/lib/services/email/email-service').EmailService;
			const mockSendEmail = jest.fn().mockResolvedValue({ success: true });
			EmailService.mockImplementation(() => ({
				sendAppointmentEmail: mockSendEmail,
			}));

			// Mock EmailRepository
			const EmailRepository =
				require('@/lib/services/email/email-repository').EmailRepository;
			EmailRepository.mockImplementation(() => ({
				invalidateUnusedTokensForAppointment: jest
					.fn()
					.mockResolvedValue(undefined),
			}));

			// Reschedule the appointment
			await updateAppointment({
				id: '123e4567-e89b-12d3-a456-426614174000',
				date: '2025-09-25',
				sendEmail: true,
			});

			// Verify email was sent for appointment_rescheduled
			expect(mockSendEmail).toHaveBeenCalledWith(
				'123e4567-e89b-12d3-a456-426614174000',
				'appointment_rescheduled',
				expect.any(Object)
			);

			// The email service should receive an appointment with pending status
			// which will trigger token generation
		});
	});
});
