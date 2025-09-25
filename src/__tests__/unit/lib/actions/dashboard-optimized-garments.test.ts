import { getGarmentsDataConsolidated } from '@/lib/actions/dashboard-optimized';
import { createClient } from '@/lib/supabase/server';

jest.mock('@/lib/supabase/server', () => ({
	createClient: jest.fn(),
}));

jest.mock('@/lib/utils/timezone-helpers', () => ({
	getShopTimezone: jest.fn().mockResolvedValue('America/New_York'),
}));

describe('Optimized Dashboard - Garments sorting and limiting', () => {
	const mockSupabase = {
		from: jest.fn(),
	} as any;

	beforeEach(() => {
		jest.clearAllMocks();
		(createClient as jest.Mock).mockResolvedValue(mockSupabase);
	});

	it('sorts by due-date priority and limits to top 3', async () => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const fmt = (d: Date) => d.toISOString().split('T')[0]!;
		const yesterday = new Date(today);
		yesterday.setDate(today.getDate() - 1);
		const twoDaysAgo = new Date(today);
		twoDaysAgo.setDate(today.getDate() - 2);
		const tomorrow = new Date(today);
		tomorrow.setDate(today.getDate() + 1);

		const mockQuery = {
			select: jest.fn().mockReturnThis(),
			eq: jest.fn().mockReturnThis(),
			neq: jest.fn().mockReturnThis(),
			// Return 5 garments with mixed due dates and stages
			// Expectation: Most overdue first, then due today, then future
			// Also within same overdue date and In Progress stage, higher progress first
			// Finally limited to 3
			then: undefined,
		} as any;

		mockQuery.select.mockReturnValue(mockQuery);
		mockQuery.eq.mockReturnValue(mockQuery);
		mockQuery.neq.mockResolvedValue({});

		mockSupabase.from.mockReturnValue({
			select: mockQuery.select,
			eq: mockQuery.eq,
			neq: mockQuery.neq,
		});

		// Provide data when the chained call resolves
		mockQuery.neq.mockResolvedValueOnce({
			data: [
				{
					id: 'g1',
					name: 'Two Days Overdue In Progress 20%',
					stage: 'In Progress',
					order_id: 'o1',
					due_date: fmt(twoDaysAgo),
					garment_services: [
						{ id: 's1', is_done: false, is_removed: false },
						{ id: 's2', is_done: true, is_removed: false },
						{ id: 's3', is_done: false, is_removed: false },
						{ id: 's4', is_done: false, is_removed: false },
						{ id: 's5', is_done: false, is_removed: false },
					],
					orders: {
						id: 'o1',
						status: 'in_progress',
						order_number: '001',
						clients: { id: 'c1', first_name: 'A', last_name: 'Z' },
					},
				},
				{
					id: 'g2',
					name: 'Two Days Overdue In Progress 80%',
					stage: 'In Progress',
					order_id: 'o2',
					due_date: fmt(twoDaysAgo),
					garment_services: [
						{ id: 's1', is_done: true, is_removed: false },
						{ id: 's2', is_done: true, is_removed: false },
						{ id: 's3', is_done: true, is_removed: false },
						{ id: 's4', is_done: true, is_removed: false },
						{ id: 's5', is_done: false, is_removed: false },
					],
					orders: {
						id: 'o2',
						status: 'in_progress',
						order_number: '002',
						clients: { id: 'c2', first_name: 'B', last_name: 'Y' },
					},
				},
				{
					id: 'g3',
					name: 'Yesterday New',
					stage: 'New',
					order_id: 'o3',
					due_date: fmt(yesterday),
					garment_services: [],
					orders: {
						id: 'o3',
						status: 'in_progress',
						order_number: '003',
						clients: { id: 'c3', first_name: 'C', last_name: 'X' },
					},
				},
				{
					id: 'g4',
					name: 'Today In Progress 50%',
					stage: 'In Progress',
					order_id: 'o4',
					due_date: fmt(today),
					garment_services: [
						{ id: 's1', is_done: true, is_removed: false },
						{ id: 's2', is_done: false, is_removed: false },
					],
					orders: {
						id: 'o4',
						status: 'in_progress',
						order_number: '004',
						clients: { id: 'c4', first_name: 'D', last_name: 'W' },
					},
				},
				{
					id: 'g5',
					name: 'Tomorrow New',
					stage: 'New',
					order_id: 'o5',
					due_date: fmt(tomorrow),
					garment_services: [],
					orders: {
						id: 'o5',
						status: 'in_progress',
						order_number: '005',
						clients: { id: 'c5', first_name: 'E', last_name: 'V' },
					},
				},
			],
			error: null,
		});

		const result = await getGarmentsDataConsolidated('shop-123');

		// Expect top 3 prioritized:
		// - g2 (two days overdue, In Progress 80%) before g1 (two days overdue, In Progress 20%)
		// - then g3 (yesterday, New)
		expect(result.activeGarments).toHaveLength(3);
		expect(result.activeGarments[0]!.id).toBe('g2');
		expect(result.activeGarments[1]!.id).toBe('g1');
		expect(result.activeGarments[2]!.id).toBe('g3');
	});
});
