import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AppointmentDetailsDialog } from '@/components/appointments/AppointmentDetailsDialog';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppointmentProvider } from '@/providers/AppointmentProvider';
import { Appointment } from '@/types';
import { updateAppointment as updateAppointmentRefactored } from '@/lib/actions/appointments';
import { toast } from 'react-hot-toast';

// Mock dependencies
jest.mock('@/lib/actions/appointments');
jest.mock('react-hot-toast');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: jest.fn(),
  }),
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

const createWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AppointmentProvider shopId="shop123">{children}</AppointmentProvider>
    </QueryClientProvider>
  );
};

describe('AppointmentDetailsDialog - Type Editing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (updateAppointmentRefactored as jest.Mock).mockResolvedValue({
      ...mockAppointment,
      type: 'fitting',
    });
  });

  it('should display appointment type with edit button', () => {
    render(
      <AppointmentDetailsDialog
        open={true}
        onClose={jest.fn()}
        appointment={mockAppointment}
        onEdit={jest.fn()}
      />,
      { wrapper: createWrapper }
    );

    expect(screen.getByText('Appointment Type')).toBeInTheDocument();
    expect(screen.getAllByText('CONSULTATION').length).toBeGreaterThan(0);
    expect(
      screen.getAllByRole('button', { name: /edit/i }).length
    ).toBeGreaterThan(0);
  });

  it('should show type selector when edit button is clicked', () => {
    render(
      <AppointmentDetailsDialog
        open={true}
        onClose={jest.fn()}
        appointment={mockAppointment}
        onEdit={jest.fn()}
      />,
      { wrapper: createWrapper }
    );

    // Find and click the edit button for appointment type
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    const typeEditButton = editButtons[0];
    expect(typeEditButton).toBeDefined();
    fireEvent.click(typeEditButton!);

    // Check that the select dropdown is shown
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByDisplayValue('consultation')).toBeInTheDocument();
  });

  it('should update appointment type when saved', async () => {
    render(
      <AppointmentDetailsDialog
        open={true}
        onClose={jest.fn()}
        appointment={mockAppointment}
        onEdit={jest.fn()}
      />,
      { wrapper: createWrapper }
    );

    // Click edit button for type
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    fireEvent.click(editButtons[0]!);

    // Change type to fitting
    const select = screen.getByRole('combobox');
    fireEvent.mouseDown(select);
    fireEvent.click(screen.getByText('Fitting'));

    // Click save
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => {
      expect(updateAppointmentRefactored).toHaveBeenCalledWith({
        id: '123',
        type: 'fitting',
      });
      expect(toast.success).toHaveBeenCalledWith(
        'Appointment updated successfully'
      );
    });
  });

  it('should show loading state while saving type', async () => {
    (updateAppointmentRefactored as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(
      <AppointmentDetailsDialog
        open={true}
        onClose={jest.fn()}
        appointment={mockAppointment}
        onEdit={jest.fn()}
      />,
      { wrapper: createWrapper }
    );

    // Click edit and change type
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    fireEvent.click(editButtons[0]!);

    const select = screen.getByRole('combobox');
    fireEvent.mouseDown(select);
    fireEvent.click(screen.getByText('Pickup'));

    // Click save
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

    // Check loading state
    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
  });

  it('should handle cancel appointment with status update', async () => {
    const onClose = jest.fn();
    const futureAppointment: Appointment = {
      ...mockAppointment,
      date: '2099-01-15',
      start_time: '09:00',
      end_time: '10:00',
    };
    render(
      <AppointmentDetailsDialog
        open={true}
        onClose={onClose}
        appointment={futureAppointment}
        onEdit={jest.fn()}
      />,
      { wrapper: createWrapper }
    );

    // Click cancel appointment button
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    // Confirm cancellation
    fireEvent.click(
      screen.getByRole('button', { name: /cancel appointment/i })
    );

    await waitFor(() => {
      expect(updateAppointmentRefactored).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '123',
          status: 'canceled',
        })
      );
      expect(toast.success).toHaveBeenCalledWith('Appointment canceled');
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('should call onEdit immediately with reschedule flag when reschedule is clicked', () => {
    const onEdit = jest.fn();
    const futureAppointment: Appointment = {
      ...mockAppointment,
      date: '2099-01-15',
      start_time: '09:00',
      end_time: '10:00',
    };
    render(
      <AppointmentDetailsDialog
        open={true}
        onClose={jest.fn()}
        appointment={futureAppointment}
        onEdit={onEdit}
      />,
      { wrapper: createWrapper }
    );

    // Click reschedule button
    fireEvent.click(screen.getByRole('button', { name: /reschedule/i }));

    expect(onEdit).toHaveBeenCalledWith(
      expect.objectContaining({ id: '123', date: '2099-01-15' }),
      true,
      true
    );
  });

  it('should disable reschedule and cancel for past appointments', () => {
    const pastAppointment: Appointment = {
      ...mockAppointment,
      date: '2020-01-01',
      start_time: '09:00',
      end_time: '10:00',
    };

    render(
      <AppointmentDetailsDialog
        open={true}
        onClose={jest.fn()}
        appointment={pastAppointment}
        onEdit={jest.fn()}
      />,
      { wrapper: createWrapper }
    );

    const rescheduleBtn = screen.getByRole('button', { name: /reschedule/i });
    const cancelBtn = screen.getByRole('button', {
      name: /cancel appointment/i,
    });
    expect(rescheduleBtn).toBeDisabled();
    expect(cancelBtn).toBeDisabled();
  });

  it('should update notes independently from type', async () => {
    render(
      <AppointmentDetailsDialog
        open={true}
        onClose={jest.fn()}
        appointment={mockAppointment}
        onEdit={jest.fn()}
      />,
      { wrapper: createWrapper }
    );

    // Click edit button for notes
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    const notesEditButton = editButtons[1] || editButtons[0];
    if (notesEditButton) {
      fireEvent.click(notesEditButton);
    }

    // Change notes
    const notesInput = screen.getByPlaceholderText(/add notes/i);
    fireEvent.change(notesInput, { target: { value: 'Updated notes' } });

    // Save notes
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => {
      expect(updateAppointmentRefactored).toHaveBeenCalledWith({
        id: '123',
        notes: 'Updated notes',
      });
    });
  });

  it('should disable actions when mutation is pending', async () => {
    (updateAppointmentRefactored as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(
      <AppointmentDetailsDialog
        open={true}
        onClose={jest.fn()}
        appointment={mockAppointment}
        onEdit={jest.fn()}
      />,
      { wrapper: createWrapper }
    );

    // Start a type update
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    fireEvent.click(editButtons[0]!);
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

    // Check that other buttons are disabled
    expect(screen.getByRole('button', { name: /close/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /reschedule/i })).toBeDisabled();
    const cancelButtons = screen.getAllByRole('button', { name: /cancel/i });
    expect(
      cancelButtons.some((btn) => (btn as HTMLButtonElement).disabled)
    ).toBe(true);
  });
});
