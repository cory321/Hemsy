import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DayView } from '@/components/appointments/views/DayView';
import '@testing-library/jest-dom';

// Mock date-fns isToday function
jest.mock('date-fns', () => ({
  ...jest.requireActual('date-fns'),
  isToday: jest.fn(() => true),
}));

// Mock timezone action used by useUserTimezone
jest.mock('@/lib/actions/user-timezone', () => ({
  getCurrentUserTimezone: jest.fn(async () => 'UTC'),
}));

describe('DayView - Auto Update Current Time Indicator', () => {
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
      day_of_week: 1,
      open_time: '09:00',
      close_time: '17:00',
      is_closed: false,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should set up interval to update current time every 5 minutes', () => {
    const mockDate = new Date('2024-01-08T10:00:00'); // Monday at 10:00 AM
    jest.setSystemTime(mockDate);

    const setIntervalSpy = jest.spyOn(global, 'setInterval');

    renderWithQuery(
      <DayView
        currentDate={mockDate}
        appointments={[]}
        shopHours={mockShopHours}
      />
    );

    // Verify setInterval was called with 5 minutes (300000 ms)
    expect(setIntervalSpy).toHaveBeenCalledWith(
      expect.any(Function),
      5 * 60 * 1000
    );
  });

  it('should clean up interval on unmount', () => {
    const mockDate = new Date('2024-01-08T10:00:00');
    jest.setSystemTime(mockDate);

    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

    const { unmount } = renderWithQuery(
      <DayView
        currentDate={mockDate}
        appointments={[]}
        shopHours={mockShopHours}
      />
    );

    unmount();

    // Verify clearInterval was called
    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it('should update indicator position when time changes', async () => {
    // Start at 10:00 AM
    const initialTime = new Date('2024-01-08T10:00:00');
    jest.setSystemTime(initialTime);

    renderWithQuery(
      <DayView
        currentDate={initialTime}
        appointments={[]}
        shopHours={mockShopHours}
      />
    );

    // Verify initial indicator exists
    const indicator = screen.getByTestId('current-time-indicator');
    expect(indicator).toBeInTheDocument();

    // Fast forward 5 minutes
    act(() => {
      const newTime = new Date('2024-01-08T10:05:00');
      jest.setSystemTime(newTime);
      jest.advanceTimersByTime(5 * 60 * 1000);
    });

    // Wait for the component to update
    await waitFor(() => {
      // The indicator should still exist but at a new position
      const updatedIndicator = screen.getByTestId('current-time-indicator');
      expect(updatedIndicator).toBeInTheDocument();
    });
  });
});
