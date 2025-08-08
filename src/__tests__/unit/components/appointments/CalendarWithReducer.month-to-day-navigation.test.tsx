import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CalendarWithReducer } from '@/components/appointments/CalendarWithReducer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppointmentProvider } from '@/providers/AppointmentProvider';
import { format } from 'date-fns';

// Mock the Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => {
    const channelMock = {
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(() => ({
        unsubscribe: jest.fn(),
      })),
    };

    return {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              data: [],
              error: null,
            })),
            single: jest.fn(() => ({
              data: null,
              error: null,
            })),
          })),
        })),
      })),
      channel: jest.fn(() => channelMock),
      removeChannel: jest.fn(),
    };
  }),
}));

// Mock the calendar hook
jest.mock('@/hooks/useCalendarAppointments', () => ({
  useCalendarAppointments: jest.fn((options) => {
    const [currentDate, setCurrentDate] = React.useState(options.initialDate);
    const [view, setView] = React.useState(options.view);

    return {
      appointments: [],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      currentDate,
      setCurrentDate,
      navigateNext: jest.fn(),
      navigatePrevious: jest.fn(),
      navigateToDate: jest.fn((date) => setCurrentDate(date)),
    };
  }),
}));

// Mock the dialogs
jest.mock('@/components/appointments/AppointmentDialog', () => ({
  AppointmentDialog: ({ open }: { open: boolean }) =>
    open ? (
      <div data-testid="appointment-dialog">Appointment Dialog</div>
    ) : null,
}));

jest.mock('@/components/appointments/AppointmentDetailsDialog', () => ({
  AppointmentDetailsDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="details-dialog">Details Dialog</div> : null,
}));

describe('CalendarWithReducer - Month to Day Navigation', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

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
      open_time: '09:00',
      close_time: '17:00',
      is_closed: false,
    },
    {
      day_of_week: 6,
      open_time: null,
      close_time: null,
      is_closed: true,
    },
  ];

  const renderCalendar = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <AppointmentProvider shopId="test-shop-id">
          <CalendarWithReducer
            shopId="test-shop-id"
            initialDate={new Date('2099-01-15')}
            initialView="month"
            shopHours={mockShopHours}
            {...props}
          />
        </AppointmentProvider>
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should navigate to day view when clicking a date in month view', async () => {
    renderCalendar();

    // Wait for calendar to load
    await waitFor(() => {
      expect(screen.getByText('January 2099')).toBeInTheDocument();
    });

    // Verify we're in month view
    const monthButton = screen.getByRole('button', {
      name: /month/i,
      pressed: true,
    });
    expect(monthButton).toBeInTheDocument();

    // Click on a specific date (e.g., January 20th)
    const dateToClick = screen.getByText('20');
    fireEvent.click(dateToClick);

    // Verify view changed to day view
    await waitFor(() => {
      const dayButton = screen.getByRole('button', {
        name: /day/i,
        pressed: true,
      });
      expect(dayButton).toBeInTheDocument();
    });

    // Verify the date header shows the selected date
    await waitFor(() => {
      // Look specifically for the header showing the date (ignore day-of-week)
      expect(screen.getByText(/January 20, 2099/i)).toBeInTheDocument();
    });

    // Verify appointment dialog is NOT opened (we're just navigating, not creating)
    expect(screen.queryByTestId('appointment-dialog')).not.toBeInTheDocument();
  });

  it('should open appointment dialog when clicking time slot in day view', async () => {
    renderCalendar({ initialView: 'day' });

    // Wait for day view to load
    await waitFor(() => {
      // Verify we're in day view
      const dayButton = screen.getByRole('button', {
        name: /day/i,
        pressed: true,
      });
      expect(dayButton).toBeInTheDocument();
    });

    // Click on a time slot (9:00 AM)
    const timeSlot = screen.getByText('9:00 AM');
    fireEvent.click(timeSlot);

    // Verify appointment dialog opens
    await waitFor(() => {
      expect(screen.getByTestId('appointment-dialog')).toBeInTheDocument();
    });
  });

  it('should navigate to day view when clicking day header in week view', async () => {
    renderCalendar({ initialView: 'week' });

    // Wait for week view to load
    await waitFor(() => {
      const weekButton = screen.getByRole('button', {
        name: /week/i,
        pressed: true,
      });
      expect(weekButton).toBeInTheDocument();
    });

    // Click on a day header that exists in the displayed week (15th)
    const dayHeader = screen.getByText(/\b15\b/);
    fireEvent.click(dayHeader);

    // Verify view changed to day view
    await waitFor(() => {
      const dayButton = screen.getByRole('button', {
        name: /day/i,
        pressed: true,
      });
      expect(dayButton).toBeInTheDocument();
    });

    // Verify the date header shows the selected date (January 15, 2099)
    await waitFor(() => {
      expect(screen.getByText(/January 15, 2099/i)).toBeInTheDocument();
    });

    // Verify appointment dialog is NOT opened
    expect(screen.queryByTestId('appointment-dialog')).not.toBeInTheDocument();
  });

  it('should open appointment dialog when clicking time slot in week view', async () => {
    renderCalendar({ initialView: 'week' });

    // Wait for week view to load
    await waitFor(() => {
      const weekButton = screen.getByRole('button', {
        name: /week/i,
        pressed: true,
      });
      expect(weekButton).toBeInTheDocument();
    });

    // Find and click a time slot (use explicit test id from WeekViewDesktop)
    const weekSlot = screen.getByTestId('week-slot-09:00');
    fireEvent.click(weekSlot);

    // Verify appointment dialog opens
    await waitFor(() => {
      expect(screen.getByTestId('appointment-dialog')).toBeInTheDocument();
    });
  });
});
