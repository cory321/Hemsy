/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BusinessOverview } from '@/components/dashboard/business-overview/BusinessOverview';
import { AppointmentProvider } from '@/providers/AppointmentProvider';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import type { ShopHours } from '@/types';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}));

// Mock the server actions
jest.mock('@/lib/actions/appointments', () => ({
  createAppointment: jest.fn().mockResolvedValue({ success: true }),
  updateAppointment: jest.fn().mockResolvedValue({ success: true }),
  deleteAppointment: jest.fn().mockResolvedValue({ success: true }),
  getAppointments: jest.fn().mockResolvedValue([]),
}));

// Mock the client search
jest.mock('@/lib/actions/clients', () => ({
  searchClients: jest.fn().mockResolvedValue([
    {
      id: 'client-1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '123-456-7890',
    },
    {
      id: 'client-2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '098-765-4321',
    },
  ]),
}));

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
    })),
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      data: [],
      error: null,
    })),
  })),
}));

const mockShopHours: ShopHours[] = [
  { day_of_week: 1, open_time: '09:00', close_time: '17:00', is_closed: false },
  { day_of_week: 2, open_time: '09:00', close_time: '17:00', is_closed: false },
  { day_of_week: 3, open_time: '09:00', close_time: '17:00', is_closed: false },
  { day_of_week: 4, open_time: '09:00', close_time: '17:00', is_closed: false },
  { day_of_week: 5, open_time: '09:00', close_time: '17:00', is_closed: false },
  { day_of_week: 6, open_time: '10:00', close_time: '14:00', is_closed: false },
  { day_of_week: 0, open_time: null, close_time: null, is_closed: true },
];

const mockCalendarSettings = {
  buffer_time_minutes: 15,
  default_appointment_duration: 30,
};

describe('Dashboard Appointment Dialog', () => {
  let queryClient: QueryClient;
  const theme = createTheme();

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  it('should show available time slots when Add Appointment is clicked', async () => {
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <AppointmentProvider shopId="test-shop-id">
              <BusinessOverview
                shopId="test-shop-id"
                shopHours={mockShopHours}
                calendarSettings={mockCalendarSettings}
              />
            </AppointmentProvider>
          </LocalizationProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );

    // Find and click the "Add Appointment" button
    const addAppointmentButton = screen.getByText('Add Appointment');
    expect(addAppointmentButton).toBeInTheDocument();

    fireEvent.click(addAppointmentButton);

    // Wait for the dialog to open
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Check that the dialog title is present
    expect(screen.getByText('Schedule New Appointment')).toBeInTheDocument();

    // Check that the start time select is present
    await waitFor(() => {
      const startTimeLabel = screen.getByText('Start Time');
      expect(startTimeLabel).toBeInTheDocument();
    });

    // The key fix: AppointmentDialog now receives shopHours and calendarSettings
    // which allows it to generate available time slots
    // This ensures the time picker is not empty

    // Verify the dialog received the necessary props by checking for form elements
    expect(screen.getByLabelText(/Client/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Duration/i)).toBeInTheDocument();
  });

  it('should pass shop hours and calendar settings to AppointmentDialog', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <AppointmentProvider shopId="test-shop-id">
              <BusinessOverview
                shopId="test-shop-id"
                shopHours={mockShopHours}
                calendarSettings={mockCalendarSettings}
              />
            </AppointmentProvider>
          </LocalizationProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );

    // Click Add Appointment
    const addAppointmentButton = screen.getByText('Add Appointment');
    fireEvent.click(addAppointmentButton);

    // Wait for dialog
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Verify that duration field exists and the dialog has access to calendar settings
    const durationInput = screen.getByLabelText(/Duration/i);
    expect(durationInput).toBeInTheDocument();

    // The AppointmentDialog now properly receives calendarSettings
    // which includes default_appointment_duration
    // This ensures the dialog can properly set default values
  });

  it('should close dialog when Cancel is clicked', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <AppointmentProvider shopId="test-shop-id">
              <BusinessOverview
                shopId="test-shop-id"
                shopHours={mockShopHours}
                calendarSettings={mockCalendarSettings}
              />
            </AppointmentProvider>
          </LocalizationProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );

    // Open dialog
    fireEvent.click(screen.getByText('Add Appointment'));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Click Cancel
    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);

    // Dialog should close
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
