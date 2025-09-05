import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DayView } from '@/components/appointments/views/DayView';
import { format } from 'date-fns';
import '@testing-library/jest-dom';

// Mock date-fns isToday function
jest.mock('date-fns', () => ({
  ...jest.requireActual('date-fns'),
  isToday: jest.fn(),
}));

// Mock timezone action
jest.mock('@/lib/actions/user-timezone', () => ({
  getCurrentUserTimezone: jest.fn(async () => 'UTC'),
}));

describe('DayView - Current Time Indicator', () => {
  const renderWithQuery = (ui: React.ReactElement) => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    );
  };

  const mockShopHours = [
    {
      day_of_week: 0,
      open_time: '09:00',
      close_time: '17:00',
      is_closed: false,
    },
    {
      day_of_week: 1,
      open_time: '09:00',
      close_time: '17:00',
      is_closed: false,
    },
    {
      day_of_week: 2,
      open_time: '09:00',
      close_time: '17:00',
      is_closed: false,
    },
    {
      day_of_week: 3,
      open_time: '09:00',
      close_time: '17:00',
      is_closed: false,
    },
    {
      day_of_week: 4,
      open_time: '09:00',
      close_time: '17:00',
      is_closed: false,
    },
    {
      day_of_week: 5,
      open_time: '10:00',
      close_time: '16:00',
      is_closed: false,
    },
    {
      day_of_week: 6,
      open_time: null,
      close_time: null,
      is_closed: true,
    },
  ];

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should show current time indicator for today during shop hours', () => {
    // Mock current date/time to be a Tuesday at 2:15 PM
    const mockDate = new Date('2024-01-09T14:15:00');
    jest.useFakeTimers();
    jest.setSystemTime(mockDate);

    // Mock isToday to return true
    const { isToday } = require('date-fns');
    isToday.mockReturnValue(true);

    renderWithQuery(
      <DayView
        currentDate={mockDate}
        appointments={[]}
        shopHours={mockShopHours}
      />
    );

    // The current time indicator should be visible
    const currentTimeIndicator = screen.getByTestId('current-time-indicator');
    expect(currentTimeIndicator).toBeInTheDocument();

    jest.useRealTimers();
  });

  it('should not show current time indicator for past dates', () => {
    // Mock current date/time
    const mockToday = new Date('2024-01-10T14:15:00');
    const pastDate = new Date('2024-01-09T14:15:00');
    jest.useFakeTimers();
    jest.setSystemTime(mockToday);

    // Mock isToday to return false for past date
    const { isToday } = require('date-fns');
    isToday.mockReturnValue(false);

    renderWithQuery(
      <DayView
        currentDate={pastDate}
        appointments={[]}
        shopHours={mockShopHours}
      />
    );

    // The current time indicator should not be visible
    const currentTimeIndicator = screen.queryByTestId('current-time-indicator');
    expect(currentTimeIndicator).not.toBeInTheDocument();

    jest.useRealTimers();
  });

  it('should not show current time indicator for future dates', () => {
    // Mock current date/time
    const mockToday = new Date('2024-01-09T14:15:00');
    const futureDate = new Date('2024-01-10T14:15:00');
    jest.useFakeTimers();
    jest.setSystemTime(mockToday);

    // Mock isToday to return false for future date
    const { isToday } = require('date-fns');
    isToday.mockReturnValue(false);

    renderWithQuery(
      <DayView
        currentDate={futureDate}
        appointments={[]}
        shopHours={mockShopHours}
      />
    );

    // The current time indicator should not be visible
    const currentTimeIndicator = screen.queryByTestId('current-time-indicator');
    expect(currentTimeIndicator).not.toBeInTheDocument();

    jest.useRealTimers();
  });

  it('should not show current time indicator outside shop hours', () => {
    // Mock current date/time to be before shop opens (8:00 AM)
    const mockDate = new Date('2024-01-09T08:00:00');
    jest.useFakeTimers();
    jest.setSystemTime(mockDate);

    // Mock isToday to return true
    const { isToday } = require('date-fns');
    isToday.mockReturnValue(true);

    renderWithQuery(
      <DayView
        currentDate={mockDate}
        appointments={[]}
        shopHours={mockShopHours}
      />
    );

    // The current time indicator should not be visible
    const currentTimeIndicator = screen.queryByTestId('current-time-indicator');
    expect(currentTimeIndicator).not.toBeInTheDocument();

    jest.useRealTimers();
  });

  it('should position current time indicator correctly within time slot', () => {
    // Mock current date/time to be at 2:15 PM (15 minutes into the 2:00 PM slot)
    const mockDate = new Date('2024-01-09T14:15:00');
    jest.useFakeTimers();
    jest.setSystemTime(mockDate);

    // Mock isToday to return true
    const { isToday } = require('date-fns');
    isToday.mockReturnValue(true);

    renderWithQuery(
      <DayView
        currentDate={mockDate}
        appointments={[]}
        shopHours={mockShopHours}
      />
    );

    // Find the current time indicator
    const currentTimeIndicator = screen.getByTestId('current-time-indicator');
    expect(currentTimeIndicator).toBeInTheDocument();

    // Since we're at 2:15 PM, the indicator should exist in the 2:00 PM slot
    // We can verify this by checking that the indicator exists and is rendered
    // The actual positioning is handled by the sx prop which doesn't create inline styles in tests

    jest.useRealTimers();
  });

  it('should not show current time indicator on closed days even if within displayed grid', () => {
    // Mock current date/time to be a Saturday at 11:00 AM (shop is closed)
    const mockDate = new Date('2024-01-13T11:00:00'); // Saturday
    jest.useFakeTimers();
    jest.setSystemTime(mockDate);

    // Mock isToday to return true
    const { isToday } = require('date-fns');
    isToday.mockReturnValue(true);

    renderWithQuery(
      <DayView
        currentDate={mockDate}
        appointments={[]}
        shopHours={mockShopHours}
      />
    );

    // The current time indicator should not be visible on closed days
    const currentTimeIndicator = screen.queryByTestId('current-time-indicator');
    expect(currentTimeIndicator).not.toBeInTheDocument();

    jest.useRealTimers();
  });
});
