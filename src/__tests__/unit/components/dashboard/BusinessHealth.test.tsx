import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BusinessHealth } from '@/components/dashboard/business-overview/BusinessHealth';

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

describe('BusinessHealth', () => {
  const mockOnViewFinances = jest.fn();

  const defaultProps = {
    currentMonthRevenueCents: 875000, // $8,750
    lastMonthRevenueCents: 761000, // $7,610
    monthlyRevenueComparison: 15,
    unpaidBalanceCents: 245000, // $2,450
    unpaidOrdersCount: 12,
    currentPeriodLabel: 'Dec 1-8',
    comparisonPeriodLabel: 'Nov 1-8',
    rolling30DayLabel: 'Nov 9 - Dec 8',
    previous30DayLabel: 'Oct 9 - Nov 8',

    // Enhanced fields
    dailyAverageThisMonth: 134375, // ~$1,343.75 per day
    periodContext: 'early' as const,
    transactionCount: 5,
    rolling30DayRevenue: 1200000, // $12,000
    previous30DayRevenue: 1000000, // $10,000
    rolling30DayComparison: 20,

    onViewFinances: mockOnViewFinances,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering with data', () => {
    it('should render business health title', () => {
      render(<BusinessHealth {...defaultProps} />);

      expect(screen.getByText('Business Health')).toBeInTheDocument();
    });

    it('should display current month revenue correctly', () => {
      render(<BusinessHealth {...defaultProps} />);

      expect(screen.getByText('$8,750.00')).toBeInTheDocument();
      expect(screen.getByText('Dec 1-8 (early in month)')).toBeInTheDocument();
    });

    it('should display month comparison with positive trend and period labels', () => {
      render(<BusinessHealth {...defaultProps} />);

      expect(screen.getByText('+15%')).toBeInTheDocument();
      expect(screen.getByText('Dec 1-8 (early in month)')).toBeInTheDocument();
      expect(screen.getByTestId('TrendingUpIcon')).toBeInTheDocument();
    });

    it('should display unpaid balance correctly', () => {
      render(<BusinessHealth {...defaultProps} />);

      expect(screen.getByText('$2,450.00')).toBeInTheDocument();
      expect(screen.getByText('12 orders')).toBeInTheDocument();
      expect(screen.getByText('Unpaid Balance')).toBeInTheDocument();
    });

    it('should render view orders button', () => {
      render(<BusinessHealth {...defaultProps} />);

      const button = screen.getByRole('button', { name: /view orders/i });
      expect(button).toBeInTheDocument();
    });
  });

  describe('trend indicators', () => {
    it('should show positive trend with green styling', () => {
      render(<BusinessHealth {...defaultProps} />);

      const trendChip = screen.getByText('+15%');
      expect(trendChip).toBeInTheDocument();
      expect(screen.getByTestId('TrendingUpIcon')).toBeInTheDocument();
    });

    it('should show negative trend with red styling', () => {
      const negativeProps = {
        ...defaultProps,
        monthlyRevenueComparison: -10,
      };

      render(<BusinessHealth {...negativeProps} />);

      expect(screen.getByText('-10%')).toBeInTheDocument();
      expect(screen.getByTestId('TrendingDownIcon')).toBeInTheDocument();
    });

    it('should not show trend chip when comparison is zero', () => {
      const zeroProps = {
        ...defaultProps,
        monthlyRevenueComparison: 0,
      };

      render(<BusinessHealth {...zeroProps} />);

      expect(screen.queryByText('0%')).not.toBeInTheDocument();
      expect(screen.queryByTestId('TrendingUpIcon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('TrendingDownIcon')).not.toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('should show loading placeholders when loading', () => {
      render(<BusinessHealth loading={true} />);

      const loadingTexts = screen.getAllByText('...');
      expect(loadingTexts.length).toBeGreaterThan(0);
    });

    it('should not show trend chip when loading', () => {
      render(<BusinessHealth {...defaultProps} loading={true} />);

      expect(screen.queryByTestId('TrendingUpIcon')).not.toBeInTheDocument();
      expect(screen.queryByText('+15%')).not.toBeInTheDocument();
    });
  });

  describe('button interaction', () => {
    it('should call onViewFinances when button is clicked', () => {
      render(<BusinessHealth {...defaultProps} />);

      const button = screen.getByRole('button', { name: /view orders/i });
      fireEvent.click(button);

      expect(mockOnViewFinances).toHaveBeenCalledTimes(1);
    });
  });

  describe('edge cases', () => {
    it('should handle zero values gracefully', () => {
      const zeroProps = {
        currentMonthRevenueCents: 0,
        lastMonthRevenueCents: 0,
        monthlyRevenueComparison: 0,
        unpaidBalanceCents: 0,
        unpaidOrdersCount: 0,
        onViewFinances: mockOnViewFinances,
      };

      render(<BusinessHealth {...zeroProps} />);

      expect(screen.getAllByText('$0.00')).toHaveLength(2); // Current month and unpaid balance
      expect(screen.getByText('0 orders')).toBeInTheDocument();
    });

    it('should hide view orders button when onViewFinances is not provided', () => {
      const { onViewFinances, ...propsWithoutCallback } = defaultProps;

      render(<BusinessHealth {...propsWithoutCallback} />);

      const button = screen.queryByRole('button', { name: /view orders/i });
      expect(button).not.toBeInTheDocument();
    });

    it('should hide unpaid balance section when hideUnpaidBalance is true', () => {
      render(<BusinessHealth {...defaultProps} hideUnpaidBalance={true} />);

      expect(screen.queryByText('Unpaid Balance')).not.toBeInTheDocument();
      expect(screen.queryByText('$2,450.00')).not.toBeInTheDocument();
      expect(screen.queryByText('12 orders')).not.toBeInTheDocument();
    });

    it('should handle large numbers correctly', () => {
      const largeProps = {
        ...defaultProps,
        currentMonthRevenueCents: 1234567890, // $12,345,678.90
        unpaidBalanceCents: 9876543210, // $98,765,432.10
      };

      render(<BusinessHealth {...largeProps} />);

      expect(screen.getByText('$12,345,678.90')).toBeInTheDocument();
      expect(screen.getByText('$98,765,432.10')).toBeInTheDocument();
    });
  });
});
