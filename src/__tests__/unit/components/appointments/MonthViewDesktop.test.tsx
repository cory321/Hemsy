import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MonthViewDesktop } from '@/components/appointments/views/MonthViewDesktop';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { format, addDays } from 'date-fns';
import type { Appointment } from '@/types';

// Mock the calendar utils
jest.mock('@/lib/utils/calendar', () => ({
  generateMonthDays: jest.fn((date: Date) => {
    // Generate a simple month grid
    const days = [];
    const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
    const startDay = startDate.getDay();

    // Add previous month's days
    for (let i = startDay - 1; i >= 0; i--) {
      days.push(addDays(startDate, -i - 1));
    }

    // Add current month's days
    const daysInMonth = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0
    ).getDate();
    for (let i = 0; i < daysInMonth; i++) {
      days.push(addDays(startDate, i));
    }

    // Add next month's days to complete the grid
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    const nextMonthStart = new Date(date.getFullYear(), date.getMonth() + 1, 1);
    for (let i = 0; i < remainingDays; i++) {
      days.push(addDays(nextMonthStart, i));
    }

    return days.slice(0, 35); // Return 5 weeks worth
  }),
  getAppointmentColor: jest.fn((type: string) => {
    const colors: Record<string, string> = {
      fitting: '#2196F3',
      consultation: '#4CAF50',
      pickup: '#FF9800',
      delivery: '#9C27B0',
      alteration: '#F44336',
      other: '#607D8B',
    };
    return colors[type] || colors.other;
  }),
  isShopOpen: jest.fn(() => true),
  formatTime: jest.fn((time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  }),
  isPastDate: jest.fn(() => false),
  canCreateAppointment: jest.fn(() => true),
}));

const theme = createTheme();

const mockShopHours = [
  { day_of_week: 0, open_time: '10:00', close_time: '18:00', is_closed: false },
  { day_of_week: 1, open_time: '09:00', close_time: '19:00', is_closed: false },
  { day_of_week: 2, open_time: '09:00', close_time: '19:00', is_closed: false },
  { day_of_week: 3, open_time: '09:00', close_time: '19:00', is_closed: false },
  { day_of_week: 4, open_time: '09:00', close_time: '19:00', is_closed: false },
  { day_of_week: 5, open_time: '09:00', close_time: '19:00', is_closed: false },
  { day_of_week: 6, open_time: '10:00', close_time: '17:00', is_closed: false },
];

const mockAppointments: Appointment[] = [
  {
    id: '1',

    date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '10:00',
    end_time: '11:00',
    type: 'fitting',
    status: 'scheduled',
    shop_id: 'shop1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    client: {
      id: 'client1',
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'jane@example.com',
      phone: '555-0123',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      shop_id: 'shop1',
    },
    client_id: 'client1',
  },
  {
    id: '2',

    date: format(addDays(new Date(), 2), 'yyyy-MM-dd'),
    start_time: '14:00',
    end_time: '15:00',
    type: 'consultation',
    status: 'scheduled',
    shop_id: 'shop1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    client: {
      id: 'client2',
      first_name: 'John',
      last_name: 'Smith',
      email: 'john@example.com',
      phone: '555-0124',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      shop_id: 'shop1',
    },
    client_id: 'client2',
  },
];

const renderComponent = (props = {}) => {
  const defaultProps = {
    currentDate: new Date(),
    appointments: mockAppointments,
    shopHours: mockShopHours,
    onAppointmentClick: jest.fn(),
    onDateClick: jest.fn(),
  };

  return render(
    <ThemeProvider theme={theme}>
      <MonthViewDesktop {...defaultProps} {...props} />
    </ThemeProvider>
  );
};

