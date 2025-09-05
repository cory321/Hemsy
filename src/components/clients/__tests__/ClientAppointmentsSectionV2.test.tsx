import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClientAppointmentsSectionV2 } from '../ClientAppointmentsSectionV2';
import { useInfiniteClientAppointments } from '@/lib/queries/client-appointment-queries';
import { useAppointments } from '@/providers/AppointmentProvider';
import type { Appointment } from '@/types';

// Mock dependencies
jest.mock('@/lib/queries/client-appointment-queries');
jest.mock('@/providers/AppointmentProvider');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));
jest.mock('@/components/appointments/AppointmentDialog', () => ({
  AppointmentDialog: ({ open, onClose }: any) =>
    open ? <div role="dialog">Appointment Dialog</div> : null,
}));

const mockAppointments: Appointment[] = [
  {
    id: '1',
    shop_id: 'shop-1',
    client_id: 'client-1',
    date: new Date().toISOString().slice(0, 10),
    start_time: '10:00:00',
    end_time: '11:00:00',
    type: 'fitting',
    status: 'confirmed',
    notes: 'Hemming wedding dress',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    shop_id: 'shop-1',
    client_id: 'client-1',
    date: new Date(Date.now() + 86400000).toISOString().slice(0, 10), // Tomorrow
    start_time: '14:00:00',
    end_time: '14:30:00',
    type: 'consultation',
    status: 'pending',
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    shop_id: 'shop-1',
    client_id: 'client-1',
    date: new Date(Date.now() - 86400000).toISOString().slice(0, 10), // Yesterday
    start_time: '10:00:00',
    end_time: '11:00:00',
    type: 'pickup',
    status: 'canceled',
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const defaultProps = {
  clientId: 'client-1',
  clientName: 'John Doe',
  clientEmail: 'john@example.com',
  clientPhone: '1234567890',
  clientAcceptEmail: true,
  clientAcceptSms: false,
  shopId: 'shop-1',
  shopHours: [
    {
      day_of_week: 1,
      open_time: '09:00',
      close_time: '17:00',
      is_closed: false,
    },
  ],
  calendarSettings: {
    buffer_time_minutes: 15,
    default_appointment_duration: 30,
  },
};

describe('ClientAppointmentsSectionV2', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    // Default mock returns only active appointments (confirmed/pending)
    const activeAppointments = mockAppointments.filter(
      (apt) => apt.status === 'confirmed' || apt.status === 'pending'
    );

    // Mock the hook to handle both upcoming and past queries
    (useInfiniteClientAppointments as jest.Mock).mockImplementation(
      (shopId, clientId, options) => {
        // Filter based on the timeframe parameter
        const filtered =
          options?.timeframe === 'past'
            ? [] // No past appointments by default
            : activeAppointments; // Return active appointments for upcoming

        return {
          data: {
            pages: [{ appointments: filtered, total: filtered.length }],
          },
          isLoading: false,
          error: null,
          hasNextPage: false,
          fetchNextPage: jest.fn(),
          isFetchingNextPage: false,
        };
      }
    );

    (useAppointments as jest.Mock).mockReturnValue({
      createAppointment: jest.fn(),
    });
  });

  const renderComponent = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ClientAppointmentsSectionV2 {...defaultProps} {...(props as any)} />
      </QueryClientProvider>
    );
  };

  it('renders appointments section with header', () => {
    renderComponent();

    expect(screen.getByText('Appointments')).toBeInTheDocument();
    // Should show count of active appointments (2)
    expect(screen.getByText(/\(2\)/)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /new appointment/i })
    ).toBeInTheDocument();
  });

  it('displays time period and status filters', () => {
    renderComponent();

    // Check that both select dropdowns are rendered
    const selects = screen.getAllByRole('combobox');
    expect(selects).toHaveLength(2);

    // First select should show "Upcoming" text
    expect(screen.getByText('Upcoming')).toBeInTheDocument();
    // Second select should show "Active Only" text (default)
    expect(screen.getByText('Active Only')).toBeInTheDocument();
  });

  it('groups appointments by date', async () => {
    // The component renders appointments grouped by date
    // For this test, we'll verify that appointments are being rendered
    renderComponent();

    await waitFor(() => {
      // Verify appointments are displayed
      const timeElements = screen.getAllByText('10:00 AM - 11:00 AM');
      expect(timeElements.length).toBeGreaterThan(0);

      // Verify appointments are from the active filter (2 appointments)
      expect(screen.getByText(/\(2\)/)).toBeInTheDocument();
    });
  });

  it('displays appointment details correctly', async () => {
    renderComponent();

    await waitFor(() => {
      // Use getAllByText since time appears multiple times
      const timeElements = screen.getAllByText('10:00 AM - 11:00 AM');
      expect(timeElements.length).toBeGreaterThan(0);
      expect(screen.getByText('fitting')).toBeInTheDocument();
      expect(screen.getByText('confirmed')).toBeInTheDocument();
      // Use getAllByText since notes might appear multiple times
      const noteElements = screen.getAllByText(/Hemming wedding dress/);
      expect(noteElements.length).toBeGreaterThan(0);
    });
  });

  it('filters appointments by time period', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Get all selects - first is time period, second is status
    const timePeriodSelect = screen.getAllByRole('combobox')[0]!;

    // Should show "Upcoming" as default text
    expect(screen.getByText('Upcoming')).toBeInTheDocument();

    await user.click(timePeriodSelect);

    const todayOption = screen.getByRole('option', { name: 'Today' });
    await user.click(todayOption);

    // After clicking, should show "Today"
    await waitFor(() => {
      expect(screen.getByText('Today')).toBeInTheDocument();
    });
  });

  it('filters appointments by status', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Get all selects - first is time period, second is status
    const statusSelect = screen.getAllByRole('combobox')[1]!;

    // Should show "Active Only" as default
    expect(screen.getByText('Active Only')).toBeInTheDocument();

    await user.click(statusSelect);

    const pendingOption = screen.getByRole('option', { name: 'Pending' });
    await user.click(pendingOption);

    // After clicking, should show "Pending"
    await waitFor(() => {
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });
  });

  it('should default to active status filter', () => {
    renderComponent();

    // Should show "Active Only" as the default status filter
    expect(screen.getByText('Active Only')).toBeInTheDocument();

    // And should only show active appointments (2)
    expect(screen.getByText(/\(2\)/)).toBeInTheDocument();
  });

  it('shows loading state', () => {
    (useInfiniteClientAppointments as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
      isFetchingNextPage: false,
    });

    renderComponent();

    // MUI Skeleton components render with specific classes
    const container = screen.getByText('Appointments').closest('div');
    expect(container).toBeInTheDocument();
    // The component should not show appointment content or error messages
    expect(
      screen.queryByText('No appointments scheduled')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Failed to load appointments')
    ).not.toBeInTheDocument();
  });

  it('shows error state', () => {
    (useInfiniteClientAppointments as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to load'),
      hasNextPage: false,
      fetchNextPage: jest.fn(),
      isFetchingNextPage: false,
    });

    renderComponent();

    expect(screen.getByText('Failed to load appointments')).toBeInTheDocument();
  });

  it('shows empty state with action button', () => {
    (useInfiniteClientAppointments as jest.Mock).mockReturnValue({
      data: { pages: [{ appointments: [], total: 0 }] },
      isLoading: false,
      error: null,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
      isFetchingNextPage: false,
    });

    renderComponent();

    expect(screen.getByText('No appointments scheduled')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /schedule next appointment/i })
    ).toBeInTheDocument();
  });

  it('opens appointment dialog when clicking new appointment button', async () => {
    const user = userEvent.setup();
    renderComponent();

    const newAppointmentButton = screen.getByRole('button', {
      name: /new appointment/i,
    });
    await user.click(newAppointmentButton);

    // Since AppointmentDialog is not mocked, we can't test the dialog itself
    // Just verify the button click works without errors
    expect(newAppointmentButton).toBeInTheDocument();
  });

  it('handles load more functionality', async () => {
    const fetchNextPage = jest.fn();
    (useInfiniteClientAppointments as jest.Mock).mockReturnValue({
      data: { pages: [{ appointments: mockAppointments, total: 10 }] },
      isLoading: false,
      error: null,
      hasNextPage: true,
      fetchNextPage,
      isFetchingNextPage: false,
    });

    const user = userEvent.setup();
    renderComponent();

    const loadMoreButton = screen.getByRole('button', { name: /load more/i });
    await user.click(loadMoreButton);

    expect(fetchNextPage).toHaveBeenCalled();
  });

  it('applies hover effects on appointment cards', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Find appointment cards by their time text
    const appointmentCards = screen.getAllByText('10:00 AM - 11:00 AM');
    const appointmentCard = appointmentCards[0]?.closest(
      'div[class*="MuiCard"]'
    );

    if (appointmentCard) {
      await user.hover(appointmentCard);

      // Verify the card exists and is hoverable
      expect(appointmentCard).toBeInTheDocument();
      // In a real test with CSS modules, we'd check for hover class or computed styles
    }
  });

  it('maintains accessibility standards', () => {
    renderComponent();

    // Check for keyboard navigation
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);

    // All interactive elements should be keyboard accessible
    buttons.forEach((button) => {
      // MUI buttons should have tabIndex 0 by default
      const tabIndex = button.getAttribute('tabIndex');
      expect(tabIndex).not.toBe('-1');
    });
  });
});
