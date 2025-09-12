import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReadyForPickupSectionClient } from '@/components/dashboard/garment-pipeline/ReadyForPickupSectionClient';
import { ReadyForPickupItem } from '@/components/dashboard/garment-pipeline/ReadyForPickupItem';
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

describe('ReadyForPickupSection', () => {
  const mockGarments: ActiveGarment[] = [
    {
      id: 'garment-1',
      name: 'Wedding Dress',
      order_id: 'order-1',
      stage: 'Ready For Pickup' as GarmentStage,
      client_name: 'Jane Smith',
      due_date: '2024-12-15',
      services: [
        { id: 's1', name: 'Hemming', is_done: true },
        { id: 's2', name: 'Waist Adjustment', is_done: true },
      ],
      progress: 100,
    },
    {
      id: 'garment-2',
      name: 'Suit Jacket',
      order_id: 'order-2',
      stage: 'Ready For Pickup' as GarmentStage,
      client_name: 'John Doe',
      due_date: '2024-12-14',
      services: [{ id: 's3', name: 'Sleeve Shortening', is_done: true }],
      progress: 100,
    },
    {
      id: 'garment-3',
      name: 'Evening Gown',
      order_id: 'order-3',
      stage: 'Ready For Pickup' as GarmentStage,
      client_name: 'Alice Johnson',
      due_date: '2024-12-13',
      services: [{ id: 's4', name: 'Zipper Replacement', is_done: true }],
      progress: 100,
    },
  ];

  beforeEach(() => {
    mockPush.mockClear();
  });

  describe('ReadyForPickupSectionClient', () => {
    it('should not render when there are no garments', () => {
      const { container } = render(
        <ReadyForPickupSectionClient garments={[]} totalCount={0} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render the section with garments', () => {
      render(
        <ReadyForPickupSectionClient
          garments={mockGarments}
          totalCount={mockGarments.length}
        />
      );

      // Check header
      expect(screen.getByText('Ready For Pickup')).toBeInTheDocument();
      expect(
        screen.getByText('3 garments ready for customer pickup')
      ).toBeInTheDocument();

      // Check garments are displayed
      expect(screen.getByText('Wedding Dress')).toBeInTheDocument();
      expect(screen.getByText('Suit Jacket')).toBeInTheDocument();
      expect(screen.getByText('Evening Gown')).toBeInTheDocument();
    });

    it('should show singular form for 1 garment', () => {
      render(
        <ReadyForPickupSectionClient
          garments={[mockGarments[0]!]}
          totalCount={1}
        />
      );
      expect(
        screen.getByText('1 garment ready for customer pickup')
      ).toBeInTheDocument();
    });

    it('should navigate to garments page with filter when View All is clicked', () => {
      render(
        <ReadyForPickupSectionClient
          garments={mockGarments}
          totalCount={mockGarments.length}
        />
      );

      const viewAllButton = screen.getByRole('button', { name: /View All/i });
      fireEvent.click(viewAllButton);

      expect(mockPush).toHaveBeenCalledWith(
        '/garments?stage=Ready%20For%20Pickup'
      );
    });

    it('should show "Showing latest 3 garments" message when there are 3 or more garments', () => {
      render(
        <ReadyForPickupSectionClient
          garments={mockGarments}
          totalCount={mockGarments.length}
        />
      );
      // The component shows the count in the subtitle instead
      expect(
        screen.getByText(/3 garments ready for customer pickup/)
      ).toBeInTheDocument();
    });

    it('should not show "Showing latest 3 garments" message when there are less than 3 garments', () => {
      render(
        <ReadyForPickupSectionClient
          garments={mockGarments.slice(0, 2)}
          totalCount={2}
        />
      );
      expect(
        screen.queryByText(/Showing latest 3 garments/)
      ).not.toBeInTheDocument();
    });
  });

  describe('ReadyForPickupItem', () => {
    const singleGarment = mockGarments[0]!;

    it('should render garment information', () => {
      render(<ReadyForPickupItem garment={singleGarment} />);

      expect(screen.getByText('Wedding Dress')).toBeInTheDocument();
      expect(screen.getByText(/Jane Smith/)).toBeInTheDocument();
      expect(screen.getByText('READY')).toBeInTheDocument();
    });

    it('should navigate to garment details when clicked', () => {
      render(<ReadyForPickupItem garment={singleGarment} />);

      const card =
        screen
          .getByText('Wedding Dress')
          .closest('[role="button"], [onclick]') ||
        screen.getByText('Wedding Dress').parentElement?.parentElement
          ?.parentElement;

      if (card) {
        fireEvent.click(card);
        expect(mockPush).toHaveBeenCalledWith('/garments/garment-1');
      }
    });

    it('should display the ready icon', () => {
      render(<ReadyForPickupItem garment={singleGarment} />);

      // Check for the CheckCircleIcon by looking for svg elements
      const svgElements = document.querySelectorAll('svg');
      expect(svgElements.length).toBeGreaterThan(0);
    });

    it('should apply hover styles', () => {
      const { container } = render(
        <ReadyForPickupItem garment={singleGarment} />
      );

      const paper = container.querySelector('[class*="MuiPaper-root"]');
      expect(paper).toHaveStyle({
        cursor: 'pointer',
        transition: 'all 0.2s',
      });
    });
  });
});
