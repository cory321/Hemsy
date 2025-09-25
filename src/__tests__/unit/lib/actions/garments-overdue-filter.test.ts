import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { getGarmentsPaginated } from '@/lib/actions/garments-paginated';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';

// Mock dependencies
jest.mock('@/lib/supabase/server');
jest.mock('@clerk/nextjs/server');
jest.mock('@/lib/auth/user-shop', () => ({
	ensureUserAndShop: jest.fn(),
}));

jest.mock('@/lib/utils/timezone-helpers', () => ({
	getShopTimezone: jest.fn(() => Promise.resolve('America/New_York')),
}));

// Import after mocking
const { ensureUserAndShop } = require('@/lib/auth/user-shop');

const mockSupabase = {
	from: jest.fn(),
	auth: {
		getUser: jest.fn(),
	},
};

const mockAuth = {
	userId: 'test-user-id',
};

const mockShop = {
	id: '84dcc45a-3a63-49c9-bca0-d0fddf0f1eb6', // Valid UUID
	name: 'Test Shop',
};

const mockEnsureUserAndShop = ensureUserAndShop as jest.MockedFunction<
	typeof ensureUserAndShop
>;
const mockCreateClient = createClient as jest.MockedFunction<
	typeof createClient
>;
const mockAuthFunction = auth as jest.MockedFunction<typeof auth>;

