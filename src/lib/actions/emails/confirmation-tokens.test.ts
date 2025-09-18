import { confirmAppointment } from './confirmation-tokens';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

jest.mock('@/lib/supabase/server');
jest.mock('next/navigation', () => ({
	notFound: jest.fn(),
}));

// Minimal mocks for repository methods via query stubs
const chainable = () => ({
	select: jest.fn().mockReturnThis(),
	eq: jest.fn().mockReturnThis(),
	update: jest.fn().mockReturnThis(),
	single: jest.fn(),
});

describe('confirmAppointment (server action)', () => {
	const mockCreateSupabase = createSupabaseClient as jest.MockedFunction<
		typeof createSupabaseClient
	>;
	const mockNotFound = notFound as jest.MockedFunction<typeof notFound>;

	beforeEach(() => {
		jest.clearAllMocks();
		mockCreateSupabase.mockResolvedValue({
			from: jest.fn(() => chainable()),
		} as any);
		// Mock notFound to throw an error that gets caught and handled
		mockNotFound.mockImplementation(() => {
			const error = new Error('Not Found');
			(error as any).digest = 'NEXT_NOT_FOUND';
			throw error;
		});
	});

	it('returns error for invalid token format', async () => {
		// The function should throw a notFound error for invalid tokens
		// which should be re-thrown and not caught by the outer try-catch
		await expect(confirmAppointment('not-a-64-char-hex')).rejects.toThrow(
			'Not Found'
		);
	});
});
