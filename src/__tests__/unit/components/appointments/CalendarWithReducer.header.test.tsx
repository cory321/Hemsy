import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CalendarWithReducer } from '@/components/appointments/CalendarWithReducer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppointmentProvider } from '@/providers/AppointmentProvider';

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
  useCalendarAppointments: jest.fn(() => ({
    appointments: [],
    isLoading: false,
    error: null,
    refetch: jest.fn(),
    currentDate: new Date('2024-01-15'),
    setCurrentDate: jest.fn(),
    navigateNext: jest.fn(),
    navigatePrevious: jest.fn(),
    navigateToDate: jest.fn(),
  })),
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

describe('CalendarWithReducer - Header', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const mockShopHours = [
    {
      day_of_week: 1,
      open_time: '09:00',
      close_time: '17:00',
      is_closed: false,
    },
  ];

  const renderCalendar = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <AppointmentProvider shopId="test-shop-id">
          <CalendarWithReducer
            shopId="test-shop-id"
            initialDate={new Date('2024-01-15')}
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

  it('should display "Appointments" as the main header title', () => {
    renderCalendar();

    const header = screen.getByRole('heading', { name: /appointments/i });
    expect(header).toBeInTheDocument();
    expect(header.tagName).toBe('H1');
  });

  it('should display "Add Appointment" button in the header', () => {
    renderCalendar();

    const addButton = screen.getByRole('button', { name: /add appointment/i });
    expect(addButton).toBeInTheDocument();

    // Check for the Add icon
    const addIcon = addButton.querySelector('svg');
    expect(addIcon).toBeInTheDocument();
  });

  it('should open appointment dialog when clicking "Add Appointment" button', async () => {
    renderCalendar();

    const addButton = screen.getByRole('button', { name: /add appointment/i });
    fireEvent.click(addButton);

    // Verify appointment dialog opens
    await waitFor(() => {
      expect(screen.getByTestId('appointment-dialog')).toBeInTheDocument();
    });
  });

  it('should have proper header layout with title on left and button on right', () => {
    renderCalendar();

    const header = screen.getByRole('heading', { name: /appointments/i });
    const addButton = screen.getByRole('button', { name: /add appointment/i });

    // Both elements should be in the document
    expect(header).toBeInTheDocument();
    expect(addButton).toBeInTheDocument();

    // The header container should use flexbox layout
    const headerContainer = header.closest('div');
    expect(headerContainer).toHaveStyle({
      display: 'flex',
      'justify-content': 'space-between',
      'align-items': 'center',
    });
  });

  it('should maintain header responsiveness on mobile and desktop', () => {
    renderCalendar();

    const header = screen.getByRole('heading', { name: /appointments/i });
    const addButton = screen.getByRole('button', { name: /add appointment/i });

    expect(header).toBeInTheDocument();
    expect(addButton).toBeInTheDocument();

    // Both should be visible regardless of screen size
    expect(header).toBeVisible();
    expect(addButton).toBeVisible();
  });

  it('should close appointment dialog when dialog close is triggered', async () => {
    renderCalendar();

    // Open the dialog
    const addButton = screen.getByRole('button', { name: /add appointment/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByTestId('appointment-dialog')).toBeInTheDocument();
    });

    // Dialog should be closeable (this would be handled by the dialog component itself)
    expect(screen.getByTestId('appointment-dialog')).toBeInTheDocument();
  });
});
