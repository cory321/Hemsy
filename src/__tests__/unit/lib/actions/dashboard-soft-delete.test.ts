import {
	getActiveGarments,
	getReadyForPickupGarments,
} from '@/lib/actions/dashboard';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { ensureUserAndShop } from '@/lib/auth/user-shop';

// Mock dependencies
jest.mock('@clerk/nextjs/server', () => ({
	auth: jest.fn(),
}));

jest.mock('@/lib/supabase/server', () => ({
	createClient: jest.fn(),
}));

jest.mock('@/lib/auth/user-shop', () => ({
	ensureUserAndShop: jest.fn(),
}));

jest.mock('@/lib/utils/timezone-helpers', () => ({
	getShopTimezone: jest.fn().mockResolvedValue('America/New_York'),
}));

jest.mock('date-fns-tz', () => ({
	toZonedTime: jest.fn((date) => date), // Return same date for testing
}));

jest.mock('@/lib/utils/date-time-utils');
jest.mock('@/lib/utils/overdue-logic');
jest.mock('@/lib/utils/garment-priority');

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockCreateClient = createClient as jest.MockedFunction<
	typeof createClient
>;
const mockEnsureUserAndShop = ensureUserAndShop as jest.MockedFunction<
	typeof ensureUserAndShop
>;

