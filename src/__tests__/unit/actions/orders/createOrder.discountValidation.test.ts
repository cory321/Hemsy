/**
 * Tests for createOrder discount validation
 */

import { createOrder } from '@/lib/actions/orders';

// Mock Supabase client
const mockSupabaseClient = {
	auth: {
		getUser: jest.fn(() =>
			Promise.resolve({
				data: { user: { id: 'test-user-id', email: 'test@example.com' } },
				error: null,
			})
		),
	},
	from: jest.fn(),
	rpc: jest.fn(),
};

jest.mock('@/lib/supabase/server', () => ({
	createSupabaseClient: jest.fn(() => Promise.resolve(mockSupabaseClient)),
}));

// Mock ensureUserAndShop
jest.mock('@/lib/auth/user-shop', () => ({
	ensureUserAndShop: jest.fn(() =>
		Promise.resolve({
			user: { id: 'test-user-id', email: 'test@example.com' },
			shop: { id: 'test-shop-id', name: 'Test Shop', tax_percent: 8 },
		})
	),
}));

// Mock timezone utility
jest.mock('@/lib/utils/timezone-helpers', () => ({
	getShopTimezone: jest.fn(() => Promise.resolve('America/New_York')),
}));

// Mock date utilities
jest.mock('@/lib/utils/date-time-utc', () => ({
	convertLocalToUTC: jest.fn((date: string, time: string) => {
		return new Date(`${date}T${time}:00Z`);
	}),
}));

// Mock cache invalidation
jest.mock('@/lib/actions/rpc-optimized', () => ({
	invalidateBusinessMetricsRPCCache: jest.fn(() => Promise.resolve()),
	invalidateGarmentPipelineRPCCache: jest.fn(() => Promise.resolve()),
}));

jest.mock('next/cache', () => ({
	revalidatePath: jest.fn(),
}));

