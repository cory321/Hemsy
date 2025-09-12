import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DayView } from '@/components/appointments/views/DayView';
import { format } from 'date-fns';
import type { Appointment } from '@/types';

// Mock Material UI theme
jest.mock('@mui/material/styles', () => ({
  ...jest.requireActual('@mui/material/styles'),
  useTheme: () => ({
    palette: {
      divider: '#e0e0e0',
      common: { white: '#ffffff' },
      primary: { main: '#1976d2' },
      action: {
        disabled: '#bdbdbd',
      },
    },
    shadows: Array(25).fill('none'),
    breakpoints: {
      down: () => '@media (max-width:600px)',
    },
  }),
}));

// Mock useMediaQuery
jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  useMediaQuery: () => false,
}));

// Mock timezone action used by useUserTimezone
jest.mock('@/lib/actions/user-timezone', () => ({
  getCurrentUserTimezone: jest.fn(async () => 'UTC'),
}));

describe('DayView - Appointment spanning across 30-minute rows', () => {
  // Use a UTC midday timestamp to avoid timezone date-shift in formatting
  const mockDate = new Date('2024-01-15T12:00:00Z');
  const dateStr = format(mockDate, 'yyyy-MM-dd');

  const mockShopHours = [
    {
      day_of_week: mockDate.getDay(), // Match the test date's day
      open_time: '09:00',
      close_time: '17:00',
      is_closed: false,
    },
  ];

  const renderWithQuery = (ui: React.ReactElement) => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    );
  };

  it('positions and sizes appointment blocks based on duration', async () => {
    const appointments: Appointment[] = [
      {
        id: 'apt-60',

        shop_id: 'shop1',
        client_id: 'client1',
        date: dateStr,
        start_time: '09:00',
        end_time: '10:00', // 60 minutes
        type: 'fitting',
        status: 'confirmed',

        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        client: {
          id: 'client1',
          shop_id: 'shop1',
          first_name: 'Alice',
          last_name: 'Johnson',
          email: 'alice@example.com',
          phone_number: '555-1111',
          accept_email: true,
          accept_sms: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      },
      {
        id: 'apt-90',

        shop_id: 'shop1',
        client_id: 'client2',
        date: dateStr,
        start_time: '10:30',
        end_time: '12:00', // 90 minutes
        type: 'consultation',
        status: 'confirmed',

        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        client: {
          id: 'client2',
          shop_id: 'shop1',
          first_name: 'Bob',
          last_name: 'Smith',
          email: 'bob@example.com',
          phone_number: '555-2222',
          accept_email: true,
          accept_sms: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      },
    ];

    renderWithQuery(
      <DayView
        currentDate={mockDate}
        appointments={appointments}
        shopHours={mockShopHours}
      />
    );

    const first = await screen.findByTestId('dayview-appointment-apt-60');
    const second = await screen.findByTestId('dayview-appointment-apt-90');

    // 30-minute row height is 120px, pixels per minute = 120/30
    const pxPerMinute = 120 / 30;

    const firstHeight = parseFloat(first.getAttribute('data-height') || '0');
    const firstTop = parseFloat(first.getAttribute('data-top') || '0');
    expect(Math.round(firstHeight)).toBe(Math.round(60 * pxPerMinute));
    expect(Math.round(firstTop)).toBe(Math.round(0 * pxPerMinute)); // starts at 09:00 which is grid start

    const secondHeight = parseFloat(second.getAttribute('data-height') || '0');
    const secondTop = parseFloat(second.getAttribute('data-top') || '0');
    // second starts at 10:30, shop opens 09:00, so offset = 90 minutes
    expect(Math.round(secondTop)).toBe(Math.round(90 * pxPerMinute));
    expect(Math.round(secondHeight)).toBe(Math.round(90 * pxPerMinute));

    // Also ensure client names render
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    expect(screen.getByText('Bob Smith')).toBeInTheDocument();
  });
});
