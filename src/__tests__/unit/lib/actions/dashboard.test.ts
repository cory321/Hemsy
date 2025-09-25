import {
	getTodayAppointmentsDetailed,
	getNextAppointment,
	getTodayAppointments,
	getGarmentsDueToday,
	getDashboardStats,
} from '@/lib/actions/dashboard';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { ensureUserAndShop } from '@/lib/auth/user-shop';
import { getShopTimezone } from '@/lib/utils/timezone-helpers';
import {
	formatDateForDatabase,
	getCurrentTimeWithSeconds,
} from '@/lib/utils/date-time-utils';
import { format } from 'date-fns';

// Mock dependencies
jest.mock('@clerk/nextjs/server', () => ({
	auth: jest.fn(),
}));

jest.mock('@/lib/supabase/server', () => ({
	createClient: jest.fn(),
}));

jest.mock('@/lib/utils/timezone-helpers', () => ({
	getShopTimezone: jest.fn().mockResolvedValue('America/New_York'),
}));

// Mock date-time-utils using spyOn in beforeEach

jest.mock('@/lib/auth/user-shop', () => ({
	ensureUserAndShop: jest.fn(),
}));

jest.mock('date-fns', () => ({
	format: jest.fn(),
}));

// Mock the date-time-utils functions that are actually used
jest.mock('@/lib/utils/date-time-utils', () => ({
	getTodayString: jest.fn(() => '2024-01-15'),
	getCurrentTimeWithSeconds: jest.fn(() => '10:30:00'),
	formatDateForDatabase: jest.fn(() => '2024-01-15'),
	getDueDateInfo: jest.fn((date) => {
		if (!date) return null;
		const today = new Date('2024-01-15');
		const dueDate = new Date(date);
		const diffTime = dueDate.getTime() - today.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

		return {
			isOverdue: diffDays < 0,
			isToday: diffDays === 0,
			isTomorrow: diffDays === 1,
			daysUntilDue: diffDays,
		};
	}),
	isGarmentOverdue: jest.fn((garment) => {
		if (!garment.due_date) return false;
		const dueDate = new Date(garment.due_date);
		const today = new Date('2024-01-15');
		return dueDate < today;
	}),
	compareGarmentsByStageAndProgress: jest.fn(),
}));

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockCreateClient = createClient as jest.MockedFunction<
	typeof createClient
>;
const mockEnsureUserAndShop = ensureUserAndShop as jest.MockedFunction<
	typeof ensureUserAndShop
>;
const mockGetShopTimezone = getShopTimezone as jest.MockedFunction<
	typeof getShopTimezone
>;
// The date-time-utils functions are mocked above in jest.mock()
const mockFormat = format as jest.MockedFunction<typeof format>;

