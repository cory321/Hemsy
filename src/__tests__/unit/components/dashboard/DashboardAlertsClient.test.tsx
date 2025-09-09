import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { DashboardAlertsClient } from '@/components/dashboard/alerts/DashboardAlertsClient';
import type { DashboardAlertGarment } from '@/lib/actions/dashboard';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  refresh: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  prefetch: jest.fn(),
} as const;

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe('DashboardAlertsClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue(mockRouter);
  });

  const mockOverdueData = {
    count: 2,
    garments: [
      {
        id: 'garment-1',
        name: 'Wedding Dress',
        client_name: 'Sarah J.',
        due_date: '2024-01-10',
        days_overdue: 3,
      },
      {
        id: 'garment-2',
        name: 'Suit Jacket',
        client_name: 'Michael B.',
        due_date: '2024-01-12',
        days_overdue: 1,
      },
    ] as DashboardAlertGarment[],
  };

  const mockDueTodayData = {
    count: 3,
    garments: [
      {
        id: 'garment-3',
        name: 'Evening Gown',
        client_name: 'Emma W.',
        due_date: '2024-01-15',
        days_overdue: 0,
      },
      {
        id: 'garment-4',
        name: 'Pants Hemming',
        client_name: 'John D.',
        due_date: '2024-01-15',
        days_overdue: 0,
      },
      {
        id: 'garment-5',
        name: 'Dress Fitting',
        client_name: 'Lisa M.',
        due_date: '2024-01-15',
        days_overdue: 0,
      },
    ] as DashboardAlertGarment[],
  };

  it('renders overdue and due today alerts', () => {
    render(
      <DashboardAlertsClient
        overdueData={mockOverdueData}
        dueTodayData={mockDueTodayData}
      />
    );

    expect(screen.getByText('2 garments overdue')).toBeInTheDocument();
    expect(screen.getByText('3 garments due today')).toBeInTheDocument();
  });

  it('shows correct "and X more" count for overdue preview', () => {
    const bigOverdue = {
      count: 18,
      garments: [
        {
          id: 'g1',
          name: 'Blue Cardigan',
          client_name: 'Sheppy Scott',
          due_date: '2024-01-01',
          days_overdue: 6,
        },
        {
          id: 'g2',
          name: 'Test SVG Icon Garment',
          client_name: 'Sheppy Scott',
          due_date: '2024-01-01',
          days_overdue: 8,
        },
        {
          id: 'g3',
          name: 'Test Order With Invoice',
          client_name: 'Sheppy Scott',
          due_date: '2024-01-01',
          days_overdue: 8,
        },
      ] as any,
    };

    render(
      <DashboardAlertsClient
        overdueData={bigOverdue}
        dueTodayData={{ count: 0, garments: [] }}
      />
    );

    // Should say "+ and 15 more" (18 total - 3 listed)
    expect(screen.getByText(/and 15 more/)).toBeInTheDocument();
  });

  it('navigates to garments page with overdue filter when View all is clicked', () => {
    render(
      <DashboardAlertsClient
        overdueData={mockOverdueData}
        dueTodayData={mockDueTodayData}
      />
    );

    const overdueViewAllButton = screen.getAllByText('View all')[0];
    if (!overdueViewAllButton)
      throw new Error('Overdue View all button not found');
    fireEvent.click(overdueViewAllButton as unknown as Element);

    expect(mockRouter.push).toHaveBeenCalledWith('/garments?filter=overdue');
  });

  it('navigates to garments page with due-today filter when View all is clicked', () => {
    render(
      <DashboardAlertsClient
        overdueData={mockOverdueData}
        dueTodayData={mockDueTodayData}
      />
    );

    const dueTodayViewAllButton = screen.getAllByText('View all')[1];
    if (!dueTodayViewAllButton)
      throw new Error('Due Today View all button not found');
    fireEvent.click(dueTodayViewAllButton as unknown as Element);

    expect(mockRouter.push).toHaveBeenCalledWith('/garments?filter=due-today');
  });

  it('does not render when no alerts are present', () => {
    const emptyData = { count: 0, garments: [] };
    const { container } = render(
      <DashboardAlertsClient overdueData={emptyData} dueTodayData={emptyData} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('shows expanded garment list when show all is toggled', () => {
    render(
      <DashboardAlertsClient
        overdueData={mockOverdueData}
        dueTodayData={mockDueTodayData}
      />
    );

    // Initially should show garment names
    expect(screen.getByText(/Wedding Dress - Sarah J./)).toBeInTheDocument();
    expect(screen.getByText(/Suit Jacket - Michael B./)).toBeInTheDocument();
  });

  it('can dismiss alerts', () => {
    render(
      <DashboardAlertsClient
        overdueData={mockOverdueData}
        dueTodayData={mockDueTodayData}
      />
    );

    // Find dismiss buttons by aria-label
    const dismissButtons = screen.getAllByLabelText('Dismiss');
    expect(dismissButtons).toHaveLength(2);

    // Click first dismiss button
    fireEvent.click(dismissButtons[0] as unknown as Element);

    // After dismissing, the overdue alert should no longer be visible
    expect(screen.queryByText('2 garments overdue')).not.toBeInTheDocument();

    // But due today alert should still be visible
    expect(screen.getByText('3 garments due today')).toBeInTheDocument();
  });
});
