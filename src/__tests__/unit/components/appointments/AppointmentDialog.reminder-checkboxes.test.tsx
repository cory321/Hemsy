import React from 'react';
import { render, screen } from '@testing-library/react';
import { AppointmentDialog } from '@/components/appointments/AppointmentDialog';
import userEvent from '@testing-library/user-event';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

// Mock the ClientSearchField component
jest.mock('@/components/appointments/ClientSearchField', () => ({
  ClientSearchField: ({ value, onChange }: any) => (
    <div data-testid="client-search-field">
      <button
        onClick={() =>
          onChange({
            id: 'test-client-1',
            shop_id: 'shop-1',
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com',
            phone_number: '123-456-7890',
            accept_email: true,
            accept_sms: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          })
        }
      >
        Select Client (Both Opted In)
      </button>
      <button
        onClick={() =>
          onChange({
            id: 'test-client-2',
            shop_id: 'shop-1',
            first_name: 'Jane',
            last_name: 'Smith',
            email: 'jane@example.com',
            phone_number: '987-654-3210',
            accept_email: false,
            accept_sms: false,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          })
        }
      >
        Select Client (Both Opted Out)
      </button>
      <button
        onClick={() =>
          onChange({
            id: 'test-client-3',
            shop_id: 'shop-1',
            first_name: 'Bob',
            last_name: 'Johnson',
            email: 'bob@example.com',
            phone_number: '555-555-5555',
            accept_email: true,
            accept_sms: false,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          })
        }
      >
        Select Client (Email Only)
      </button>
    </div>
  ),
}));

const renderAppointmentDialog = (props = {}) => {
  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    onCreate: jest.fn(),
    selectedDate: new Date('2024-01-01'),
    shopHours: [
      {
        day_of_week: 1,
        open_time: '09:00',
        close_time: '17:00',
        is_closed: false,
      },
    ],
    existingAppointments: [],
  };

  return render(
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <AppointmentDialog {...defaultProps} {...props} />
    </LocalizationProvider>
  );
};

describe('AppointmentDialog - Reminder Checkboxes', () => {
  const user = userEvent.setup();

  it('should always show reminder section with disabled checkboxes when no client is selected', () => {
    renderAppointmentDialog();

    // The reminder section should always be visible
    expect(screen.getByText('Send appointment reminders')).toBeInTheDocument();

    // Both checkboxes should be present but disabled
    const emailCheckbox = screen.getByRole('checkbox', {
      name: /email/i,
    });
    const smsCheckbox = screen.getByRole('checkbox', {
      name: /sms/i,
    });

    expect(emailCheckbox).toBeInTheDocument();
    expect(emailCheckbox).not.toBeChecked();
    expect(emailCheckbox).toBeDisabled();

    expect(smsCheckbox).toBeInTheDocument();
    expect(smsCheckbox).not.toBeChecked();
    expect(smsCheckbox).toBeDisabled();

    // Opt-out messages should not be visible when no client is selected
    expect(screen.queryByText('Opted out')).not.toBeInTheDocument();
  });

  it('should show enabled checkboxes when client has opted in to both email and SMS', async () => {
    renderAppointmentDialog();

    // Select a client who has opted in to both
    await user.click(screen.getByText('Select Client (Both Opted In)'));

    // Check that the reminder section appears
    expect(screen.getByText('Send appointment reminders')).toBeInTheDocument();

    // Check that both checkboxes are present and enabled
    const emailCheckbox = screen.getByRole('checkbox', {
      name: /email/i,
    });
    const smsCheckbox = screen.getByRole('checkbox', {
      name: /sms/i,
    });

    expect(emailCheckbox).toBeInTheDocument();
    expect(emailCheckbox).toBeChecked();
    expect(emailCheckbox).toBeEnabled();

    expect(smsCheckbox).toBeInTheDocument();
    expect(smsCheckbox).toBeChecked();
    expect(smsCheckbox).toBeEnabled();

    // Should not show opt-out messages
    expect(screen.queryByText('Opted out')).not.toBeInTheDocument();
  });

  it('should show disabled checkboxes with opt-out messages when client has opted out', async () => {
    renderAppointmentDialog();

    // Select a client who has opted out of both
    await user.click(screen.getByText('Select Client (Both Opted Out)'));

    // Check that the reminder section appears
    expect(screen.getByText('Send appointment reminders')).toBeInTheDocument();

    // Check that both checkboxes are present and disabled
    const emailCheckbox = screen.getByRole('checkbox', {
      name: /email/i,
    });
    const smsCheckbox = screen.getByRole('checkbox', {
      name: /sms/i,
    });

    expect(emailCheckbox).toBeInTheDocument();
    expect(emailCheckbox).not.toBeChecked();
    expect(emailCheckbox).toBeDisabled();

    expect(smsCheckbox).toBeInTheDocument();
    expect(smsCheckbox).not.toBeChecked();
    expect(smsCheckbox).toBeDisabled();

    // Should show opt-out messages
    const optedOutMessages = screen.getAllByText('Opted out');
    expect(optedOutMessages).toHaveLength(2);
  });

  it('should handle mixed preferences correctly', async () => {
    renderAppointmentDialog();

    // Select a client who has opted in to email only
    await user.click(screen.getByText('Select Client (Email Only)'));

    // Check that the reminder section appears
    expect(screen.getByText('Send appointment reminders')).toBeInTheDocument();

    // Email checkbox should be enabled and checked
    const emailCheckbox = screen.getByRole('checkbox', {
      name: /email/i,
    });
    expect(emailCheckbox).toBeChecked();
    expect(emailCheckbox).toBeEnabled();

    // SMS checkbox should be disabled and unchecked
    const smsCheckbox = screen.getByRole('checkbox', {
      name: /sms/i,
    });
    expect(smsCheckbox).not.toBeChecked();
    expect(smsCheckbox).toBeDisabled();

    // Should only show one SMS opt-out message
    const optedOutMessages = screen.getAllByText('Opted out');
    expect(optedOutMessages).toHaveLength(1);
  });

  it('should hide reminder section for reschedule mode', async () => {
    renderAppointmentDialog({ isReschedule: true });

    // Even if we had a client selected, the reminder section should not appear
    expect(
      screen.queryByText('Send appointment reminders')
    ).not.toBeInTheDocument();
  });

  it('should update reminder section when switching between clients', async () => {
    renderAppointmentDialog();

    // Select a client who has opted in
    await user.click(screen.getByText('Select Client (Both Opted In)'));

    // Verify checkboxes are enabled
    let emailCheckbox = screen.getByRole('checkbox', {
      name: /email/i,
    });
    expect(emailCheckbox).toBeEnabled();

    // Switch to a client who has opted out
    await user.click(screen.getByText('Select Client (Both Opted Out)'));

    // Verify checkboxes are now disabled
    emailCheckbox = screen.getByRole('checkbox', {
      name: /email/i,
    });
    expect(emailCheckbox).toBeDisabled();
  });
});
