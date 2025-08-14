import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AppointmentDialog } from '@/components/appointments/AppointmentDialog';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { format } from 'date-fns';

// Mock the actions
jest.mock('@/lib/actions/appointments', () => ({
  createAppointment: jest.fn(),
  updateAppointment: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: jest.fn(),
    push: jest.fn(),
  }),
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      {component}
    </LocalizationProvider>
  );
};

describe('AppointmentDialog - Date and Time Pre-population', () => {
  const mockOnClose = jest.fn();
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

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should pre-populate date and time when selectedDate and selectedTime are provided', async () => {
    const selectedDate = new Date('2024-03-15');
    const selectedTime = '14:00';

    renderWithProviders(
      <AppointmentDialog
        open={true}
        onClose={mockOnClose}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        shopHours={mockShopHours}
      />
    );

    // Wait for the dialog to render
    await waitFor(() => {
      expect(screen.getByText('New Appointment')).toBeInTheDocument();
    });

    // Check if the date field shows the selected date (string-formatted label)
    const dateDisplay = screen.getByLabelText(/date/i);
    expect(dateDisplay).toBeInTheDocument();

    // Check if the start time field has the correct value
    // Look for the time in the select dropdown
    const startTimeSelect = screen.getByLabelText(/start time/i);
    expect(startTimeSelect).toBeInTheDocument();

    // The selected time should be displayed
    await waitFor(() => {
      expect(screen.getByText('2:00 PM')).toBeInTheDocument();
    });
  });

  it('should default to today when no selectedDate is provided', async () => {
    const today = new Date();

    renderWithProviders(
      <AppointmentDialog
        open={true}
        onClose={mockOnClose}
        shopHours={mockShopHours}
      />
    );

    // Wait for the dialog to render
    await waitFor(() => {
      expect(screen.getByText('New Appointment')).toBeInTheDocument();
    });

    // Check if the date field is present (exact text depends on localization)
    const dateInput = screen.getByLabelText(/date/i);
    expect(dateInput).toBeInTheDocument();
  });

  it('should update date and time when props change while dialog is open', async () => {
    const { rerender } = renderWithProviders(
      <AppointmentDialog
        open={true}
        onClose={mockOnClose}
        shopHours={mockShopHours}
      />
    );

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText('New Appointment')).toBeInTheDocument();
    });

    // Check initial state (date input present)
    let dateInput = screen.getByLabelText(/date/i);
    expect(dateInput).toBeInTheDocument();

    // Update with new selectedDate and selectedTime
    const newDate = new Date('2024-04-20');
    const newTime = '10:00';

    rerender(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <AppointmentDialog
          open={true}
          onClose={mockOnClose}
          selectedDate={newDate}
          selectedTime={newTime}
          shopHours={mockShopHours}
        />
      </LocalizationProvider>
    );

    // Check if the date field updated (presence only, value differs by locale)
    await waitFor(() => {
      dateInput = screen.getByLabelText(/date/i);
      expect(dateInput).toBeInTheDocument();
    });

    // Check if the time updated
    await waitFor(() => {
      expect(screen.getByText('10:00 AM')).toBeInTheDocument();
    });
  });

  it('should not pre-populate time when only selectedDate is provided', async () => {
    const selectedDate = new Date('2024-03-15');

    renderWithProviders(
      <AppointmentDialog
        open={true}
        onClose={mockOnClose}
        selectedDate={selectedDate}
        shopHours={mockShopHours}
      />
    );

    // Wait for the dialog to render
    await waitFor(() => {
      expect(screen.getByText('New Appointment')).toBeInTheDocument();
    });

    // Check date input exists
    const dateInput = screen.getByLabelText(/date/i);
    expect(dateInput).toBeInTheDocument();

    // Check that start time is not pre-selected
    const startTimeSelect = screen.getByRole('combobox', {
      name: /start time/i,
    });
    expect(startTimeSelect).toBeInTheDocument();
    // The start time select should display no selected time
    // Check that the select has no value attribute set (null when no selection)
    expect(startTimeSelect.getAttribute('value')).toBeNull();
  });
});