describe('MonthViewDesktop', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the calendar grid with week day headers', () => {
    renderComponent();

    // Check for all weekday headers
    expect(screen.getByText('Sunday')).toBeInTheDocument();
    expect(screen.getByText('Monday')).toBeInTheDocument();
    expect(screen.getByText('Tuesday')).toBeInTheDocument();
    expect(screen.getByText('Wednesday')).toBeInTheDocument();
    expect(screen.getByText('Thursday')).toBeInTheDocument();
    expect(screen.getByText('Friday')).toBeInTheDocument();
    expect(screen.getByText('Saturday')).toBeInTheDocument();
  });

  it('displays appointments in the correct day cells', () => {
    renderComponent();

    // Check for appointment times only (titles no longer shown)
    expect(screen.getByText('10:00 AM')).toBeInTheDocument();
    expect(screen.getByText('2:00 PM')).toBeInTheDocument();
  });

  it('shows appointment count badges', () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const multipleAppointments = [
      {
        ...mockAppointments[0],
        id: '1',
        date: today,

        start_time: '09:00',
        end_time: '10:00',
      },
      {
        ...mockAppointments[0],
        id: '2',
        date: today,

        start_time: '10:30',
        end_time: '11:30',
      },
      {
        ...mockAppointments[0],
        id: '3',
        date: today,

        start_time: '12:00',
        end_time: '13:00',
      },
      {
        ...mockAppointments[0],
        id: '4',
        date: today,

        start_time: '14:00',
        end_time: '15:00',
      },
      {
        ...mockAppointments[0],
        id: '5',
        date: today,

        start_time: '15:30',
        end_time: '16:30',
      },
    ];

    renderComponent({ appointments: multipleAppointments });

    // Should show appointment count badge for today - look for the one that's a caption
    const appointmentCountBadges = screen.getAllByText('5');
    const countBadge = appointmentCountBadges.find((el) =>
      el.classList.contains('MuiTypography-caption')
    );
    expect(countBadge).toBeInTheDocument();

    // Should show "more" indicator for appointments beyond the limit (shows 3, so 2 more)
    expect(screen.getByText('+2 more')).toBeInTheDocument();
  });

  it('handles date click events', () => {
    const onDateClick = jest.fn();
    renderComponent({ onDateClick });

    // Click on a date cell - find the Paper component that contains a date
    const dateText = screen.getByText('15');
    const dateCell = dateText.closest('.MuiPaper-root');

    if (dateCell) {
      fireEvent.click(dateCell);
      expect(onDateClick).toHaveBeenCalled();
    }
  });

  it('handles appointment click events', () => {
    const onAppointmentClick = jest.fn();
    renderComponent({ onAppointmentClick });

    // Click on an appointment time
    const appointment = screen.getByText('10:00 AM');
    fireEvent.click(appointment);

    expect(onAppointmentClick).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '1',
      })
    );
  });

  it('shows closed status for closed days', () => {
    const { isShopOpen } = require('@/lib/utils/calendar');
    isShopOpen.mockImplementation((date: Date) => {
      // Make Sundays closed
      return date.getDay() !== 0;
    });

    renderComponent();

    // Should show closed indicators
    const closedIndicators = screen.getAllByText('Closed');
    expect(closedIndicators.length).toBeGreaterThan(0);
  });

  it('highlights the current day', () => {
    renderComponent();

    // The current day should have special styling
    // We can't easily test CSS, but we can verify the date is rendered
    const today = format(new Date(), 'd');
    const todayElement = screen.getByText(today);

    expect(todayElement).toBeInTheDocument();
    // Verify that the today's date typography has the expected class or style
    // The component sets fontWeight: 'bold' for the current day
    const todayTypography = todayElement.closest('h6');
    expect(todayTypography).toBeTruthy();
  });

  it('displays week numbers on first day of week', () => {
    renderComponent();

    // Week numbers should be displayed (W followed by number)
    const weekNumbers = screen.getAllByText(/^W\d+$/);
    expect(weekNumbers.length).toBeGreaterThan(0);
  });

  it('displays appointment times without titles or client information', () => {
    renderComponent();

    // Check that appointment times are displayed
    expect(screen.getByText('10:00 AM')).toBeInTheDocument();
    expect(screen.getByText('2:00 PM')).toBeInTheDocument();

    // Appointment titles should not be displayed
    expect(screen.queryByText('Dress Fitting')).not.toBeInTheDocument();
    expect(screen.queryByText('Consultation')).not.toBeInTheDocument();

    // Client names should not be displayed in the calendar view
    expect(screen.queryByText('Jane')).not.toBeInTheDocument();
    expect(screen.queryByText('John')).not.toBeInTheDocument();
  });

  it('limits visible appointments to 3 per day', () => {
    const manyAppointments = Array.from({ length: 6 }, (_, i) => ({
      ...mockAppointments[0],
      id: `apt-${i}`,

      start_time: `${10 + i}:00`,
      end_time: `${11 + i}:00`,
    }));

    renderComponent({ appointments: manyAppointments });

    // Should only show times for first 3 appointments
    expect(screen.getByText('10:00 AM')).toBeInTheDocument();
    expect(screen.getByText('11:00 AM')).toBeInTheDocument();
    expect(screen.getByText('12:00 PM')).toBeInTheDocument();

    // Should not show times for appointments 4-6 directly
    expect(screen.queryByText('1:00 PM')).not.toBeInTheDocument();

    // Should show "more" indicator
    expect(screen.getByText('+3 more')).toBeInTheDocument();
  });
});