describe('Dashboard - Soft Delete Service Filtering', () => {
	const mockSupabaseClient = {
		from: jest.fn(),
	};

	const mockQueryBuilder = {
		select: jest.fn(),
		eq: jest.fn(),
		neq: jest.fn(),
		not: jest.fn(),
		order: jest.fn(),
		limit: jest.fn(),
	};

	const mockShop = {
		id: 'test-shop-id',
		name: 'Test Shop',
	};

	const mockUser = {
		id: 'test-user-id',
		email: 'test@example.com',
	};

	beforeEach(() => {
		jest.clearAllMocks();
		mockAuth.mockResolvedValue({ userId: 'test-user-id' } as any);
		mockCreateClient.mockResolvedValue(mockSupabaseClient as any);
		mockEnsureUserAndShop.mockResolvedValue({
			user: mockUser,
			shop: mockShop,
		} as any);

		// Chain the query builder methods
		mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
		mockQueryBuilder.select.mockReturnValue(mockQueryBuilder);
		mockQueryBuilder.eq.mockReturnValue(mockQueryBuilder);
		mockQueryBuilder.neq.mockReturnValue(mockQueryBuilder);
		mockQueryBuilder.not.mockReturnValue(mockQueryBuilder);
		mockQueryBuilder.order.mockReturnValue(mockQueryBuilder);
		mockQueryBuilder.limit.mockReturnValue(mockQueryBuilder);
	});

	describe('getActiveGarments', () => {
		it('should filter out soft-deleted services from active garments', async () => {
			const mockGarmentData = [
				{
					id: 'garment-1',
					name: 'Dress',
					stage: 'In Progress',
					order_id: 'order-1',
					due_date: '2024-03-15',
					garment_services: [
						{
							id: 'service-1',
							name: 'Hemming',
							is_done: false,
							is_removed: false,
						},
						{
							id: 'service-2',
							name: 'Alterations',
							is_done: false,
							is_removed: true,
						}, // Soft-deleted
						{
							id: 'service-3',
							name: 'Pressing',
							is_done: true,
							is_removed: false,
						},
					],
					orders: {
						clients: {
							first_name: 'Jane',
							last_name: 'Doe',
						},
					},
				},
			];

			// Mock the query result
			mockQueryBuilder.limit.mockResolvedValue({
				data: mockGarmentData,
				error: null,
			});

			const result = await getActiveGarments();

			// Verify Supabase query was called correctly
			expect(mockSupabaseClient.from).toHaveBeenCalledWith('garments');
			expect(mockQueryBuilder.select).toHaveBeenCalled();
			expect(mockQueryBuilder.eq).toHaveBeenCalledWith(
				'shop_id',
				'test-shop-id'
			);

			// Verify that only non-removed services are included
			expect(result).toHaveLength(1);
			expect(result[0]!.services).toHaveLength(2); // Only 2 services (removed one filtered out)
			expect(result[0]!.services.map((s) => s.name)).toEqual([
				'Hemming',
				'Pressing',
			]);
			expect(
				result[0]!.services.find((s) => s.name === 'Alterations')
			).toBeUndefined();

			// Check progress calculation excludes removed services
			expect(result[0]!.progress).toBe(50); // 1 completed out of 2 active services
		});

		it('should handle garments with all services soft-deleted', async () => {
			const mockGarmentData = [
				{
					id: 'garment-1',
					name: 'Shirt',
					stage: 'New',
					order_id: 'order-1',
					due_date: '2024-03-20',
					garment_services: [
						{
							id: 'service-1',
							name: 'Service A',
							is_done: false,
							is_removed: true,
						},
						{
							id: 'service-2',
							name: 'Service B',
							is_done: false,
							is_removed: true,
						},
					],
					orders: {
						clients: {
							first_name: 'John',
							last_name: 'Smith',
						},
					},
				},
			];

			mockQueryBuilder.limit.mockResolvedValue({
				data: mockGarmentData,
				error: null,
			});

			const result = await getActiveGarments();

			expect(result).toHaveLength(1);
			expect(result[0]!.services).toHaveLength(0); // All services filtered out
			expect(result[0]!.progress).toBe(0); // No active services
		});

		it('should handle garments with no services', async () => {
			const mockGarmentData = [
				{
					id: 'garment-1',
					name: 'Jacket',
					stage: 'New',
					order_id: 'order-1',
					due_date: '2024-03-25',
					garment_services: [],
					orders: {
						clients: {
							first_name: 'Alice',
							last_name: 'Brown',
						},
					},
				},
			];

			mockQueryBuilder.limit.mockResolvedValue({
				data: mockGarmentData,
				error: null,
			});

			const result = await getActiveGarments();

			expect(result).toHaveLength(1);
			expect(result[0]!.services).toHaveLength(0);
			expect(result[0]!.progress).toBe(0);
		});
	});

	describe('getReadyForPickupGarments', () => {
		it('should filter out soft-deleted services from ready for pickup garments', async () => {
			const mockGarmentData = [
				{
					id: 'garment-1',
					name: 'Suit',
					stage: 'Ready For Pickup',
					order_id: 'order-1',
					due_date: '2024-03-10',
					created_at: '2024-03-01',
					garment_services: [
						{
							id: 'service-1',
							name: 'Tailoring',
							is_done: true,
							is_removed: false,
						},
						{
							id: 'service-2',
							name: 'Extra Service',
							is_done: true,
							is_removed: true,
						}, // Soft-deleted
						{
							id: 'service-3',
							name: 'Finishing',
							is_done: true,
							is_removed: false,
						},
					],
					orders: {
						clients: {
							first_name: 'Bob',
							last_name: 'Johnson',
						},
					},
				},
			];

			mockQueryBuilder.limit.mockResolvedValue({
				data: mockGarmentData,
				error: null,
			});

			const result = await getReadyForPickupGarments();

			// Verify Supabase query was called correctly
			expect(mockSupabaseClient.from).toHaveBeenCalledWith('garments');
			expect(mockQueryBuilder.select).toHaveBeenCalled();
			expect(mockQueryBuilder.eq).toHaveBeenCalledWith(
				'shop_id',
				'test-shop-id'
			);
			expect(mockQueryBuilder.eq).toHaveBeenCalledWith(
				'stage',
				'Ready For Pickup'
			);

			// Verify that only non-removed services are included
			expect(result).toHaveLength(1);
			expect(result[0]!.services).toHaveLength(2); // Only 2 services (removed one filtered out)
			expect(result[0]!.services.map((s) => s.name)).toEqual([
				'Tailoring',
				'Finishing',
			]);
			expect(
				result[0]!.services.find((s) => s.name === 'Extra Service')
			).toBeUndefined();

			// Progress should still be 100% for ready for pickup
			expect(result[0]!.progress).toBe(100);
		});

		it('should handle ready for pickup garments with mixed service states', async () => {
			const mockGarmentData = [
				{
					id: 'garment-1',
					name: 'Coat',
					stage: 'Ready For Pickup',
					order_id: 'order-1',
					due_date: '2024-03-05',
					created_at: '2024-02-28',
					garment_services: [
						{
							id: 'service-1',
							name: 'Service A',
							is_done: true,
							is_removed: false,
						},
						{
							id: 'service-2',
							name: 'Service B',
							is_done: false,
							is_removed: true,
						}, // Soft-deleted, not done
						{
							id: 'service-3',
							name: 'Service C',
							is_done: true,
							is_removed: true,
						}, // Soft-deleted, done
					],
					orders: {
						clients: {
							first_name: 'Emma',
							last_name: 'Wilson',
						},
					},
				},
			];

			mockQueryBuilder.limit.mockResolvedValue({
				data: mockGarmentData,
				error: null,
			});

			const result = await getReadyForPickupGarments();

			expect(result).toHaveLength(1);
			expect(result[0]!.services).toHaveLength(1); // Only Service A (not removed)
			expect(result[0]!.services[0]!.name).toBe('Service A');
			expect(result[0]!.progress).toBe(100); // Ready for pickup is always 100%
		});
	});
});
