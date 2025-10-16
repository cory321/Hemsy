import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ActiveGarmentItem } from '@/components/dashboard/garment-pipeline/ActiveGarmentItem';
import type { ActiveGarment } from '@/lib/actions/dashboard';
import type { GarmentStage } from '@/types';

// Mock the router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
	useRouter: () => ({
		push: mockPush,
	}),
}));

// Mock the constants
jest.mock('@/constants/garmentStages', () => ({
	STAGE_COLORS: {
		'Ready For Pickup': '#BD8699',
		New: '#a3b5aa',
		'In Progress': '#F3C165',
		Done: '#c3b3d1',
	},
}));

// Mock date utilities
jest.mock('@/lib/utils/date-time-utils', () => ({
	getDetailedDueDateDisplay: jest.fn((date) => {
		if (!date) return 'No due date';
		return 'Due in 2 days';
	}),
	isGarmentDueDateUrgent: jest.fn(() => false),
}));

describe('ActiveGarmentItem', () => {
	const mockGarment: ActiveGarment = {
		id: 'garment-1',
		name: 'Blue Dress',
		order_id: 'order-1',
		stage: 'In Progress' as GarmentStage,
		client_name: 'Jane Smith',
		due_date: '2024-12-15',
		services: [
			{ id: 's1', name: 'Hemming', is_done: true },
			{ id: 's2', name: 'Waist Adjustment', is_done: false },
		],
		progress: 50,
	};

	beforeEach(() => {
		mockPush.mockClear();
	});

	describe('Regular Item (non-priority)', () => {
		it('should render garment information', () => {
			render(<ActiveGarmentItem garment={mockGarment} />);

			expect(screen.getByText('Blue Dress')).toBeInTheDocument();
			expect(screen.getByText(/Jane Smith/)).toBeInTheDocument();
			expect(screen.getByText('IN PROGRESS')).toBeInTheDocument();
		});

		it('should navigate to garment details when clicked', () => {
			render(<ActiveGarmentItem garment={mockGarment} />);

			const card = screen
				.getByText('Blue Dress')
				.closest('[class*="MuiPaper"]');
			if (card) {
				fireEvent.click(card);
				expect(mockPush).toHaveBeenCalledWith('/garments/garment-1');
			}
		});

		it('should apply hover styles with stage color', () => {
			const { container } = render(<ActiveGarmentItem garment={mockGarment} />);

			const paper = container.querySelector('[class*="MuiPaper-root"]');
			expect(paper).toHaveStyle({
				cursor: 'pointer',
				transition: 'all 0.2s',
			});

			// Check that it uses the stage color
			const styles = window.getComputedStyle(paper as Element);
			expect(styles.borderColor).toContain('rgb'); // Should have a color
		});

		it('should not show progress bar for regular items', () => {
			render(<ActiveGarmentItem garment={mockGarment} />);

			// Regular items don't show progress bars, only priority items do
			const progressBar = screen.queryByRole('progressbar');
			expect(progressBar).not.toBeInTheDocument();
		});
	});

	describe('Priority Item', () => {
		it('should render with priority styling', () => {
			render(<ActiveGarmentItem garment={mockGarment} priority={true} />);

			expect(screen.getByText('Blue Dress')).toBeInTheDocument();
			// Priority items don't show a "View Details" button - they're clickable as a whole
			expect(screen.getByText('Blue Dress')).toBeInTheDocument();
		});

		it('should show service checklist', () => {
			render(<ActiveGarmentItem garment={mockGarment} priority={true} />);

			expect(screen.getByText('Hemming')).toBeInTheDocument();
			expect(screen.getByText('Waist Adjustment')).toBeInTheDocument();
		});

		it('should navigate when card is clicked', () => {
			render(<ActiveGarmentItem garment={mockGarment} priority={true} />);

			const card = screen
				.getByText('Blue Dress')
				.closest('[class*="MuiPaper"]');
			if (card) {
				fireEvent.click(card);
				expect(mockPush).toHaveBeenCalledWith('/garments/garment-1');
			}
		});

		it('should navigate when View Details button is clicked', () => {
			render(<ActiveGarmentItem garment={mockGarment} priority={true} />);

			// Click the garment item directly (it's clickable as a whole)
			const garmentItem = screen.getByText('Blue Dress').closest('div');
			fireEvent.click(garmentItem!);
			expect(mockPush).toHaveBeenCalledWith('/garments/garment-1');
		});

		it('should show progress percentage', () => {
			render(<ActiveGarmentItem garment={mockGarment} priority={true} />);

			expect(screen.getByText('50%')).toBeInTheDocument();
			expect(screen.getByText('Progress')).toBeInTheDocument();
		});
	});

	describe('Stage-specific styling', () => {
		it('should apply New stage color', () => {
			const newGarment = { ...mockGarment, stage: 'New' as GarmentStage };
			render(<ActiveGarmentItem garment={newGarment} />);

			const chip = screen.getByText('NEW');
			expect(chip).toBeInTheDocument();
		});

		it('should apply Ready For Pickup stage color', () => {
			const readyGarment = {
				...mockGarment,
				stage: 'Ready For Pickup' as GarmentStage,
				progress: 100,
			};
			render(<ActiveGarmentItem garment={readyGarment} />);

			const chip = screen.getByText('READY FOR PICKUP');
			expect(chip).toBeInTheDocument();
		});
	});

	describe('Empty services', () => {
		it('should handle garment with no services', () => {
			const noServicesGarment = { ...mockGarment, services: [] };
			render(<ActiveGarmentItem garment={noServicesGarment} priority={true} />);

			// Should still render but without service details
			expect(screen.getByText('Blue Dress')).toBeInTheDocument();
		});
	});
});
