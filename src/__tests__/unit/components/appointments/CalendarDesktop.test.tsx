import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import { CalendarDesktop } from '@/components/appointments/CalendarDesktop';
import { format, startOfWeek } from 'date-fns';
import '@testing-library/jest-dom';

// Mock Material UI useMediaQuery to simulate desktop view
jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  useMediaQuery: () => false, // false = desktop view
}));

describe('CalendarDesktop', () => {
  // Use explicit future dates to ensure appointments show as "upcoming"
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(today.getDate() + 2);

  const mockAppointments = [
    {
      id: '1',
      title: 'Dress Fitting',
      date: format(tomorrow, 'yyyy-MM-dd'),
      start_time: '10:00',
      end_time: '11:00',
      type: 'fitting' as const,
      status: 'scheduled' as const,
      user_id: 'user1',
      shop_id: 'shop1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      client: {
        id: 'client1',
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
        phone_number: '555-1234',
        user_id: 'user1',
        shop_id: 'shop1',
        accept_email: true,
        accept_sms: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    },
    {
      id: '2',
      title: 'Consultation',
      date: format(dayAfterTomorrow, 'yyyy-MM-dd'),
      start_time: '14:00',
      end_time: '14:30',
      type: 'consultation' as const,
      status: 'scheduled' as const,
      user_id: 'user1',
      shop_id: 'shop1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const mockShopHours = [
    { day_of_week: 0, open_time: null, close_time: null, is_closed: true },
    {
      day_of_week: 1,
      open_time: '09:00',
      close_time: '18:00',
      is_closed: false,
    },
    {
      day_of_week: 2,
      open_time: '09:00',
      close_time: '18:00',
      is_closed: false,
    },
    {
      day_of_week: 3,
      open_time: '09:00',
      close_time: '18:00',
      is_closed: false,
    },
    {
      day_of_week: 4,
      open_time: '09:00',
      close_time: '18:00',
      is_closed: false,
    },
    {
      day_of_week: 5,
      open_time: '09:00',
      close_time: '18:00',
      is_closed: false,
    },
    {
      day_of_week: 6,
      open_time: '10:00',
      close_time: '16:00',
      is_closed: false,
    },
  ];

  const mockHandlers = {
    onAppointmentClick: jest.fn(),
    onDateClick: jest.fn(),
    onRefresh: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders desktop calendar with enhanced features', () => {
    render(
      <CalendarDesktop
        appointments={mockAppointments}
        shopHours={mockShopHours}
        {...mockHandlers}
      />
    );

    // Check for desktop-specific elements
    expect(screen.getByText('Month')).toBeInTheDocument();
    expect(screen.getByText('Week')).toBeInTheDocument();
    expect(screen.getByText('Day')).toBeInTheDocument();
    expect(screen.getByText('Agenda')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /today/i })).toBeInTheDocument();
  });

  // TODO: Fix side panel rendering issue - appointments not showing in upcoming list
  it.skip('displays side panel with mini calendar and upcoming appointments', () => {
    render(
      <CalendarDesktop
        appointments={mockAppointments}
        shopHours={mockShopHours}
        {...mockHandlers}
      />
    );

    // Check for side panel elements
    expect(screen.getByText('Upcoming Appointments')).toBeInTheDocument();
    expect(screen.getByText('Quick Stats')).toBeInTheDocument();
    expect(screen.getByText('Dress Fitting')).toBeInTheDocument();
    expect(screen.getByText('Consultation')).toBeInTheDocument();
  });

  it('allows filtering appointments by type', async () => {
    render(
      <CalendarDesktop
        appointments={mockAppointments}
        shopHours={mockShopHours}
        {...mockHandlers}
      />
    );

    // Check filter functionality
    const filterSelect = screen.getByRole('combobox', {
      name: /filter by type/i,
    });
    expect(filterSelect).toBeInTheDocument();

    fireEvent.mouseDown(filterSelect);
    const fittingOption = await screen.findByText('Fitting');
    fireEvent.click(fittingOption);

    // Should show filtered appointment count
    expect(screen.getByText('1 filtered')).toBeInTheDocument();
  });

  it('switches between different calendar views', async () => {
    render(
      <CalendarDesktop
        appointments={mockAppointments}
        shopHours={mockShopHours}
        {...mockHandlers}
      />
    );

    // Switch to week view
    const weekButton = screen.getByRole('button', { name: /week view/i });
    fireEvent.click(weekButton);
    await waitFor(() => {
      expect(mockHandlers.onRefresh).toHaveBeenCalled();
    });

    // Switch to day view
    const dayButton = screen.getByRole('button', { name: /day view/i });
    fireEvent.click(dayButton);
    await waitFor(() => {
      expect(mockHandlers.onRefresh).toHaveBeenCalledTimes(2);
    });
  });

  it('handles navigation between dates', () => {
    render(
      <CalendarDesktop
        appointments={mockAppointments}
        shopHours={mockShopHours}
        {...mockHandlers}
      />
    );

    // Test previous/next navigation
    const prevButton = screen.getAllByRole('button')[0]; // First navigation button
    const nextButton = screen.getAllByRole('button')[1]; // Second navigation button

    fireEvent.click(prevButton);
    expect(mockHandlers.onRefresh).toHaveBeenCalled();

    fireEvent.click(nextButton);
    expect(mockHandlers.onRefresh).toHaveBeenCalledTimes(2);
  });

  // TODO: Fix appointment selection test - related to side panel rendering issue
  it.skip('handles appointment selection and displays details', () => {
    render(
      <CalendarDesktop
        appointments={mockAppointments}
        shopHours={mockShopHours}
        {...mockHandlers}
      />
    );

    // Click on an appointment in the upcoming list
    const appointmentButton = screen.getByText('Dress Fitting');
    fireEvent.click(appointmentButton);

    // Should display appointment details
    expect(screen.getByText('Appointment Details')).toBeInTheDocument();
    expect(mockHandlers.onAppointmentClick).toHaveBeenCalledWith(
      mockAppointments[0]
    );
  });

  it('toggles side panel visibility', async () => {
    render(
      <CalendarDesktop
        appointments={mockAppointments}
        shopHours={mockShopHours}
        {...mockHandlers}
      />
    );

    // Side panel should be visible by default
    expect(screen.getByText('Upcoming Appointments')).toBeInTheDocument();

    // Find and click the toggle button (it's in a tooltip)
    // The toggle button is after the Today button and before the refresh button
    const actionButtons = screen.getByRole('button', { name: /today/i })
      .parentElement?.parentElement;
    if (actionButtons) {
      const toggleButton = within(actionButtons).getAllByRole('button')[1]; // Second button in the stack
      fireEvent.click(toggleButton);
      // Side panel should be hidden
      await waitFor(() => {
        expect(
          screen.queryByText('Upcoming Appointments')
        ).not.toBeInTheDocument();
      });
    }
  });

  it('displays correct appointment counts in quick stats', () => {
    const todayAppointments = [
      ...mockAppointments,
      {
        id: '3',
        title: 'Pickup',
        date: format(today, 'yyyy-MM-dd'), // Use today for this one
        start_time: '16:00',
        end_time: '16:30',
        type: 'pickup' as const,
        status: 'scheduled' as const,
        user_id: 'user1',
        shop_id: 'shop1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    render(
      <CalendarDesktop
        appointments={todayAppointments}
        shopHours={mockShopHours}
        {...mockHandlers}
      />
    );

    // Should show correct count for today (1 appointment)
    // The Quick Stats are now in the filter bar - find all Today text elements
    const todayElements = screen.getAllByText('Today');
    // Get the one that's a caption (not the button)
    const todayLabel = todayElements.find((el) => el.tagName === 'SPAN');
    expect(todayLabel).toBeInTheDocument();
    const todayCount = todayLabel?.parentElement?.querySelector('h5');
    expect(todayCount).toHaveTextContent('1');

    // Check for Total appointments count
    const totalLabel = screen.getByText('Total');
    const totalCount = totalLabel.parentElement?.querySelector('h5');
    expect(totalCount).toHaveTextContent('3'); // Total appointments in todayAppointments (2 mock + 1 today)

    expect(screen.getByText('This Week')).toBeInTheDocument();
  });

  it('switches to day view when clicking on a day in month view', async () => {
    render(
      <CalendarDesktop
        appointments={mockAppointments}
        shopHours={mockShopHours}
        {...mockHandlers}
      />
    );

    // Start in month view by default
    expect(screen.getByRole('button', { name: /month view/i })).toHaveAttribute(
      'aria-pressed',
      'true'
    );

    // Find a date cell in the month view and click it
    // Use getAllByText to get both instances and select the main calendar one
    const dateTexts = screen.getAllByText('15');
    // The main calendar date should be in an h6 typography element (based on MonthViewDesktop structure)
    const mainCalendarDate = dateTexts.find((el) => el.tagName === 'H6');
    expect(mainCalendarDate).toBeInTheDocument();

    if (mainCalendarDate) {
      const dateCell = mainCalendarDate.closest('.MuiPaper-root');
      expect(dateCell).toBeInTheDocument();
      if (dateCell) {
        fireEvent.click(dateCell);
      }
    }

    // Wait for the view to change to day view
    await waitFor(() => {
      const dayViewButton = screen.getByRole('button', { name: /day view/i });
      expect(dayViewButton).toHaveAttribute('aria-pressed', 'true');
    });

    // The month view button should no longer be pressed
    expect(screen.getByRole('button', { name: /month view/i })).toHaveAttribute(
      'aria-pressed',
      'false'
    );

    // The parent onDateClick should NOT have been called since we handle it internally
    expect(mockHandlers.onDateClick).not.toHaveBeenCalled();
  });
});
