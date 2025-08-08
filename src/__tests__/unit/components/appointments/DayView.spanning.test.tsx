import React from 'react';
import { render, screen } from '@testing-library/react';
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

describe('DayView - Appointment spanning across 30-minute rows', () => {
  const mockDate = new Date('2024-01-15');
  const dateStr = format(mockDate, 'yyyy-MM-dd');

  const mockShopHours = [
    {
      day_of_week: mockDate.getDay(), // Match the test date's day
      open_time: '09:00',
      close_time: '17:00',
      is_closed: false,
    },
  ];

  it('positions and sizes appointment blocks based on duration', () => {
    const appointments: Appointment[] = [
      {
        id: 'apt-60',
        user_id: 'user1',
        shop_id: 'shop1',
        client_id: 'client1',
        date: dateStr,
        start_time: '09:00',
        end_time: '10:00', // 60 minutes
        type: 'fitting',
        status: 'confirmed',
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        client: { first_name: 'Alice', last_name: 'Johnson' },
      },
      {
        id: 'apt-90',
        user_id: 'user1',
        shop_id: 'shop1',
        client_id: 'client2',
        date: dateStr,
        start_time: '10:30',
        end_time: '12:00', // 90 minutes
        type: 'consultation',
        status: 'confirmed',
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        client: { first_name: 'Bob', last_name: 'Smith' },
      },
    ];

    render(
      <DayView
        currentDate={mockDate}
        appointments={appointments}
        shopHours={mockShopHours}
      />
    );

    const first = screen.getByTestId('dayview-appointment-apt-60');
    const second = screen.getByTestId('dayview-appointment-apt-90');

    // 30-minute row height is 80px, pixels per minute = 80/30
    const pxPerMinute = 80 / 30;

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