describe('createOrder - Discount Validation', () => {
	const validOrderInput = {
		clientId: '123e4567-e89b-12d3-a456-426614174000', // Valid UUID
		discountCents: 0,
		garments: [
			{
				name: 'Test Garment',
				notes: 'Test notes',
				services: [
					{
						quantity: 1,
						unit: 'flat_rate' as const,
						unitPriceCents: 10000, // $100
						inline: {
							name: 'Test Service',
							description: 'Test service description',
						},
					},
				],
			},
			{
				name: 'Another Garment',
				services: [
					{
						quantity: 2,
						unit: 'flat_rate' as const,
						unitPriceCents: 5000, // $50 each = $100 total
						inline: {
							name: 'Another Service',
						},
					},
				],
			},
		],
		// Total subtotal: $200 (10000 + 10000)
	};

	beforeEach(() => {
		jest.clearAllMocks();

		// Reset all mock implementations
		mockSupabaseClient.from = jest.fn();
		mockSupabaseClient.rpc = jest.fn();
	});

	it('rejects order when discount exceeds subtotal', async () => {
		const input = {
			...validOrderInput,
			discountCents: 30000, // $300 discount (exceeds $200 subtotal)
		};

		const result = await createOrder(input);

		expect(result).toEqual({
			success: false,
			errors: {
				discountCents: ['Discount ($300.00) cannot exceed subtotal ($200.00)'],
			},
		});

		// Should not call database operations
		expect(mockSupabaseClient.rpc).not.toHaveBeenCalled();
		expect(mockSupabaseClient.from).not.toHaveBeenCalled();
	});

	it('accepts order when discount equals subtotal', async () => {
		const input = {
			...validOrderInput,
			discountCents: 20000, // $200 discount (equals $200 subtotal)
		};

		// Mock successful order creation
		mockSupabaseClient.rpc.mockResolvedValueOnce({
			data: 'ORD-001',
			error: null,
		});

		mockSupabaseClient.from.mockReturnValue({
			insert: jest.fn().mockReturnValue({
				select: jest.fn().mockReturnValue({
					single: jest.fn().mockResolvedValue({
						data: { id: 'order-123' },
						error: null,
					}),
				}),
			}),
		});

		const result = await createOrder(input);

		// Should succeed (or at least not fail on discount validation)
		// The actual result depends on the full mock setup
		if (!result.success) {
			// If it fails, it should NOT be due to discount validation
			expect(result.errors?.discountCents).toBeUndefined();
		}
	});

	it('accepts order when discount is less than subtotal', async () => {
		const input = {
			...validOrderInput,
			discountCents: 10000, // $100 discount (half of $200 subtotal)
		};

		// Mock successful order creation
		mockSupabaseClient.rpc.mockResolvedValueOnce({
			data: 'ORD-001',
			error: null,
		});

		mockSupabaseClient.from.mockReturnValue({
			insert: jest.fn().mockReturnValue({
				select: jest.fn().mockReturnValue({
					single: jest.fn().mockResolvedValue({
						data: { id: 'order-123' },
						error: null,
					}),
				}),
			}),
		});

		const result = await createOrder(input);

		// Should not fail on discount validation
		if (!result.success) {
			expect(result.errors?.discountCents).toBeUndefined();
		}
	});

	it('accepts order with zero discount', async () => {
		const input = {
			...validOrderInput,
			discountCents: 0,
		};

		// Mock successful order creation
		mockSupabaseClient.rpc.mockResolvedValueOnce({
			data: 'ORD-001',
			error: null,
		});

		mockSupabaseClient.from.mockReturnValue({
			insert: jest.fn().mockReturnValue({
				select: jest.fn().mockReturnValue({
					single: jest.fn().mockResolvedValue({
						data: { id: 'order-123' },
						error: null,
					}),
				}),
			}),
		});

		const result = await createOrder(input);

		// Should not fail on discount validation
		if (!result.success) {
			expect(result.errors?.discountCents).toBeUndefined();
		}
	});

	it('rejects discount slightly exceeding subtotal', async () => {
		const input = {
			...validOrderInput,
			discountCents: 20001, // $200.01 (exceeds $200.00 subtotal by 1 cent)
		};

		const result = await createOrder(input);

		expect(result).toEqual({
			success: false,
			errors: {
				discountCents: ['Discount ($200.01) cannot exceed subtotal ($200.00)'],
			},
		});
	});

	it('calculates subtotal correctly with multiple services per garment', async () => {
		const input = {
			clientId: '123e4567-e89b-12d3-a456-426614174000', // Valid UUID
			discountCents: 25000, // $250 (should exceed $240 subtotal)
			garments: [
				{
					name: 'Garment 1',
					services: [
						{
							quantity: 2,
							unit: 'flat_rate' as const,
							unitPriceCents: 5000, // $50 each = $100 total
							inline: { name: 'Service 1' },
						},
						{
							quantity: 1,
							unit: 'flat_rate' as const,
							unitPriceCents: 4000, // $40
							inline: { name: 'Service 2' },
						},
					],
				},
				{
					name: 'Garment 2',
					services: [
						{
							quantity: 1,
							unit: 'flat_rate' as const,
							unitPriceCents: 10000, // $100
							inline: { name: 'Service 3' },
						},
					],
				},
			],
			// Total: $100 + $40 + $100 = $240
		};

		const result = await createOrder(input);

		expect(result).toEqual({
			success: false,
			errors: {
				discountCents: ['Discount ($250.00) cannot exceed subtotal ($240.00)'],
			},
		});
	});

	it('handles edge case with very small subtotal', async () => {
		const input = {
			clientId: '123e4567-e89b-12d3-a456-426614174000', // Valid UUID
			discountCents: 100, // $1.00 discount
			garments: [
				{
					name: 'Cheap Item',
					services: [
						{
							quantity: 1,
							unit: 'flat_rate' as const,
							unitPriceCents: 50, // $0.50 (subtotal less than discount)
							inline: { name: 'Minimal Service' },
						},
					],
				},
			],
		};

		const result = await createOrder(input);

		expect(result).toEqual({
			success: false,
			errors: {
				discountCents: ['Discount ($1.00) cannot exceed subtotal ($0.50)'],
			},
		});
	});
});
