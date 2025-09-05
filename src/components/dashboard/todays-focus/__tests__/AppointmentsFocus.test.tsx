import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppointmentsFocus } from '../AppointmentsFocus';
import type { Appointment } from '@/types';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock the AppointmentProvider
const mockUpdateAppointment = jest.fn();
jest.mock('@/providers/AppointmentProvider', () => ({
  useAppointments: () => ({
    updateAppointment: mockUpdateAppointment,
  }),
}));

// Mock the dialogs
jest.mock('@/components/appointments/AppointmentDetailsDialog', () => ({
  AppointmentDetailsDialog: ({ open, onEdit, appointment }: any) =>
    open ? (
      <div data-testid="appointment-details-dialog">
        <button
          data-testid="reschedule-button"
          onClick={() => onEdit(appointment, true, true)}
        >
          Reschedule
        </button>
      </div>
    ) : null,
}));

jest.mock('@/components/appointments/AppointmentDialog', () => ({
  AppointmentDialog: ({ open, onUpdate }: any) =>
    open ? (
      <div data-testid="appointment-dialog">
        <button
          data-testid="update-button"
          onClick={() =>
            onUpdate({
              date: '2024-01-10',
              startTime: '10:00',
              endTime: '11:00',
              type: 'consultation',
              sendEmail: true,
            })
          }
        >
          Update
        </button>
      </div>
    ) : null,
}));

describe('AppointmentsFocus - Rescheduling', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const mockAppointment: Appointment = {
    id: 'appt-1',
    shop_id: 'shop-123',
    client_id: 'client-123',
    date: '2024-01-10',
    start_time: '09:00',
    end_time: '10:00',
    status: 'confirmed',
    type: 'consultation',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    notes: null,
    client: {
      id: 'client-123',
      shop_id: 'shop-123',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      phone_number: '555-0123',
      accept_email: true,
      accept_sms: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  };

  const renderWithProviders = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <AppointmentsFocus
          nextAppointment={mockAppointment}
          todayAppointments={[mockAppointment]}
          weekData={[]}
          weekSummaryStats={null}
          shopHours={[]}
          calendarSettings={{
            buffer_time_minutes: 0,
            default_appointment_duration: 30,
          }}
          {...props}
        />
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should open details dialog when view details is clicked', async () => {
    renderWithProviders();

    // Click on "View Details" button
    const viewDetailsButton = screen.getByText('View Details');
    fireEvent.click(viewDetailsButton);

    // Details dialog should be open
    await waitFor(() => {
      expect(
        screen.getByTestId('appointment-details-dialog')
      ).toBeInTheDocument();
    });
  });

  it('should open reschedule dialog when reschedule is clicked', async () => {
    renderWithProviders();

    // Open details dialog first
    const viewDetailsButton = screen.getByText('View Details');
    fireEvent.click(viewDetailsButton);

    // Click reschedule in details dialog
    await waitFor(() => {
      const rescheduleButton = screen.getByTestId('reschedule-button');
      fireEvent.click(rescheduleButton);
    });

    // Reschedule dialog should be open
    await waitFor(() => {
      expect(screen.getByTestId('appointment-dialog')).toBeInTheDocument();
    });
  });

  it('should call updateAppointment when rescheduling', async () => {
    renderWithProviders();

    // Open details dialog
    const viewDetailsButton = screen.getByText('View Details');
    fireEvent.click(viewDetailsButton);

    // Click reschedule
    await waitFor(() => {
      const rescheduleButton = screen.getByTestId('reschedule-button');
      fireEvent.click(rescheduleButton);
    });

    // Click update in reschedule dialog
    await waitFor(() => {
      const updateButton = screen.getByTestId('update-button');
      fireEvent.click(updateButton);
    });

    // Verify updateAppointment was called with correct data
    await waitFor(() => {
      expect(mockUpdateAppointment).toHaveBeenCalledWith('appt-1', {
        id: 'appt-1',
        date: '2024-01-10',
        startTime: '10:00',
        endTime: '11:00',
        type: 'consultation',
        notes: undefined,
        sendEmail: true,
      });
    });
  });

  it('should invalidate queries after successful update', async () => {
    const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

    renderWithProviders();

    // Open details dialog
    const viewDetailsButton = screen.getByText('View Details');
    fireEvent.click(viewDetailsButton);

    // Click reschedule
    await waitFor(() => {
      const rescheduleButton = screen.getByTestId('reschedule-button');
      fireEvent.click(rescheduleButton);
    });

    // Click update
    await waitFor(() => {
      const updateButton = screen.getByTestId('update-button');
      fireEvent.click(updateButton);
    });

    // Verify queries were invalidated
    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['appointments'],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['dashboard'],
      });
    });
  });
});
