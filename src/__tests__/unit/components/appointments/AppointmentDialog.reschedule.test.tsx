import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppointmentDialog } from '@/components/appointments/AppointmentDialog';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { Appointment } from '@/types';

// Mock ClientSearchField
jest.mock('@/components/appointments/ClientSearchField', () => ({
  ClientSearchField: ({ value, onChange, disabled }: any) => (
    <input
      data-testid="client-search"
      value={value?.id || ''}
      onChange={(e) => onChange({ id: e.target.value })}
      disabled={disabled}
      placeholder="Search clients..."
    />
  ),
}));

// Mock calendar utils
jest.mock('@/lib/utils/calendar', () => ({
  getAvailableTimeSlots: jest.fn(() => ['09:00', '10:00', '11:00']),
  to12HourFormat: jest.fn((time: string) => time),
}));

const mockAppointment: Appointment = {
  id: '123',
  shop_id: 'shop123',
  client_id: 'client123',
  date: '2024-01-15',
  start_time: '09:00',
  end_time: '10:00',
  type: 'consultation',
  status: 'confirmed',
  notes: 'Initial notes',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  client: {
    id: 'client123',
    shop_id: 'shop123',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    phone_number: '+1234567890',
    accept_email: true,
    accept_sms: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <LocalizationProvider dateAdapter={AdapterDayjs}>
    {children}
  </LocalizationProvider>
);

describe('AppointmentDialog - Reschedule Mode', () => {
  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    shopHours: [],
    existingAppointments: [],
    calendarSettings: {
      buffer_time_minutes: 0,
      default_appointment_duration: 30,
    },
    onCreate: jest.fn(),
    onUpdate: jest.fn(),
  };

  it('should show "Reschedule Appointment" title when isReschedule is true', () => {
    render(
      <AppointmentDialog
        {...defaultProps}
        appointment={mockAppointment}
        isReschedule={true}
      />,
      { wrapper }
    );

    expect(screen.getByText('Reschedule Appointment')).toBeInTheDocument();
  });

  it('should show "Edit Appointment" title when isReschedule is false', () => {
    render(
      <AppointmentDialog
        {...defaultProps}
        appointment={mockAppointment}
        isReschedule={false}
      />,
      { wrapper }
    );

    expect(screen.getByText('Edit Appointment')).toBeInTheDocument();
  });

  it('should not show client search and display read-only client when rescheduling', () => {
    render(
      <AppointmentDialog
        {...defaultProps}
        appointment={mockAppointment}
        isReschedule={true}
      />,
      { wrapper }
    );

    // Client search should not be present
    expect(screen.queryByTestId('client-search')).not.toBeInTheDocument();
    // Read-only client display should be present
    expect(screen.getByText('Client')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should not show type field when rescheduling', () => {
    render(
      <AppointmentDialog
        {...defaultProps}
        appointment={mockAppointment}
        isReschedule={true}
      />,
      { wrapper }
    );

    // Type field should not be present
    expect(screen.queryByLabelText('Type')).not.toBeInTheDocument();
  });

  it('should not show notes field when rescheduling', () => {
    render(
      <AppointmentDialog
        {...defaultProps}
        appointment={mockAppointment}
        isReschedule={true}
      />,
      { wrapper }
    );

    // Notes field should not be present
    expect(screen.queryByLabelText('Notes')).not.toBeInTheDocument();
  });

  it('should show type and notes fields when not rescheduling', () => {
    render(
      <AppointmentDialog
        {...defaultProps}
        appointment={mockAppointment}
        isReschedule={false}
      />,
      { wrapper }
    );

    // Both fields should be present
    expect(screen.getByLabelText('Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Notes')).toBeInTheDocument();
  });

  it('should show "Reschedule" button text when rescheduling', () => {
    render(
      <AppointmentDialog
        {...defaultProps}
        appointment={mockAppointment}
        isReschedule={true}
      />,
      { wrapper }
    );

    expect(
      screen.getByRole('button', { name: 'Reschedule' })
    ).toBeInTheDocument();
  });

  it('should maintain client information when rescheduling', () => {
    render(
      <AppointmentDialog
        {...defaultProps}
        appointment={mockAppointment}
        isReschedule={true}
      />,
      { wrapper }
    );

    // Client name is displayed read-only
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should call onUpdate with correct data when rescheduling', async () => {
    const onUpdate = jest.fn();
    render(
      <AppointmentDialog
        {...defaultProps}
        appointment={mockAppointment}
        isReschedule={true}
        onUpdate={onUpdate}
      />,
      { wrapper }
    );

    // Change start time
    const startTimeSelect = screen.getByLabelText('Start Time');
    fireEvent.mouseDown(startTimeSelect);
    fireEvent.click(screen.getByText('11:00'));

    // Submit
    fireEvent.click(screen.getByRole('button', { name: 'Reschedule' }));

    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: 'client123',
        date: '2024-01-15',
        startTime: '11:00',
        type: 'consultation', // Type should remain the same
      })
    );
  });

  it('should allow date and time changes when rescheduling', () => {
    render(
      <AppointmentDialog
        {...defaultProps}
        appointment={mockAppointment}
        isReschedule={true}
      />,
      { wrapper }
    );

    // Date picker should be enabled
    expect(screen.getByLabelText('Date')).not.toBeDisabled();

    // Time fields should be enabled
    expect(screen.getByLabelText('Start Time')).not.toBeDisabled();
    expect(screen.getByLabelText('Duration')).not.toBeDisabled();
  });
});
