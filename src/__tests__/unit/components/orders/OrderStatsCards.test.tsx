import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import OrderStatsCards from '@/components/orders/OrderStatsCards';
import type { OrderStats } from '@/lib/actions/orders';

// Mock the formatCurrency function
jest.mock('@/lib/utils/formatting', () => ({
  formatCurrency: (cents: number) => {
    const dollars = cents / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(dollars);
  },
}));

describe('OrderStatsCards', () => {
  const mockStats: OrderStats = {
    unpaidCount: 12,
    unpaidAmountCents: 245000, // $2,450
    dueThisWeekCount: 5,
    dueThisWeekAmountCents: 120000, // $1,200
    monthlyRevenueCents: 875000, // $8,750
    monthlyRevenueComparison: 15,
    inProgressCount: 8,
    inProgressAmountCents: 320000, // $3,200
  };

  const mockOnCardClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering stats', () => {
    it('should render all four stat cards', () => {
      render(<OrderStatsCards stats={mockStats} />);

      expect(screen.getByText('Unpaid Balance')).toBeInTheDocument();
      expect(screen.getByText('Due This Week')).toBeInTheDocument();
      expect(screen.getByText('This Month')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
    });

    it('should display correct values for unpaid balance', () => {
      render(<OrderStatsCards stats={mockStats} />);

      expect(screen.getByText('$2,450.00')).toBeInTheDocument();
      expect(screen.getByText('12 orders')).toBeInTheDocument();
    });

    it('should display correct values for due this week', () => {
      render(<OrderStatsCards stats={mockStats} />);

      expect(screen.getByText('5 orders')).toBeInTheDocument();
      expect(screen.getByText('$1,200.00')).toBeInTheDocument();
    });

    it('should display correct values for monthly revenue with trend', () => {
      render(<OrderStatsCards stats={mockStats} />);

      expect(screen.getByText('$8,750.00')).toBeInTheDocument();
      expect(screen.getByText('+15%')).toBeInTheDocument();
    });

    it('should display correct values for in progress orders', () => {
      render(<OrderStatsCards stats={mockStats} />);

      expect(screen.getByText('8 orders')).toBeInTheDocument();
      expect(screen.getByText('$3,200.00')).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('should show skeletons when loading', () => {
      const { container } = render(
        <OrderStatsCards stats={null} loading={true} />
      );

      const skeletons = container.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBeGreaterThan(0);
      expect(skeletons.length).toBe(8); // 2 skeletons per card × 4 cards
    });
  });

  describe('trend indicators', () => {
    it('should show upward trend for positive comparison', () => {
      render(<OrderStatsCards stats={mockStats} />);

      expect(screen.getByText('+15%')).toBeInTheDocument();
      // The TrendingUpIcon should be rendered
      expect(screen.getByTestId('TrendingUpIcon')).toBeInTheDocument();
    });

    it('should show downward trend for negative comparison', () => {
      const negativeStats = {
        ...mockStats,
        monthlyRevenueComparison: -10,
      };

      render(<OrderStatsCards stats={negativeStats} />);

      expect(screen.getByText('-10%')).toBeInTheDocument();
      expect(screen.getByTestId('TrendingDownIcon')).toBeInTheDocument();
    });

    it('should show flat trend for zero comparison', () => {
      const flatStats = {
        ...mockStats,
        monthlyRevenueComparison: 0,
      };

      render(<OrderStatsCards stats={flatStats} />);

      expect(screen.getByText('+0%')).toBeInTheDocument();
      expect(screen.getByTestId('TrendingFlatIcon')).toBeInTheDocument();
    });
  });

  describe('card click functionality', () => {
    it('should call onCardClick with unpaid filter when unpaid card is clicked', () => {
      render(
        <OrderStatsCards stats={mockStats} onCardClick={mockOnCardClick} />
      );

      const unpaidCard = screen
        .getByText('Unpaid Balance')
        .closest('.MuiCard-root');
      fireEvent.click(unpaidCard!);

      expect(mockOnCardClick).toHaveBeenCalledWith('unpaid');
    });

    it('should call onCardClick with due_this_week filter when due this week card is clicked', () => {
      render(
        <OrderStatsCards stats={mockStats} onCardClick={mockOnCardClick} />
      );

      const dueCard = screen
        .getByText('Due This Week')
        .closest('.MuiCard-root');
      fireEvent.click(dueCard!);

      expect(mockOnCardClick).toHaveBeenCalledWith('due_this_week');
    });

    it('should not call onCardClick when monthly revenue card is clicked', () => {
      render(
        <OrderStatsCards stats={mockStats} onCardClick={mockOnCardClick} />
      );

      const monthlyCard = screen
        .getByText('This Month')
        .closest('.MuiCard-root');
      fireEvent.click(monthlyCard!);

      expect(mockOnCardClick).not.toHaveBeenCalled();
    });

    it('should call onCardClick with in_progress filter when in progress card is clicked', () => {
      render(
        <OrderStatsCards stats={mockStats} onCardClick={mockOnCardClick} />
      );

      const progressCard = screen
        .getByText('In Progress')
        .closest('.MuiCard-root');
      fireEvent.click(progressCard!);

      expect(mockOnCardClick).toHaveBeenCalledWith('in_progress');
    });

    it('should not apply hover styles when onCardClick is not provided', () => {
      render(<OrderStatsCards stats={mockStats} />);

      const unpaidCard = screen
        .getByText('Unpaid Balance')
        .closest('.MuiCard-root');
      expect(unpaidCard).toHaveStyle({ cursor: 'default' });
    });
  });

  describe('edge cases', () => {
    it('should handle null stats gracefully', () => {
      render(<OrderStatsCards stats={null} />);

      expect(screen.getAllByText('$0.00')).toHaveLength(4); // All four cards show $0.00
      expect(screen.getAllByText('0 orders')).toHaveLength(3); // Due this week, and In progress show "0 orders"
    });

    it('should handle zero values correctly', () => {
      const zeroStats: OrderStats = {
        unpaidCount: 0,
        unpaidAmountCents: 0,
        dueThisWeekCount: 0,
        dueThisWeekAmountCents: 0,
        monthlyRevenueCents: 0,
        monthlyRevenueComparison: 0,
        inProgressCount: 0,
        inProgressAmountCents: 0,
      };

      render(<OrderStatsCards stats={zeroStats} />);

      expect(screen.getAllByText('$0.00')).toHaveLength(4);
      expect(screen.getAllByText('0 orders')).toHaveLength(3);
    });

    it('should show correct color for due this week when count is zero', () => {
      const noDueStats = {
        ...mockStats,
        dueThisWeekCount: 0,
      };

      render(<OrderStatsCards stats={noDueStats} />);

      const dueThisWeekValue = screen.getByText('0 orders');
      // When no orders are due, color should be text.secondary
      expect(dueThisWeekValue).toHaveClass('MuiTypography-root');
    });
  });
});
