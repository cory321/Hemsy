import { getGarmentsPaginated } from '@/lib/actions/garments-paginated';
import { loadMoreGarments } from '@/lib/actions/garments-load-more';
import { createClient } from '@/lib/supabase/server';
import type { GarmentStage } from '@/types';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
	createClient: jest.fn(),
}));

// Mock logger
jest.mock('@/lib/utils/logger', () => ({
	logger: {
		error: jest.fn(),
	},
}));

// Mock date utils
jest.mock('@/lib/utils/date-time-utils', () => ({
	getTodayString: jest.fn(() => '2024-01-15'),
	formatDateForDatabase: jest.fn(() => '2024-01-15'),
}));

jest.mock('@/lib/utils/timezone-helpers', () => ({
	getShopTimezone: jest.fn().mockResolvedValue('America/New_York'),
}));

// Mock overdue logic
jest.mock('@/lib/utils/overdue-logic', () => ({
	isGarmentOverdue: jest.fn(() => false),
}));

describe('Garments - Canceled Order Filtering', () => {
	const mockShopId = '123e4567-e89b-12d3-a456-426614174000';
	const mockSupabase = {
		from: jest.fn(),
	};

	beforeEach(() => {
		jest.clearAllMocks();
		(createClient as jest.Mock).mockResolvedValue(mockSupabase);
	});

	describe('getGarmentsPaginated', () => {
		it('should exclude canceled orders by default', async () => {
			const mockQuery = {
				select: jest.fn().mockReturnThis(),
				eq: jest.fn().mockReturnThis(),
				neq: jest.fn().mockReturnThis(),
				order: jest.fn().mockReturnThis(),
				limit: jest.fn().mockResolvedValue({
					data: [],
					error: null,
					count: 0,
				}),
			};

			mockSupabase.from.mockReturnValue(mockQuery);

			await getGarmentsPaginated({
				shopId: mockShopId,
				limit: 20,
				sortField: 'created_at',
				sortOrder: 'desc',
			});

			// Verify that canceled orders are excluded
			expect(mockQuery.neq).toHaveBeenCalledWith('orders.status', 'cancelled');
		});

		it('should include canceled orders when includeCancelled is true', async () => {
			const mockQuery = {
				select: jest.fn().mockReturnThis(),
				eq: jest.fn().mockReturnThis(),
				neq: jest.fn().mockReturnThis(),
				order: jest.fn().mockReturnThis(),
				limit: jest.fn().mockResolvedValue({
					data: [],
					error: null,
					count: 0,
				}),
			};

			mockSupabase.from.mockReturnValue(mockQuery);

			await getGarmentsPaginated({
				shopId: mockShopId,
				limit: 20,
				sortField: 'created_at',
				sortOrder: 'desc',
				includeCancelled: true,
			});

			// When includeCancelled is true, we should not filter out canceled orders
			// The query should be built but no neq filter for canceled orders should be applied
			expect(mockQuery.select).toHaveBeenCalled();
			expect(mockQuery.eq).toHaveBeenCalledWith('shop_id', mockShopId);
		});

		it('should show only canceled orders when onlyCancelled is true', async () => {
			const mockQuery = {
				select: jest.fn().mockReturnThis(),
				eq: jest.fn().mockReturnThis(),
				neq: jest.fn().mockReturnThis(),
				order: jest.fn().mockReturnThis(),
				limit: jest.fn().mockResolvedValue({
					data: [],
					error: null,
					count: 0,
				}),
			};

			mockSupabase.from.mockReturnValue(mockQuery);

			await getGarmentsPaginated({
				shopId: mockShopId,
				limit: 20,
				sortField: 'created_at',
				sortOrder: 'desc',
				onlyCancelled: true,
			});

			// Verify that only canceled orders are selected
			expect(mockQuery.eq).toHaveBeenCalledWith('orders.status', 'cancelled');
			// Should not also exclude canceled orders when we specifically want only canceled orders
			expect(mockQuery.select).toHaveBeenCalled();
		});

		it('should exclude canceled orders when searching', async () => {
			const mockQuery = {
				select: jest.fn().mockReturnThis(),
				eq: jest.fn().mockReturnThis(),
				neq: jest.fn().mockReturnThis(),
				or: jest.fn().mockReturnThis(),
				order: jest.fn().mockReturnThis(),
				limit: jest.fn().mockResolvedValue({
					data: [],
					error: null,
					count: 0,
				}),
			};

			mockSupabase.from.mockReturnValue(mockQuery);

			await getGarmentsPaginated({
				shopId: mockShopId,
				limit: 20,
				sortField: 'created_at',
				sortOrder: 'desc',
				search: 'test garment',
			});

			// Verify that the view is used for searching
			expect(mockSupabase.from).toHaveBeenCalledWith('garments_with_clients');
			// Verify that canceled orders are excluded when using the view
			expect(mockQuery.neq).toHaveBeenCalledWith('order_status', 'cancelled');
		});

		it('should exclude canceled orders when sorting by client name', async () => {
			const mockQuery = {
				select: jest.fn().mockReturnThis(),
				eq: jest.fn().mockReturnThis(),
				neq: jest.fn().mockReturnThis(),
				order: jest.fn().mockReturnThis(),
				limit: jest.fn().mockResolvedValue({
					data: [],
					error: null,
					count: 0,
				}),
			};

			mockSupabase.from.mockReturnValue(mockQuery);

			await getGarmentsPaginated({
				shopId: mockShopId,
				limit: 20,
				sortField: 'client_name',
				sortOrder: 'desc',
			});

			// Verify that the view is used for client name sorting
			expect(mockSupabase.from).toHaveBeenCalledWith('garments_with_clients');
			// Verify that canceled orders are excluded when using the view
			expect(mockQuery.neq).toHaveBeenCalledWith('order_status', 'cancelled');
		});

		it('should exclude canceled orders when filtering by stage', async () => {
			const mockQuery = {
				select: jest.fn().mockReturnThis(),
				eq: jest.fn().mockReturnThis(),
				neq: jest.fn().mockReturnThis(),
				order: jest.fn().mockReturnThis(),
				limit: jest.fn().mockResolvedValue({
					data: [],
					error: null,
					count: 0,
				}),
			};

			mockSupabase.from.mockReturnValue(mockQuery);

			await getGarmentsPaginated({
				shopId: mockShopId,
				limit: 20,
				sortField: 'created_at',
				sortOrder: 'desc',
				stage: 'In Progress' as GarmentStage,
			});

			// Verify that canceled orders are excluded
			expect(mockQuery.neq).toHaveBeenCalledWith('orders.status', 'cancelled');
			// Verify that stage filter is applied
			expect(mockQuery.eq).toHaveBeenCalledWith('stage', 'In Progress');
		});

		it('should exclude canceled orders when filtering by due date', async () => {
			const mockQuery = {
				select: jest.fn().mockReturnThis(),
				eq: jest.fn().mockReturnThis(),
				neq: jest.fn().mockReturnThis(),
				lt: jest.fn().mockReturnThis(),
				not: jest.fn().mockReturnThis(),
				order: jest.fn().mockReturnThis(),
				limit: jest.fn().mockResolvedValue({
					data: [],
					error: null,
					count: 0,
				}),
			};

			mockSupabase.from.mockReturnValue(mockQuery);

			await getGarmentsPaginated({
				shopId: mockShopId,
				limit: 20,
				sortField: 'created_at',
				sortOrder: 'desc',
				filter: 'overdue',
			});

			// Verify that canceled orders are excluded
			expect(mockQuery.neq).toHaveBeenCalledWith('orders.status', 'cancelled');
			// Verify that overdue filter is applied
			expect(mockQuery.lt).toHaveBeenCalledWith('due_date', '2024-01-15');
		});

		it('should exclude canceled orders from stage counts', async () => {
			const mockQuery = {
				select: jest.fn().mockReturnThis(),
				eq: jest.fn().mockReturnThis(),
				neq: jest.fn().mockReturnThis(),
				order: jest.fn().mockReturnThis(),
				limit: jest.fn().mockResolvedValue({
					data: [],
					error: null,
					count: 0,
				}),
			};

			const mockStageCountQuery = {
				select: jest.fn().mockReturnThis(),
				eq: jest.fn().mockReturnThis(),
				neq: jest.fn().mockReturnThis(),
			};

			// Mock the chain of calls for stage count queries
			mockStageCountQuery.select.mockReturnValue(mockStageCountQuery);
			mockStageCountQuery.eq.mockReturnValue(mockStageCountQuery);
			mockStageCountQuery.neq.mockResolvedValue({ count: 5 });

			let callCount = 0;
			mockSupabase.from.mockImplementation((table) => {
				if (table === 'garments' && callCount === 0) {
					callCount++;
					return mockQuery;
				}
				return mockStageCountQuery;
			});

			const result = await getGarmentsPaginated({
				shopId: mockShopId,
				limit: 20,
				sortField: 'created_at',
				sortOrder: 'desc',
			});

			// Verify that stage counts exclude canceled orders
			// The stage count queries should call neq to exclude canceled orders
			expect(mockStageCountQuery.neq).toHaveBeenCalledWith(
				'orders.status',
				'cancelled'
			);
			expect(result.stageCounts).toBeDefined();
		});
	});

	describe('loadMoreGarments', () => {
		it('should exclude canceled orders when loading more garments', async () => {
			const mockCursor = {
				lastId: '223e4567-e89b-12d3-a456-426614174001',
				lastCreatedAt: '2024-01-10T10:00:00Z',
			};

			const mockQuery = {
				select: jest.fn().mockReturnThis(),
				eq: jest.fn().mockReturnThis(),
				neq: jest.fn().mockReturnThis(),
				or: jest.fn().mockReturnThis(),
				order: jest.fn().mockReturnThis(),
				limit: jest.fn().mockResolvedValue({
					data: [],
					error: null,
					count: 0,
				}),
			};

			mockSupabase.from.mockReturnValue(mockQuery);

			await loadMoreGarments({
				shopId: mockShopId,
				cursor: mockCursor,
				sortField: 'created_at',
				sortOrder: 'desc',
			});

			// Verify that canceled orders are excluded
			expect(mockQuery.neq).toHaveBeenCalledWith('orders.status', 'cancelled');
		});

		it('should exclude canceled orders when loading more with search', async () => {
			const mockCursor = {
				lastId: '223e4567-e89b-12d3-a456-426614174001',
				lastCreatedAt: '2024-01-10T10:00:00Z',
			};

			const mockQuery = {
				select: jest.fn().mockReturnThis(),
				eq: jest.fn().mockReturnThis(),
				neq: jest.fn().mockReturnThis(),
				or: jest.fn().mockReturnThis(),
				order: jest.fn().mockReturnThis(),
				limit: jest.fn().mockResolvedValue({
					data: [],
					error: null,
					count: 0,
				}),
			};

			mockSupabase.from.mockReturnValue(mockQuery);

			await loadMoreGarments({
				shopId: mockShopId,
				cursor: mockCursor,
				search: 'test',
				sortField: 'created_at',
				sortOrder: 'desc',
			});

			// Verify that the view is used for searching
			expect(mockSupabase.from).toHaveBeenCalledWith('garments_with_clients');
			// Verify that canceled orders are excluded when using the view
			expect(mockQuery.neq).toHaveBeenCalledWith('order_status', 'cancelled');
		});
	});
});