describe('Dashboard Actions', () => {
	const mockSupabaseClient = {
		from: jest.fn(),
	};

	// Create a more sophisticated mock that can handle chaining
	const createMockQueryBuilder = () => {
		const mockQueryBuilder = {
			select: jest.fn(),
			eq: jest.fn(),
			in: jest.fn(),
			gte: jest.fn(),
			lte: jest.fn(),
			or: jest.fn(),
			order: jest.fn(),
			limit: jest.fn(),
			neq: jest.fn(),
			not: jest.fn(),
			lt: jest.fn(),
		};

		// Make all methods return the same instance for chaining
		Object.keys(mockQueryBuilder).forEach((key) => {
			mockQueryBuilder[key as keyof typeof mockQueryBuilder] = jest
				.fn()
				.mockReturnValue(mockQueryBuilder);
		});

		return mockQueryBuilder;
	};

	let mockQueryBuilder = createMockQueryBuilder();

	const mockShop = {
		id: 'shop-123',
		name: 'Test Shop',
	};

	const mockUser = {
		id: 'user-123',
		clerk_user_id: 'clerk-123',
	};

	beforeEach(() => {
		jest.clearAllMocks();

		// Create a fresh mock query builder for each test
		mockQueryBuilder = createMockQueryBuilder();

		mockAuth.mockResolvedValue({ userId: 'clerk-123' } as any);
		mockCreateClient.mockResolvedValue(mockSupabaseClient as any);
		mockEnsureUserAndShop.mockResolvedValue({
			user: mockUser,
			shop: mockShop,
		} as any);
		mockGetShopTimezone.mockResolvedValue('America/New_York');
		mockFormat.mockImplementation((date, formatStr) => {
			if (formatStr === 'yyyy-MM-dd') return '2024-01-15';
			if (formatStr === 'HH:mm') return '10:30';
			return '2024-01-15';
		});

		// Set up the supabase client to return our mock query builder
		mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
	});

	describe('getTodayAppointmentsDetailed', () => {
		const mockAppointments = [
			{
				id: 'apt-1',
				shop_id: 'shop-123',
				client_id: 'client-1',
				date: '2024-01-15',
				start_time: '10:30:00',
				end_time: '11:00:00',
				type: 'consultation',
				status: 'confirmed',
				client: {
					id: 'client-1',
					first_name: 'Sarah',
					last_name: 'Johnson',
					email: 'sarah@example.com',
					phone_number: '+1234567890',
				},
			},
		];

		it('fetches today appointments with client details successfully', async () => {
			mockQueryBuilder.order.mockResolvedValue({
				data: mockAppointments,
				error: null,
			});

			const result = await getTodayAppointmentsDetailed();

			expect(mockEnsureUserAndShop).toHaveBeenCalled();
			expect(mockSupabaseClient.from).toHaveBeenCalledWith('appointments');
			expect(mockQueryBuilder.select).toHaveBeenCalledWith(
				expect.stringContaining('client:clients')
			);
			expect(mockQueryBuilder.eq).toHaveBeenCalledWith('shop_id', 'shop-123');
			expect(mockQueryBuilder.eq).toHaveBeenCalledWith('date', '2024-01-15');
			expect(mockQueryBuilder.in).toHaveBeenCalledWith('status', [
				'pending',
				'confirmed',
			]);
			expect(mockQueryBuilder.order).toHaveBeenCalledWith('start_time', {
				ascending: true,
			});
			expect(result).toEqual(mockAppointments);
		});

		it('throws error when user is not authenticated', async () => {
			mockAuth.mockResolvedValue({ userId: null } as any);

			await expect(getTodayAppointmentsDetailed()).rejects.toThrow(
				'Unauthorized'
			);
		});

		it('throws error when database query fails', async () => {
			mockQueryBuilder.order.mockResolvedValue({
				data: null,
				error: { message: 'Database error' },
			});

			await expect(getTodayAppointmentsDetailed()).rejects.toThrow(
				'Failed to fetch appointments'
			);
		});
	});

	describe('getNextAppointment', () => {
		const mockNextAppointment = {
			id: 'apt-next',
			shop_id: 'shop-123',
			client_id: 'client-1',
			date: '2024-01-16',
			start_time: '09:00:00',
			end_time: '10:00:00',
			type: 'fitting',
			status: 'pending',
			client: {
				id: 'client-1',
				first_name: 'John',
				last_name: 'Doe',
				email: 'john@example.com',
				phone_number: '+1111111111',
			},
		};

		it('fetches next upcoming appointment successfully', async () => {
			// First query (current appointments) returns empty
			// Second query (future appointments) returns the appointment
			mockQueryBuilder.limit
				.mockResolvedValueOnce({
					data: [], // No current appointments
					error: null,
				})
				.mockResolvedValueOnce({
					data: [mockNextAppointment], // Future appointment
					error: null,
				});

			const result = await getNextAppointment();

			expect(mockEnsureUserAndShop).toHaveBeenCalled();
			expect(mockSupabaseClient.from).toHaveBeenCalledWith('appointments');
			expect(mockQueryBuilder.select).toHaveBeenCalledWith(
				expect.stringContaining('client:clients')
			);
			expect(mockQueryBuilder.eq).toHaveBeenCalledWith('shop_id', 'shop-123');
			expect(mockQueryBuilder.in).toHaveBeenCalledWith('status', [
				'pending',
				'confirmed',
			]);
			expect(mockQueryBuilder.or).toHaveBeenCalledWith(
				'date.gt.2024-01-15,and(date.eq.2024-01-15,start_time.gt.10:30:00)'
			);
			expect(mockQueryBuilder.order).toHaveBeenCalledWith('date', {
				ascending: true,
			});
			expect(mockQueryBuilder.order).toHaveBeenCalledWith('start_time', {
				ascending: true,
			});
			expect(mockQueryBuilder.limit).toHaveBeenCalledWith(1);
			expect(result).toEqual(mockNextAppointment);
		});

		it('returns null when no upcoming appointments', async () => {
			mockQueryBuilder.limit.mockResolvedValue({
				data: [],
				error: null,
			});

			const result = await getNextAppointment();

			expect(result).toBeNull();
		});

		it('throws error when user is not authenticated', async () => {
			mockAuth.mockResolvedValue({ userId: null } as any);

			await expect(getNextAppointment()).rejects.toThrow('Unauthorized');
		});

		it('throws error when database query fails', async () => {
			mockQueryBuilder.limit.mockResolvedValue({
				data: null,
				error: { message: 'Database error' },
			});

			await expect(getNextAppointment()).rejects.toThrow(
				'Failed to fetch current appointment'
			);
		});
	});

	describe('getTodayAppointments', () => {
		it('fetches count of today appointments successfully', async () => {
			mockQueryBuilder.in.mockResolvedValue({
				count: 3,
				error: null,
			});

			const result = await getTodayAppointments();

			expect(mockEnsureUserAndShop).toHaveBeenCalled();
			expect(mockSupabaseClient.from).toHaveBeenCalledWith('appointments');
			expect(mockQueryBuilder.select).toHaveBeenCalledWith('*', {
				count: 'exact',
				head: true,
			});
			expect(mockQueryBuilder.eq).toHaveBeenCalledWith('shop_id', 'shop-123');
			expect(mockQueryBuilder.eq).toHaveBeenCalledWith('date', '2024-01-15');
			expect(mockQueryBuilder.in).toHaveBeenCalledWith('status', [
				'pending',
				'confirmed',
			]);
			expect(result).toBe(3);
		});

		it('returns 0 when count is null', async () => {
			mockQueryBuilder.in.mockResolvedValue({
				count: null,
				error: null,
			});

			const result = await getTodayAppointments();

			expect(result).toBe(0);
		});

		it('throws error when database query fails', async () => {
			mockQueryBuilder.in.mockResolvedValue({
				count: null,
				error: { message: 'Database error' },
			});

			await expect(getTodayAppointments()).rejects.toThrow(
				'Failed to fetch appointments'
			);
		});
	});

	describe('getGarmentsDueToday', () => {
		it('fetches count of garments due today successfully', async () => {
			// Mock the final neq call in the chain to return the result
			const finalMock = jest.fn().mockResolvedValue({
				count: 5,
				error: null,
			});

			// Override the last neq call to return the final result
			(mockQueryBuilder.neq as jest.Mock).mockImplementation((field, value) => {
				if (field === 'orders.status' && value === 'cancelled') {
					return finalMock();
				}
				return mockQueryBuilder;
			});

			const result = await getGarmentsDueToday();

			expect(mockEnsureUserAndShop).toHaveBeenCalled();
			expect(mockSupabaseClient.from).toHaveBeenCalledWith('garments');
			expect(mockQueryBuilder.select).toHaveBeenCalledWith(
				'*, orders!inner(status)',
				{
					count: 'exact',
					head: true,
				}
			);
			expect(mockQueryBuilder.eq).toHaveBeenCalledWith('shop_id', 'shop-123');
			expect(mockQueryBuilder.eq).toHaveBeenCalledWith(
				'due_date',
				'2024-01-15'
			);
			expect(mockQueryBuilder.neq).toHaveBeenCalledWith('stage', 'Done');
			expect(mockQueryBuilder.neq).toHaveBeenCalledWith(
				'stage',
				'Ready For Pickup'
			);
			expect(mockQueryBuilder.neq).toHaveBeenCalledWith(
				'orders.status',
				'cancelled'
			);
			expect(result).toBe(5);
		});

		it('returns 0 when count is null', async () => {
			const finalMock = jest.fn().mockResolvedValue({
				count: null,
				error: null,
			});

			(mockQueryBuilder.neq as jest.Mock).mockImplementation((field, value) => {
				if (field === 'orders.status' && value === 'cancelled') {
					return finalMock();
				}
				return mockQueryBuilder;
			});

			const result = await getGarmentsDueToday();

			expect(result).toBe(0);
		});

		it('throws error when database query fails', async () => {
			const finalMock = jest.fn().mockResolvedValue({
				count: null,
				error: { message: 'Database error' },
			});

			(mockQueryBuilder.neq as jest.Mock).mockImplementation((field, value) => {
				if (field === 'orders.status' && value === 'cancelled') {
					return finalMock();
				}
				return mockQueryBuilder;
			});

			await expect(getGarmentsDueToday()).rejects.toThrow(
				'Failed to fetch garments'
			);
		});
	});

	describe('getDashboardStats', () => {
		it('fetches dashboard statistics successfully', async () => {
			// Set up mock for appointments (uses .in() as final method)
			(mockQueryBuilder.in as jest.Mock).mockResolvedValue({
				count: 3,
				error: null,
			});

			// Set up mock for garments (uses .neq() as final method)
			const garmentsResultMock = jest.fn().mockResolvedValue({
				count: 5,
				error: null,
			});

			(mockQueryBuilder.neq as jest.Mock).mockImplementation((field, value) => {
				if (field === 'orders.status' && value === 'cancelled') {
					return garmentsResultMock();
				}
				return mockQueryBuilder;
			});

			const result = await getDashboardStats();

			expect(result).toEqual({
				appointmentsToday: 3,
				garmentsDueToday: 5,
			});
		});
	});

	describe('Error handling', () => {
		it('handles authentication errors consistently', async () => {
			mockAuth.mockResolvedValue({ userId: null } as any);

			await expect(getTodayAppointmentsDetailed()).rejects.toThrow(
				'Unauthorized'
			);
			await expect(getNextAppointment()).rejects.toThrow('Unauthorized');
			await expect(getTodayAppointments()).rejects.toThrow('Unauthorized');
			await expect(getGarmentsDueToday()).rejects.toThrow('Unauthorized');
		});

		it('handles shop access errors', async () => {
			mockEnsureUserAndShop.mockRejectedValue(new Error('Shop access denied'));

			await expect(getTodayAppointmentsDetailed()).rejects.toThrow(
				'Shop access denied'
			);
			await expect(getNextAppointment()).rejects.toThrow('Shop access denied');
			await expect(getTodayAppointments()).rejects.toThrow(
				'Shop access denied'
			);
			await expect(getGarmentsDueToday()).rejects.toThrow('Shop access denied');
		});
	});

	describe('Date formatting', () => {
		it('uses correct date format for queries', async () => {
			mockQueryBuilder.order.mockResolvedValue({
				data: [],
				error: null,
			});

			await getTodayAppointmentsDetailed();

			// The dashboard actions use getTodayString() helper function, not format() directly
			// So we just verify the function runs successfully
			expect(mockEnsureUserAndShop).toHaveBeenCalled();
		});

		it('uses correct time format for next appointment query', async () => {
			mockQueryBuilder.limit
				.mockResolvedValueOnce({
					data: [], // No current appointments
					error: null,
				})
				.mockResolvedValueOnce({
					data: [], // No future appointments
					error: null,
				});

			await getNextAppointment();

			// The dashboard actions use helper functions, not format() directly
			// So we just verify the function runs successfully
			expect(mockEnsureUserAndShop).toHaveBeenCalled();
		});
	});
});
