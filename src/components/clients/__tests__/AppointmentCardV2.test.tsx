import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppointmentCardV2 } from '../AppointmentCardV2';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAppointments } from '@/providers/AppointmentProvider';
import type { Appointment } from '@/types';

// Mock dependencies
jest.mock('@/providers/AppointmentProvider');
jest.mock('@/components/appointments/AppointmentDetailsDialog', () => ({
  AppointmentDetailsDialog: ({ open, onClose, appointment, onEdit }: any) =>
    open ? (
      <div data-testid="appointment-details-dialog">
        Appointment Details Dialog
        <button onClick={() => onEdit(appointment, true)}>Edit</button>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));
jest.mock('@/components/appointments/AppointmentDialog', () => ({
  AppointmentDialog: ({ open, onClose, isReschedule }: any) =>
    open ? (
      <div data-testid="appointment-reschedule-dialog">
        {isReschedule ? 'Reschedule' : 'Create'} Appointment Dialog
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  .toISOString()
  .slice(0, 10);

const mockAppointment: Appointment = {
  id: '1',
  shop_id: 'shop-1',
  client_id: 'client-1',
  date: futureDate,
  start_time: '10:00',
  end_time: '11:00',
  type: 'fitting',
  status: 'confirmed',
  notes: 'Hemming wedding dress',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const defaultProps = {
  appointment: mockAppointment,
  shopId: 'shop-1',
  isToday: false,
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
  existingAppointments: [mockAppointment],
};

const renderWithQuery = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
};

describe('AppointmentCardV2', () => {
  const mockUpdateAppointment = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAppointments as jest.Mock).mockReturnValue({
      updateAppointment: mockUpdateAppointment,
    });
  });

  it('renders appointment details correctly', () => {
    renderWithQuery(<AppointmentCardV2 {...defaultProps} />);

    expect(screen.getByText('10:00 AM - 11:00 AM')).toBeInTheDocument();
    expect(screen.getByText('fitting')).toBeInTheDocument();
    expect(screen.getByText('confirmed')).toBeInTheDocument();
    expect(screen.getByText(/📝\s*Hemming wedding dress/)).toBeInTheDocument();
  });

  it('expands and collapses appointment card', async () => {
    const user = userEvent.setup();
    renderWithQuery(<AppointmentCardV2 {...defaultProps} />);

    const expandButton = screen.getByLabelText('expand');
    expect(expandButton).toBeInTheDocument();

    // Expand
    await user.click(expandButton);
    expect(screen.getByLabelText('collapse')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /view/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /reschedule/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();

    // Collapse
    await user.click(screen.getByLabelText('collapse'));
    expect(screen.getByLabelText('expand')).toBeInTheDocument();
  });

  it('opens appointment details dialog when clicking View', async () => {
    const user = userEvent.setup();
    renderWithQuery(<AppointmentCardV2 {...defaultProps} />);

    // Expand first
    await user.click(screen.getByLabelText('expand'));

    // Click View
    const viewButton = screen.getByRole('button', { name: /view/i });
    await user.click(viewButton);

    expect(
      screen.getByTestId('appointment-details-dialog')
    ).toBeInTheDocument();
  });

  it('opens reschedule dialog when clicking Reschedule', async () => {
    const user = userEvent.setup();
    renderWithQuery(<AppointmentCardV2 {...defaultProps} />);

    // Expand first
    await user.click(screen.getByLabelText('expand'));

    // Click Reschedule
    const rescheduleButton = screen.getByRole('button', {
      name: /reschedule/i,
    });
    await user.click(rescheduleButton);

    expect(
      screen.getByTestId('appointment-reschedule-dialog')
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Reschedule Appointment Dialog/)
    ).toBeInTheDocument();
  });

  it('opens details dialog when clicking Cancel', async () => {
    const user = userEvent.setup();
    renderWithQuery(<AppointmentCardV2 {...defaultProps} />);

    // Expand first
    await user.click(screen.getByLabelText('expand'));

    // Click Cancel (should open details dialog for cancellation)
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(
      screen.getByTestId('appointment-details-dialog')
    ).toBeInTheDocument();
  });

  it('transitions from details dialog to reschedule dialog', async () => {
    const user = userEvent.setup();
    renderWithQuery(<AppointmentCardV2 {...defaultProps} />);

    // Expand and open details dialog
    await user.click(screen.getByLabelText('expand'));
    await user.click(screen.getByRole('button', { name: /view/i }));

    // Click Edit in details dialog
    const editButton = screen.getByText('Edit');
    await user.click(editButton);

    // Should close details dialog and open reschedule dialog
    expect(
      screen.queryByTestId('appointment-details-dialog')
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId('appointment-reschedule-dialog')
    ).toBeInTheDocument();
  });

  it('shows correct action buttons for active appointments', () => {
    renderWithQuery(<AppointmentCardV2 {...defaultProps} />);

    // Expand via icon button
    const expandButton = screen.getByLabelText('expand');
    fireEvent.click(expandButton);

    // Should show action buttons when expanded
    expect(screen.getByRole('button', { name: /view/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /reschedule/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('does not show action buttons for non-active appointments', () => {
    const canceledAppointment = {
      ...mockAppointment,
      status: 'canceled' as const,
    };
    renderWithQuery(
      <AppointmentCardV2 {...defaultProps} appointment={canceledAppointment} />
    );

    // Expand via icon button
    fireEvent.click(screen.getByLabelText('expand'));

    // Should not show action buttons
    expect(
      screen.queryByRole('button', { name: /view/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /reschedule/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /cancel/i })
    ).not.toBeInTheDocument();
  });

  it('applies special styling for today appointments', () => {
    const { container } = renderWithQuery(
      <AppointmentCardV2 {...defaultProps} isToday={true} />
    );

    const card = container.querySelector('[class*="MuiCard"]');
    expect(card).toHaveStyle({
      borderWidth: '2px',
    });
  });

  it('shows status icon and color correctly', () => {
    renderWithQuery(<AppointmentCardV2 {...defaultProps} />);

    // Should show confirmed status with success color
    const statusChip = screen.getByText('confirmed').closest('div');
    expect(statusChip).toHaveClass('MuiChip-colorSuccess');
  });

  it('shows appointment type correctly', () => {
    renderWithQuery(<AppointmentCardV2 {...defaultProps} />);

    expect(screen.getByText('fitting')).toBeInTheDocument();
  });

  it('shows notes preview when not expanded', () => {
    renderWithQuery(<AppointmentCardV2 {...defaultProps} />);

    // Should show truncated notes
    expect(screen.getByText(/📝 Hemming wedding dress/)).toBeInTheDocument();
  });

  it('shows full notes when expanded', async () => {
    const user = userEvent.setup();
    const longNotes =
      'This is a very long note that spans multiple lines and contains detailed information about the appointment requirements and special instructions.';
    const appointmentWithLongNotes = { ...mockAppointment, notes: longNotes };

    renderWithQuery(
      <AppointmentCardV2
        {...defaultProps}
        appointment={appointmentWithLongNotes}
      />
    );

    // Expand
    await user.click(screen.getByLabelText('expand'));

    // Should show full notes in expanded section
    const notesSection = screen.getByText('Notes').parentElement;
    expect(notesSection).toHaveTextContent(longNotes);
  });

  it('shows action buttons for pending appointments (awaiting confirmation)', async () => {
    const user = userEvent.setup();
    const pendingAppointment = {
      ...mockAppointment,
      status: 'pending' as const,
    };

    renderWithQuery(
      <AppointmentCardV2 {...defaultProps} appointment={pendingAppointment} />
    );

    // Expand via icon button
    await user.click(screen.getByLabelText('expand'));

    // Should show action buttons for pending appointments
    expect(screen.getByRole('button', { name: /view/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /reschedule/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('allows viewing details for pending appointments', async () => {
    const user = userEvent.setup();
    const pendingAppointment = {
      ...mockAppointment,
      status: 'pending' as const,
    };

    renderWithQuery(
      <AppointmentCardV2 {...defaultProps} appointment={pendingAppointment} />
    );

    // Expand and click View
    await user.click(screen.getByLabelText('expand'));
    await user.click(screen.getByRole('button', { name: /view/i }));

    // Should open details dialog
    expect(
      screen.getByTestId('appointment-details-dialog')
    ).toBeInTheDocument();
  });

  it('allows rescheduling pending appointments', async () => {
    const user = userEvent.setup();
    const pendingAppointment = {
      ...mockAppointment,
      status: 'pending' as const,
    };

    renderWithQuery(
      <AppointmentCardV2 {...defaultProps} appointment={pendingAppointment} />
    );

    // Expand and click Reschedule
    await user.click(screen.getByLabelText('expand'));
    await user.click(screen.getByRole('button', { name: /reschedule/i }));

    // Should open reschedule dialog
    expect(
      screen.getByTestId('appointment-reschedule-dialog')
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Reschedule Appointment Dialog/)
    ).toBeInTheDocument();
  });
});
