import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppointmentProvider } from '@/providers/AppointmentProvider';
import userEvent from '@testing-library/user-event';
import { AppointmentDetailsDialog } from '@/components/appointments/AppointmentDetailsDialog';
import { updateAppointment as updateAppointmentRefactored } from '@/lib/actions/appointments';
import { useRouter } from 'next/navigation';
import type { Appointment } from '@/types';

// Mock the new refactored action used by the component
jest.mock('@/lib/actions/appointments', () => ({
  updateAppointment: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const mockPush = jest.fn();
const mockRefresh = jest.fn();

const mockAppointment: Appointment = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  shop_id: 'shop123',
  client_id: 'client123',
  date: '2024-03-20',
  start_time: '10:00',
  end_time: '11:00',
  type: 'consultation',
  status: 'confirmed',
  notes: 'Initial appointment notes',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  client: {
    id: 'client123',
    shop_id: 'shop123',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    phone_number: '555-1234',
    accept_email: true,
    accept_sms: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
};

describe('AppointmentDetailsDialog - Notes Editing', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <AppointmentProvider shopId="shop123">{children}</AppointmentProvider>
    </QueryClientProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    });
  });

  it('should display notes with edit button', () => {
    render(
      <AppointmentDetailsDialog
        open={true}
        onClose={jest.fn()}
        appointment={mockAppointment}
        onEdit={jest.fn()}
      />,
      { wrapper: Wrapper }
    );

    // Check notes are displayed
    expect(screen.getByText('Initial appointment notes')).toBeInTheDocument();

    // Check edit button is present
    const notesEditButton = screen.getByTestId('edit-notes-button');
    expect(notesEditButton).toBeInTheDocument();
  });

  it('should show "No notes added yet" when appointment has no notes', () => {
    const appointmentWithoutNotes = { ...mockAppointment, notes: null };

    render(
      <AppointmentDetailsDialog
        open={true}
        onClose={jest.fn()}
        appointment={appointmentWithoutNotes}
        onEdit={jest.fn()}
      />,
      { wrapper: Wrapper }
    );

    expect(screen.getByText('No notes added yet')).toBeInTheDocument();
  });

  it('should enter edit mode when edit button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <AppointmentDetailsDialog
        open={true}
        onClose={jest.fn()}
        appointment={mockAppointment}
        onEdit={jest.fn()}
      />,
      { wrapper: Wrapper }
    );

    // Find and click the notes edit button via its test id
    const notesEditButton = screen.getByTestId('edit-notes-button');
    await user.click(notesEditButton);

    // Check that we're in edit mode
    expect(
      screen.getByPlaceholderText('Add notes about this appointment...')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^save$/i })).toBeInTheDocument();
    // Check for the cancel button that's in the same container as save notes
    const saveButton = screen.getByRole('button', { name: /^save$/i });
    const cancelButton =
      saveButton.parentElement?.querySelector('button:first-child');
    expect(cancelButton).toBeInTheDocument();
    expect(cancelButton?.textContent).toBe('Cancel');

    // Original notes should be in the text field
    const textField = screen.getByPlaceholderText(
      'Add notes about this appointment...'
    ) as HTMLTextAreaElement;
    expect(textField.value).toBe('Initial appointment notes');
  });

  it('should update notes when saved', async () => {
    const user = userEvent.setup();
    (updateAppointmentRefactored as jest.Mock).mockResolvedValue({
      success: true,
    });

    render(
      <AppointmentDetailsDialog
        open={true}
        onClose={jest.fn()}
        appointment={mockAppointment}
        onEdit={jest.fn()}
      />,
      { wrapper: Wrapper }
    );

    // Enter edit mode
    const notesEditButton = screen.getByTestId('edit-notes-button');
    await user.click(notesEditButton);

    // Update the notes
    const textField = screen.getByPlaceholderText(
      'Add notes about this appointment...'
    ) as HTMLTextAreaElement;
    await user.clear(textField);
    await user.type(textField, 'Updated appointment notes');

    // Save
    await user.click(screen.getByRole('button', { name: /^save$/i }));

    // Check that updateAppointment was called
    await waitFor(() => {
      expect(updateAppointmentRefactored).toHaveBeenCalledWith({
        id: '123e4567-e89b-12d3-a456-426614174000',
        notes: 'Updated appointment notes',
      });
    });

    // No explicit router refresh in component anymore; success is handled via mutation
    // Just ensure no error is shown
    expect(screen.queryByText('Failed to update')).not.toBeInTheDocument();
  });

  it('should handle empty notes (clear notes)', async () => {
    const user = userEvent.setup();
    (updateAppointmentRefactored as jest.Mock).mockResolvedValue({
      success: true,
    });

    render(
      <AppointmentDetailsDialog
        open={true}
        onClose={jest.fn()}
        appointment={mockAppointment}
        onEdit={jest.fn()}
      />,
      { wrapper: Wrapper }
    );

    // Enter edit mode
    const notesEditButton = screen.getByTestId('edit-notes-button');
    await user.click(notesEditButton);

    // Clear the notes
    const textField = screen.getByPlaceholderText(
      'Add notes about this appointment...'
    ) as HTMLTextAreaElement;
    await user.clear(textField);

    // Save
    await user.click(screen.getByRole('button', { name: /^save$/i }));

    // Component sends undefined to clear notes (handled server-side as null)
    await waitFor(() => {
      expect(updateAppointmentRefactored).toHaveBeenCalledWith({
        id: '123e4567-e89b-12d3-a456-426614174000',
        notes: undefined,
      });
    });
  });

  it('should cancel edit mode and revert changes', async () => {
    const user = userEvent.setup();

    render(
      <AppointmentDetailsDialog
        open={true}
        onClose={jest.fn()}
        appointment={mockAppointment}
        onEdit={jest.fn()}
      />,
      { wrapper: Wrapper }
    );

    // Enter edit mode
    const notesEditButton = screen.getByTestId('edit-notes-button');
    await user.click(notesEditButton);

    // Update the notes
    const textField = screen.getByPlaceholderText(
      'Add notes about this appointment...'
    ) as HTMLTextAreaElement;
    await user.clear(textField);
    await user.type(textField, 'Changes that will be cancelled');

    // Cancel - find the cancel button in the notes edit section
    const saveButton = screen.getByRole('button', { name: /^save$/i });
    const cancelButton = saveButton.parentElement?.querySelector(
      'button:first-child'
    ) as HTMLButtonElement;
    await user.click(cancelButton);

    // Should exit edit mode and show original notes
    expect(
      screen.queryByPlaceholderText('Add notes about this appointment...')
    ).not.toBeInTheDocument();
    expect(screen.getByText('Initial appointment notes')).toBeInTheDocument();
  });

  it('should display error message when update fails', async () => {
    const user = userEvent.setup();
    (updateAppointmentRefactored as jest.Mock).mockRejectedValue(
      new Error('Failed to update')
    );

    render(
      <AppointmentDetailsDialog
        open={true}
        onClose={jest.fn()}
        appointment={mockAppointment}
        onEdit={jest.fn()}
      />,
      { wrapper: Wrapper }
    );

    // Enter edit mode
    const notesEditButton = screen.getByTestId('edit-notes-button');
    await user.click(notesEditButton);

    // Save
    await user.click(screen.getByRole('button', { name: /^save$/i }));

    // Check error is displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to update')).toBeInTheDocument();
    });

    // Should remain in edit mode
    expect(
      screen.getByPlaceholderText('Add notes about this appointment...')
    ).toBeInTheDocument();
  });

  it('should disable buttons while saving', async () => {
    const user = userEvent.setup();

    // Mock a delayed response
    (updateAppointmentRefactored as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ success: true }), 100)
        )
    );

    render(
      <AppointmentDetailsDialog
        open={true}
        onClose={jest.fn()}
        appointment={mockAppointment}
        onEdit={jest.fn()}
      />,
      { wrapper: Wrapper }
    );

    // Enter edit mode
    const notesEditButton = screen.getByTestId('edit-notes-button');
    await user.click(notesEditButton);

    // Save
    const saveButton = screen.getByRole('button', { name: /^save$/i });
    await user.click(saveButton);

    // Buttons should be disabled while saving
    expect(saveButton).toBeDisabled();
    const cancelButton = saveButton.parentElement?.querySelector(
      'button:first-child'
    ) as HTMLButtonElement;
    expect(cancelButton).toBeDisabled();

    // Wait for save to complete
    await waitFor(() => {
      expect(screen.queryByText('Failed to update')).not.toBeInTheDocument();
    });
  });
});
