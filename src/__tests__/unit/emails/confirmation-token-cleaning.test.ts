import {
	confirmAppointment,
	declineAppointment,
} from '@/lib/actions/emails/confirmation-tokens';
import { createClient } from '@/lib/supabase/server';
import { EmailRepository } from '@/lib/services/email/email-repository';

// Mock dependencies
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/services/email/email-repository');
jest.mock('next/navigation', () => ({
	notFound: jest.fn(() => {
		throw { digest: 'NEXT_NOT_FOUND' };
	}),
}));

const mockCreateClient = createClient as jest.MockedFunction<
	typeof createClient
>;
const mockEmailRepository = EmailRepository as jest.MockedClass<
	typeof EmailRepository
>;

describe('Confirmation Token Cleaning', () => {
	const validToken =
		'1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
	const appointmentId = 'test-appointment-id';

	let mockSupabase: any;
	let mockRepository: any;

	beforeEach(() => {
		jest.clearAllMocks();

		// Mock Supabase client
		mockSupabase = {
			from: jest.fn().mockReturnThis(),
			select: jest.fn().mockReturnThis(),
			update: jest.fn().mockReturnThis(),
			eq: jest.fn().mockReturnThis(),
			single: jest.fn().mockResolvedValue({ data: null, error: null }),
		};
		mockCreateClient.mockResolvedValue(mockSupabase);

		// Mock repository methods
		mockRepository = {
			validateToken: jest.fn(),
			useToken: jest.fn(),
			invalidateUnusedTokensForAppointment: jest.fn(),
		};
		mockEmailRepository.mockImplementation(() => mockRepository);
	});

	describe('confirmAppointment', () => {
		it('should clean tokens with Gmail tracking parameters', async () => {
			const tokenWithGmailParams = `${validToken}?source=gmail&ust=1758255235882000&usg=AOvVaw0M6QXYRJAQumouQyj1JgG-`;

			mockRepository.validateToken.mockResolvedValue({
				valid: true,
				appointmentId,
			});

			await confirmAppointment(tokenWithGmailParams);

			// Should validate with clean token only
			expect(mockRepository.validateToken).toHaveBeenCalledWith(validToken);
			expect(mockRepository.useToken).toHaveBeenCalledWith(validToken);
		});

		it('should clean tokens with query parameters', async () => {
			const tokenWithQueryParams = `${validToken}?utm_source=email&utm_campaign=appointment`;

			mockRepository.validateToken.mockResolvedValue({
				valid: true,
				appointmentId,
			});

			await confirmAppointment(tokenWithQueryParams);

			expect(mockRepository.validateToken).toHaveBeenCalledWith(validToken);
			expect(mockRepository.useToken).toHaveBeenCalledWith(validToken);
		});

		it('should clean tokens with ampersand parameters', async () => {
			const tokenWithAmpersand = `${validToken}&tracking=abc123`;

			mockRepository.validateToken.mockResolvedValue({
				valid: true,
				appointmentId,
			});

			await confirmAppointment(tokenWithAmpersand);

			expect(mockRepository.validateToken).toHaveBeenCalledWith(validToken);
			expect(mockRepository.useToken).toHaveBeenCalledWith(validToken);
		});

		it('should handle tokens with trailing whitespace', async () => {
			const tokenWithWhitespace = `${validToken}  \n`;

			mockRepository.validateToken.mockResolvedValue({
				valid: true,
				appointmentId,
			});

			await confirmAppointment(tokenWithWhitespace);

			expect(mockRepository.validateToken).toHaveBeenCalledWith(validToken);
			expect(mockRepository.useToken).toHaveBeenCalledWith(validToken);
		});

		it('should handle clean tokens without modification', async () => {
			mockRepository.validateToken.mockResolvedValue({
				valid: true,
				appointmentId,
			});

			await confirmAppointment(validToken);

			expect(mockRepository.validateToken).toHaveBeenCalledWith(validToken);
			expect(mockRepository.useToken).toHaveBeenCalledWith(validToken);
		});

		it('should throw 404 for invalid token format after cleaning', async () => {
			const invalidToken = 'invalid-token-format?utm_source=email';

			await expect(confirmAppointment(invalidToken)).rejects.toEqual({
				digest: 'NEXT_NOT_FOUND',
			});
		});
	});

	describe('declineAppointment', () => {
		it('should clean tokens with Gmail tracking parameters', async () => {
			const tokenWithGmailParams = `${validToken}?source=gmail&ust=1758255235882000&usg=AOvVaw0M6QXYRJAQumouQyj1JgG-`;

			mockRepository.validateToken.mockResolvedValue({
				valid: true,
				appointmentId,
			});

			mockSupabase.single.mockResolvedValue({
				data: {
					date: '2024-01-15',
					start_time: '14:00',
					shops: { owner_user_id: 'owner-123' },
				},
				error: null,
			});

			await declineAppointment(tokenWithGmailParams);

			expect(mockRepository.validateToken).toHaveBeenCalledWith(validToken);
			expect(mockRepository.useToken).toHaveBeenCalledWith(validToken);
		});

		it('should clean tokens with complex URL encoding', async () => {
			const tokenWithComplexParams = `${validToken}?q=http%3A%2F%2Flocalhost%3A3000%2Fconfirm%2F${validToken}&source=gmail`;

			mockRepository.validateToken.mockResolvedValue({
				valid: true,
				appointmentId,
			});

			mockSupabase.single.mockResolvedValue({
				data: {
					date: '2024-01-15',
					start_time: '14:00',
					shops: { owner_user_id: 'owner-123' },
				},
				error: null,
			});

			await declineAppointment(tokenWithComplexParams);

			expect(mockRepository.validateToken).toHaveBeenCalledWith(validToken);
			expect(mockRepository.useToken).toHaveBeenCalledWith(validToken);
		});
	});
});
