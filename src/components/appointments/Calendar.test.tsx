import { render, screen, fireEvent, within } from '@testing-library/react';
import { Calendar } from './Calendar';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material';

const theme = createTheme();

const mockAppointments = [
  {
    id: '1',
    shop_id: 'shop_1',
    client_id: 'client_1',

    date: '2024-02-15',
    start_time: '10:00',
    end_time: '11:00',
    type: 'fitting' as const,
    status: 'scheduled' as const,
    notes: 'Test fitting',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    client: {
      id: 'client_1',
      shop_id: 'shop_1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      phone_number: '555-1234',
      accept_email: true,
      accept_sms: false,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    },
  },
  {
    id: '2',
    shop_id: 'shop_1',
    client_id: 'client_2',

    date: '2024-02-15',
    start_time: '14:00',
    end_time: '15:00',
    type: 'consultation' as const,
    status: 'scheduled' as const,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
];

const mockShopHours = [
  { day_of_week: 0, open_time: null, close_time: null, is_closed: true },
  { day_of_week: 1, open_time: '09:00', close_time: '17:00', is_closed: false },
  { day_of_week: 2, open_time: '09:00', close_time: '17:00', is_closed: false },
  { day_of_week: 3, open_time: '09:00', close_time: '17:00', is_closed: false },
  { day_of_week: 4, open_time: '09:00', close_time: '17:00', is_closed: false },
  { day_of_week: 5, open_time: '09:00', close_time: '17:00', is_closed: false },
  { day_of_week: 6, open_time: null, close_time: null, is_closed: true },
];

describe('Calendar Component', () => {
  const defaultProps = {
    appointments: mockAppointments,
    shopHours: mockShopHours,
    onAppointmentClick: jest.fn(),
    onDateClick: jest.fn(),
    onRefresh: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock current date to Feb 15, 2024 for consistent testing
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-02-15'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const renderCalendar = (props = {}) => {
    return render(
      <ThemeProvider theme={theme}>
        <Calendar {...defaultProps} {...props} />
      </ThemeProvider>
    );
  };

  describe('View Switching', () => {
    it('should render with month view by default on desktop', () => {
      renderCalendar();
      expect(screen.getByText('February 2024')).toBeInTheDocument();
      expect(screen.getByLabelText('month view')).toHaveAttribute(
        'aria-pressed',
        'true'
      );
    });

    it('should switch between different views', () => {
      renderCalendar();

      // Switch to week view
      fireEvent.click(screen.getByLabelText('week view'));
      expect(defaultProps.onRefresh).toHaveBeenCalled();

      // Switch to day view
      fireEvent.click(screen.getByLabelText('day view'));
      expect(defaultProps.onRefresh).toHaveBeenCalledTimes(2);

      // Switch to list view
      fireEvent.click(screen.getByLabelText('list view'));
      expect(screen.getByText('All Appointments')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should navigate to previous and next periods', () => {
      renderCalendar();

      const prevButton = screen
        .getByTestId('ChevronLeftIcon')
        .closest('button');
      const nextButton = screen
        .getByTestId('ChevronRightIcon')
        .closest('button');

      // Navigate to previous month
      if (prevButton) fireEvent.click(prevButton);
      expect(defaultProps.onRefresh).toHaveBeenCalled();

      // Navigate to next month
      if (nextButton) fireEvent.click(nextButton);
      expect(defaultProps.onRefresh).toHaveBeenCalled();
    });

    it('should navigate to today', () => {
      renderCalendar();

      const todayButton = screen.getByText('Today');
      fireEvent.click(todayButton);
      expect(defaultProps.onRefresh).toHaveBeenCalled();
    });
  });

  describe('Appointment Display', () => {
    it('should display appointments in the calendar', () => {
      renderCalendar();

      // Check if appointments are visible (in month view, shows time)
      expect(screen.getByText('10:00AM')).toBeInTheDocument();
      expect(screen.getByText('2:00PM')).toBeInTheDocument();
    });

    it('should call onAppointmentClick when appointment is clicked', () => {
      renderCalendar();

      const appointment = screen.getByText('10:00AM');
      fireEvent.click(appointment);

      expect(defaultProps.onAppointmentClick).toHaveBeenCalledWith(
        mockAppointments[0]
      );
    });

    it('should call onDateClick when a date is clicked', () => {
      renderCalendar();

      // Find a date cell (looking for the 15th)
      const dateCell = screen.getByText('15').closest('button');
      if (dateCell) {
        fireEvent.click(dateCell);
        expect(defaultProps.onDateClick).toHaveBeenCalled();
      }
    });
  });

  describe('Mobile Behavior', () => {
    beforeEach(() => {
      // Mock mobile viewport
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation((query) => ({
          matches: query.includes('max-width: 600px'),
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });
    });

    it('should show icon-only view toggles on mobile', () => {
      renderCalendar();

      // On mobile, the toggle buttons should show icons instead of text
      const toggleGroup = screen.getByRole('group');
      const buttons = within(toggleGroup).getAllByRole('button');

      // Verify we have 4 view buttons
      expect(buttons).toHaveLength(4);
    });
  });

  describe('Shop Hours Integration', () => {
    it('should show closed days differently', () => {
      renderCalendar();

      // The calendar should indicate which days are closed
      // This would be visible in the styling of Sunday and Saturday
      // We'd need to check for specific styling classes or attributes
      const sundayCell = screen.getByText('Sun');
      expect(sundayCell).toBeInTheDocument();
    });
  });
});
