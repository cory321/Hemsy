import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import GarmentsClient from '@/app/(app)/garments/garments-client';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock child components
jest.mock('@/app/(app)/garments/components/search-bar', () => ({
  __esModule: true,
  default: ({ value, onChange }: any) => (
    <input
      data-testid="search-bar"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search garments..."
    />
  ),
}));

jest.mock('@/app/(app)/garments/components/garments-list', () => ({
  __esModule: true,
  default: ({ garments, totalCount }: any) => (
    <div data-testid="garments-list">
      {garments.length} garments
      {totalCount && ` (${totalCount} total)`}
    </div>
  ),
}));

jest.mock('@/components/garments/StageBox', () => ({
  __esModule: true,
  default: ({ stage, onClick, isSelected }: any) => (
    <button
      data-testid={`stage-${stage.name.toLowerCase().replace(/\s+/g, '-')}`}
      onClick={onClick}
      style={{ fontWeight: isSelected ? 'bold' : 'normal' }}
    >
      {stage.name} ({stage.count || 0})
    </button>
  ),
}));

describe('Garments Filter UI', () => {
  const mockRouter = {
    replace: jest.fn(),
    refresh: jest.fn(),
  };

  const mockSearchParams = new URLSearchParams();

  const defaultProps = {
    initialData: {
      garments: [],
      nextCursor: null,
      hasMore: false,
      totalCount: 0,
    },
    stageCounts: {
      New: 5,
      'In Progress': 3,
      'Ready For Pickup': 2,
      Done: 1,
    },
    shopId: 'test-shop-id',
    initialFilters: {
      sortField: 'created_at' as const,
      sortOrder: 'desc' as const,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (usePathname as jest.Mock).mockReturnValue('/garments');
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
  });

  describe('Filter Dropdown', () => {
    it('should render filter dropdown with all options', () => {
      render(<GarmentsClient {...defaultProps} />);

      const filterDropdown = screen.getByLabelText('Filter By');
      expect(filterDropdown).toBeInTheDocument();

      // Click to open dropdown
      fireEvent.mouseDown(filterDropdown);

      // Check all options are present (listbox option and selected value may both match)
      expect(screen.getAllByText('All Garments').length).toBeGreaterThan(0);
      expect(screen.getByText('Due Today')).toBeInTheDocument();
      expect(screen.getByText('Overdue')).toBeInTheDocument();
    });

    it('should show "All Garments" as default selection', () => {
      render(<GarmentsClient {...defaultProps} />);

      const filterDropdown = screen.getByLabelText('Filter By');
      expect(filterDropdown).toHaveTextContent('All Garments');
    });

    it('should update URL when selecting "Due Today"', async () => {
      const user = userEvent.setup();
      render(<GarmentsClient {...defaultProps} />);

      const filterDropdown = screen.getByLabelText('Filter By');

      // Open dropdown and select "Due Today"
      await user.click(filterDropdown);
      await user.click(screen.getByText('Due Today'));

      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledWith(
          expect.stringContaining('filter=due-today'),
          expect.objectContaining({ scroll: false })
        );
      });
    });

    it('should update URL when selecting "Overdue"', async () => {
      const user = userEvent.setup();
      render(<GarmentsClient {...defaultProps} />);

      const filterDropdown = screen.getByLabelText('Filter By');

      // Open dropdown and select "Overdue"
      await user.click(filterDropdown);
      await user.click(screen.getByText('Overdue'));

      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledWith(
          expect.stringContaining('filter=overdue'),
          expect.objectContaining({ scroll: false })
        );
      });
    });

    it('should remove filter from URL when selecting "All Garments"', async () => {
      const user = userEvent.setup();

      // Start with a filter applied
      const propsWithFilter = {
        ...defaultProps,
        initialFilters: {
          ...defaultProps.initialFilters,
          filter: 'due-today' as const,
        },
      };

      render(<GarmentsClient {...propsWithFilter} />);

      const filterDropdown = screen.getByLabelText('Filter By');
      expect(filterDropdown).toHaveTextContent('Due Today');

      // Open dropdown and select "All Garments"
      await user.click(filterDropdown);
      await user.click(screen.getByText('All Garments'));

      await waitFor(() => {
        const lastCall =
          mockRouter.replace.mock.calls[
            mockRouter.replace.mock.calls.length - 1
          ][0];
        expect(lastCall).not.toContain('filter=');
      });
    });
  });

  describe('Filter with Other Controls', () => {
    it('should work with stage filter', async () => {
      const user = userEvent.setup();
      render(<GarmentsClient {...defaultProps} />);

      // First select a stage
      const newStageButton = screen.getByTestId('stage-new');
      await user.click(newStageButton);

      // Then apply a filter
      const filterDropdown = screen.getByLabelText('Filter By');
      await user.click(filterDropdown);
      await user.click(screen.getByText('Due Today'));

      await waitFor(() => {
        const lastCall =
          mockRouter.replace.mock.calls[
            mockRouter.replace.mock.calls.length - 1
          ][0];
        expect(lastCall).toContain('stage=new');
        expect(lastCall).toContain('filter=due-today');
      });
    });

    it('should clear cursor when filter changes', async () => {
      const user = userEvent.setup();

      // Start with a cursor in the URL
      mockSearchParams.set(
        'cursor',
        JSON.stringify({ lastId: 'test', lastCreatedAt: '2024-01-01' })
      );

      render(<GarmentsClient {...defaultProps} />);

      const filterDropdown = screen.getByLabelText('Filter By');
      await user.click(filterDropdown);
      await user.click(screen.getByText('Overdue'));

      await waitFor(() => {
        const lastCall =
          mockRouter.replace.mock.calls[
            mockRouter.replace.mock.calls.length - 1
          ][0];
        expect(lastCall).not.toContain('cursor=');
      });
    });

    it('should work with sort options', async () => {
      const user = userEvent.setup();
      render(<GarmentsClient {...defaultProps} />);

      // Apply filter
      const filterDropdown = screen.getByLabelText('Filter By');
      await user.click(filterDropdown);
      await user.click(screen.getByText('Overdue'));

      // Change sort
      const sortDropdown = screen.getByLabelText('Sort By');
      await user.click(sortDropdown);
      await user.click(screen.getByText('Due Date'));

      await waitFor(() => {
        const calls = mockRouter.replace.mock.calls;
        const lastCall = calls[calls.length - 1][0];
        expect(lastCall).toContain('filter=overdue');
        expect(lastCall).toContain('sort=due_date');
      });
    });
  });

  describe('Filter Persistence', () => {
    it('should maintain filter selection on component re-render', () => {
      const propsWithFilter = {
        ...defaultProps,
        initialFilters: {
          ...defaultProps.initialFilters,
          filter: 'overdue' as const,
        },
      };

      const { rerender } = render(<GarmentsClient {...propsWithFilter} />);

      const filterDropdown = screen.getByLabelText('Filter By');
      expect(filterDropdown).toHaveTextContent('Overdue');

      // Re-render with same props
      rerender(<GarmentsClient {...propsWithFilter} />);

      expect(screen.getByLabelText('Filter By')).toHaveTextContent('Overdue');
    });

    it('should update filter when props change', () => {
      const { rerender } = render(<GarmentsClient {...defaultProps} />);

      expect(screen.getByLabelText('Filter By')).toHaveTextContent(
        'All Garments'
      );

      // Update props with filter
      const propsWithFilter = {
        ...defaultProps,
        initialFilters: {
          ...defaultProps.initialFilters,
          filter: 'due-today' as const,
        },
      };

      rerender(<GarmentsClient {...propsWithFilter} />);

      expect(screen.getByLabelText('Filter By')).toHaveTextContent('Due Today');
    });
  });
});