describe('getGarmentsPaginated - Overdue Filtering', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockCreateClient.mockResolvedValue(mockSupabase as any);
		mockAuthFunction.mockResolvedValue(mockAuth as any);
		mockEnsureUserAndShop.mockResolvedValue({
			user: { id: 'test-user-id' },
			shop: mockShop,
		} as any);
	});

	it('should over-fetch when filtering overdue garments', async () => {
		// Mock the garments table query chain
		const mockQuery = {
			select: jest.fn().mockReturnThis(),
			eq: jest.fn().mockReturnThis(),
			neq: jest.fn().mockReturnThis(),
			lt: jest.fn().mockReturnThis(),
			not: jest.fn().mockReturnThis(),
			order: jest.fn().mockReturnThis(),
			limit: jest.fn().mockReturnThis(),
			data: [],
			error: null,
			count: 0,
		};

		mockSupabase.from.mockReturnValue(mockQuery);

		// Call the function with overdue filter
		await getGarmentsPaginated({
			shopId: mockShop.id,
			filter: 'overdue',
			limit: 20,
			sortField: 'created_at',
			sortOrder: 'desc',
		});

		// Verify over-fetching is applied (2x the limit)
		expect(mockQuery.limit).toHaveBeenCalledWith(40); // 20 * 2

		// Verify the basic overdue conditions are still applied
		expect(mockQuery.lt).toHaveBeenCalled();
		expect(mockQuery.not).toHaveBeenCalledWith(
			'stage',
			'in',
			'("Done","Ready For Pickup")'
		);
	});

	it('should filter out garments with all services completed', async () => {
		// Mock 40 garments, including some that should be filtered out
		const mockGarments = [
			// Garment with all services completed (should be filtered out)
			{
				id: 'garment-all-complete',
				name: 'Garment All Complete',
				stage: 'In Progress',
				due_date: '2025-08-25',
				created_at: '2025-08-25T22:00:00Z',
				garment_services: [
					{ id: 'service-1', is_done: true, is_removed: false },
					{ id: 'service-2', is_done: true, is_removed: false },
				],
				orders: {
					clients: {
						first_name: 'Test',
						last_name: 'Client',
					},
				},
			},
			// Garment in Ready For Pickup stage (should be filtered out by initial query)
			{
				id: 'garment-ready',
				name: 'Garment Ready',
				stage: 'Ready For Pickup',
				due_date: '2025-08-25',
				created_at: '2025-08-25T21:00:00Z',
				garment_services: [
					{ id: 'service-3', is_done: false, is_removed: false },
				],
				orders: {
					clients: {
						first_name: 'Test',
						last_name: 'Client',
					},
				},
			},
			// Garment with no services (IS overdue based on the logic)
			{
				id: 'garment-no-services',
				name: 'Garment No Services',
				stage: 'New',
				due_date: '2025-08-25',
				created_at: '2025-08-25T23:00:00Z',
				garment_services: [],
				orders: {
					clients: {
						first_name: 'Test',
						last_name: 'Client',
					},
				},
			},
			// 19 truly overdue garments (plus the no-services one makes 20)
			...Array.from({ length: 19 }, (_, i) => ({
				id: `garment-${i}`,
				name: `Garment ${i}`,
				stage: 'New',
				due_date: '2025-08-25',
				created_at: new Date(2025, 7, 25, 20 - i).toISOString(),
				garment_services: [
					{ id: `service-${i}`, is_done: false, is_removed: false },
				],
				orders: {
					clients: {
						first_name: 'Test',
						last_name: 'Client',
					},
				},
			})),
		];

		// Note: The 'Ready For Pickup' garment should not be in this list
		// as it's filtered out at the database level
		const mockDataWithoutReadyStage = mockGarments.filter(
			(g) => g.stage !== 'Ready For Pickup'
		);

		const mockQuery = {
			select: jest.fn().mockReturnThis(),
			eq: jest.fn().mockReturnThis(),
			neq: jest.fn().mockReturnThis(),
			lt: jest.fn().mockReturnThis(),
			not: jest.fn().mockReturnThis(),
			order: jest.fn().mockReturnThis(),
			limit: jest.fn().mockReturnThis(),
			data: mockDataWithoutReadyStage,
			error: null,
			count: 25,
		};

		mockSupabase.from.mockReturnValue(mockQuery);

		const result = await getGarmentsPaginated({
			shopId: mockShop.id,
			filter: 'overdue',
			limit: 20,
			sortField: 'created_at',
			sortOrder: 'desc',
		});

		// Should return exactly 20 garments after filtering
		expect(result.garments).toHaveLength(20);
		// Should not include the garment with all services completed
		expect(
			result.garments.find((g) => g.id === 'garment-all-complete')
		).toBeUndefined();
		// Should include the garment with no services (it IS overdue)
		expect(
			result.garments.find((g) => g.id === 'garment-no-services')
		).toBeDefined();
		// Should not include Ready For Pickup stage (filtered at DB level)
		expect(
			result.garments.find((g) => g.id === 'garment-ready')
		).toBeUndefined();
	});

	it('should handle pagination correctly with overdue filter', async () => {
		// Mock 40 overdue garments (fetched 2x limit)
		const mockGarments = Array.from({ length: 40 }, (_, i) => ({
			id: `garment-${i}`,
			name: `Garment ${i}`,
			stage: 'In Progress',
			due_date: '2025-08-25',
			created_at: new Date(2025, 7, 25, 23 - Math.floor(i / 2)).toISOString(),
			garment_services: [
				{ id: `service-${i}`, is_done: false, is_removed: false },
			],
			orders: {
				clients: {
					first_name: 'Test',
					last_name: 'Client',
				},
			},
		}));

		const mockQuery = {
			select: jest.fn().mockReturnThis(),
			eq: jest.fn().mockReturnThis(),
			neq: jest.fn().mockReturnThis(),
			lt: jest.fn().mockReturnThis(),
			not: jest.fn().mockReturnThis(),
			order: jest.fn().mockReturnThis(),
			limit: jest.fn().mockReturnThis(),
			data: mockGarments,
			error: null,
			count: 50, // Total count is higher than fetch limit
		};

		mockSupabase.from.mockReturnValue(mockQuery);

		const result = await getGarmentsPaginated({
			shopId: mockShop.id,
			filter: 'overdue',
			limit: 20,
			sortField: 'created_at',
			sortOrder: 'desc',
		});

		// Should return exactly 20 garments after filtering and slicing
		expect(result.garments).toHaveLength(20);
		// Should indicate there are more results because we fetched the full 40 (2x limit)
		expect(result.hasMore).toBe(true);
		expect(result.nextCursor).toBeDefined();
	});

	it('should not over-fetch when not filtering overdue', async () => {
		// Mock garments without overdue filter
		const mockGarments = Array.from({ length: 20 }, (_, i) => ({
			id: `garment-${i}`,
			name: `Garment ${i}`,
			stage: 'New',
			created_at: new Date(2025, 8, 15 - i).toISOString(),
			orders: {
				clients: {
					first_name: 'Test',
					last_name: 'Client',
				},
			},
		}));

		const mockQuery = {
			select: jest.fn().mockReturnThis(),
			eq: jest.fn().mockReturnThis(),
			neq: jest.fn().mockReturnThis(),
			lt: jest.fn().mockReturnThis(),
			not: jest.fn().mockReturnThis(),
			order: jest.fn().mockReturnThis(),
			limit: jest.fn().mockReturnThis(),
			data: mockGarments,
			error: null,
			count: 30,
		};

		mockSupabase.from.mockReturnValue(mockQuery);

		await getGarmentsPaginated({
			shopId: mockShop.id,
			limit: 20,
			sortField: 'created_at',
			sortOrder: 'desc',
		});

		// Should NOT over-fetch when no overdue filter
		expect(mockQuery.limit).toHaveBeenCalledWith(20);
	});
});
