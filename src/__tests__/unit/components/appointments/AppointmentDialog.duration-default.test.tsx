import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { AppointmentDialog } from '@/components/appointments/AppointmentDialog';

// Mock ClientSearchField to avoid network/dependency noise
jest.mock('@/components/appointments/ClientSearchField', () => ({
  ClientSearchField: () => <input aria-label="Client" placeholder="Client" />,
}));

// Mock calendar utils
jest.mock('@/lib/utils/calendar', () => ({
  getAvailableTimeSlots: jest.fn(() => ['09:00', '10:00', '11:00']),
  to12HourFormat: jest.fn((time: string) => time),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <LocalizationProvider dateAdapter={AdapterDayjs}>
    {children}
  </LocalizationProvider>
);

describe('AppointmentDialog - Default Duration', () => {
  const baseProps = {
    open: true,
    onClose: jest.fn(),
    shopHours: [
      {
        day_of_week: 1,
        open_time: '09:00',
        close_time: '17:00',
        is_closed: false,
      },
    ],
    existingAppointments: [],
  } as const;

  it('applies calendarSettings.default_appointment_duration when creating a new appointment', async () => {
    render(
      <AppointmentDialog
        {...baseProps}
        calendarSettings={{
          buffer_time_minutes: 0,
          default_appointment_duration: 45,
        }}
      />,
      { wrapper }
    );

    // The selected duration text should reflect the default (45 min)
    await waitFor(() => {
      expect(screen.getByText('45 min')).toBeInTheDocument();
    });
  });

  it('resets duration to default when switching from editing to new appointment', async () => {
    const editingAppointment = {
      id: 'apt-1',
      shop_id: 'shop-1',
      client_id: 'client-1',
      date: '2024-01-15',
      start_time: '10:00',
      end_time: '11:00', // 60 minutes
      type: 'consultation',
      status: 'confirmed',
      notes: '',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      client: {
        id: 'client-1',
        shop_id: 'shop-1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone_number: '+11234567890',
        accept_email: true,
        accept_sms: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    } as any;

    const { rerender } = render(
      <AppointmentDialog
        {...baseProps}
        appointment={editingAppointment}
        calendarSettings={{
          buffer_time_minutes: 0,
          default_appointment_duration: 30,
        }}
      />,
      { wrapper }
    );

    // While editing, duration should reflect 60 minutes
    await waitFor(() => {
      expect(screen.getByText('1 hour')).toBeInTheDocument();
    });

    // Now switch to creating a new appointment (no appointment prop)
    rerender(
      <AppointmentDialog
        {...baseProps}
        appointment={undefined}
        calendarSettings={{
          buffer_time_minutes: 0,
          default_appointment_duration: 30,
        }}
      />
    );

    // Duration should reset to the default (30 min)
    await waitFor(() => {
      expect(screen.getByText('30 min')).toBeInTheDocument();
    });
  });
});
