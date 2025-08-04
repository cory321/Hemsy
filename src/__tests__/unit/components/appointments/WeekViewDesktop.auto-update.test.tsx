import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { WeekViewDesktop } from '@/components/appointments/views/WeekViewDesktop';
import '@testing-library/jest-dom';

// Mock date-fns isToday function
jest.mock('date-fns', () => ({
  ...jest.requireActual('date-fns'),
  isToday: jest.fn((date) => {
    // Return true for the specific test date
    const testDate = new Date('2024-01-08T10:00:00');
    return date.toDateString() === testDate.toDateString();
  }),
}));

describe('WeekViewDesktop - Auto Update Current Time Indicator', () => {
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

    render(
      <WeekViewDesktop
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

    const { unmount } = render(
      <WeekViewDesktop
        currentDate={mockDate}
        appointments={[]}
        shopHours={mockShopHours}
      />
    );

    unmount();

    // Verify clearInterval was called
    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it('should maintain current time indicator across updates', async () => {
    // Start at 10:00 AM on Monday
    const initialTime = new Date('2024-01-08T10:00:00');
    jest.setSystemTime(initialTime);

    render(
      <WeekViewDesktop
        currentDate={initialTime}
        appointments={[]}
        shopHours={mockShopHours}
      />
    );

    // Verify initial indicator exists
    const initialIndicator = screen.getByTestId('current-time-indicator');
    expect(initialIndicator).toBeInTheDocument();

    // Fast forward 5 minutes
    act(() => {
      const newTime = new Date('2024-01-08T10:05:00');
      jest.setSystemTime(newTime);
      jest.advanceTimersByTime(5 * 60 * 1000);
    });

    // Wait for the component to update
    await waitFor(() => {
      // The indicator should still exist
      const updatedIndicator = screen.getByTestId('current-time-indicator');
      expect(updatedIndicator).toBeInTheDocument();
    });
  });
});
