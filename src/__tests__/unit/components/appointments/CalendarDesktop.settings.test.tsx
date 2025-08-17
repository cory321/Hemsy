import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CalendarDesktop } from '@/components/appointments/CalendarDesktop';
import { Calendar } from '@/components/appointments/Calendar';
import { getCalendarSettings } from '@/lib/actions/calendar-settings';
import {
  createMockAppointmentWithClient,
  createMockShopHours,
} from '@/lib/testing/mock-factories';

// Mock the calendar settings module
jest.mock('@/lib/actions/calendar-settings');

// Mock the CalendarSettings component
jest.mock('@/components/appointments/CalendarSettings', () => ({
  CalendarSettings: ({ onSave }: { onSave?: () => void }) => (
    <div data-testid="calendar-settings-mock">
      <button onClick={onSave}>Save Settings</button>
    </div>
  ),
}));

// Mock the appointment actions
jest.mock('@/lib/actions/appointments', () => ({
  getCalendarSettings: jest.fn(),
  updateCalendarSettings: jest.fn(),
}));

describe('Calendar Settings Modal', () => {
  const mockAppointments = [
    createMockAppointmentWithClient(
      {
        id: '1',
        shop_id: 'shop-1',
        type: 'fitting',
        status: 'confirmed',
        notes: 'Test appointment',
        start_time: '10:00',
        end_time: '11:00',
      },
      {
        id: 'client-1',
        shop_id: 'shop-1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone_number: '+1234567890',
      }
    ),
  ];

  const mockShopHours = [
    createMockShopHours({
      day_of_week: 1,
      open_time: '09:00',
      close_time: '17:00',
      is_closed: false,
    }),
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (getCalendarSettings as jest.Mock).mockResolvedValue({
      buffer_time_minutes: 15,
      default_appointment_duration: 30,
      send_reminders: true,
      reminder_hours_before: 24,
    });
  });

  describe('CalendarDesktop', () => {
    it('renders the settings gear icon button', () => {
      render(
        <CalendarDesktop
          appointments={mockAppointments}
          shopHours={mockShopHours}
        />
      );

      const settingsButton = screen.getByLabelText('Calendar settings');
      expect(settingsButton).toBeInTheDocument();
    });

    it('opens the calendar settings modal when gear icon is clicked', async () => {
      const user = userEvent.setup();
      render(
        <CalendarDesktop
          appointments={mockAppointments}
          shopHours={mockShopHours}
        />
      );

      // Initially, the dialog should not be visible
      expect(screen.queryByText('Calendar Settings')).not.toBeInTheDocument();

      // Click the settings button
      const settingsButton = screen.getByLabelText('Calendar settings');
      await user.click(settingsButton);

      // The dialog should now be visible
      expect(screen.getByText('Calendar Settings')).toBeInTheDocument();
      expect(screen.getByTestId('calendar-settings-mock')).toBeInTheDocument();
    });

    it('closes the settings modal when save is clicked', async () => {
      const user = userEvent.setup();
      render(
        <CalendarDesktop
          appointments={mockAppointments}
          shopHours={mockShopHours}
        />
      );

      // Open the modal
      const settingsButton = screen.getByLabelText('Calendar settings');
      await user.click(settingsButton);

      // Click save
      const saveButton = screen.getByText('Save Settings');
      await user.click(saveButton);

      // The dialog should close
      await waitFor(() => {
        expect(screen.queryByText('Calendar Settings')).not.toBeInTheDocument();
      });
    });

    it('closes the settings modal when clicking outside', async () => {
      const user = userEvent.setup();
      render(
        <CalendarDesktop
          appointments={mockAppointments}
          shopHours={mockShopHours}
        />
      );

      // Open the modal
      const settingsButton = screen.getByLabelText('Calendar settings');
      await user.click(settingsButton);

      // Click outside the dialog (on the backdrop)
      const backdrops = screen.getAllByRole('presentation');
      // Find the backdrop (it has aria-hidden and class MuiBackdrop-root)
      const backdropElement = backdrops[0].querySelector(
        '.MuiBackdrop-root'
      ) as HTMLElement;
      await user.click(backdropElement);

      // The dialog should close
      await waitFor(() => {
        expect(screen.queryByText('Calendar Settings')).not.toBeInTheDocument();
      });
    });

    it('displays settings and refresh buttons in the correct order', () => {
      const mockRefresh = jest.fn();
      render(
        <CalendarDesktop
          appointments={mockAppointments}
          shopHours={mockShopHours}
          onRefresh={mockRefresh}
        />
      );

      const settingsButton = screen.getByLabelText('Calendar settings');
      const refreshButton = screen.getByLabelText('Refresh');

      // Get parent container
      const actionButtonsContainer =
        settingsButton.parentElement?.parentElement;
      expect(actionButtonsContainer).toBeInTheDocument();

      // Check that all buttons are siblings in the correct order
      const buttons = actionButtonsContainer?.querySelectorAll('[aria-label]');
      const buttonLabels = Array.from(buttons || []).map((btn) =>
        btn.getAttribute('aria-label')
      );

      const settingsIndex = buttonLabels.indexOf('Calendar settings');
      const refreshIndex = buttonLabels.indexOf('Refresh');

      // Settings should be before refresh
      expect(settingsIndex).toBeLessThan(refreshIndex);
    });
  });

  describe('Calendar (Mobile)', () => {
    it('renders the settings gear icon button on mobile', () => {
      render(
        <Calendar appointments={mockAppointments} shopHours={mockShopHours} />
      );

      const settingsButton = screen.getByRole('button', {
        name: /settings/i,
      });
      expect(settingsButton).toBeInTheDocument();
    });

    it('opens the calendar settings modal when gear icon is clicked on mobile', async () => {
      const user = userEvent.setup();
      render(
        <Calendar appointments={mockAppointments} shopHours={mockShopHours} />
      );

      // Initially, the dialog should not be visible
      expect(screen.queryByText('Calendar Settings')).not.toBeInTheDocument();

      // Click the settings button
      const settingsButton = screen.getByRole('button', {
        name: /settings/i,
      });
      await user.click(settingsButton);

      // The dialog should now be visible
      expect(screen.getByText('Calendar Settings')).toBeInTheDocument();
      expect(screen.getByTestId('calendar-settings-mock')).toBeInTheDocument();
    });

    it('closes the settings modal when save is clicked on mobile', async () => {
      const user = userEvent.setup();
      render(
        <Calendar appointments={mockAppointments} shopHours={mockShopHours} />
      );

      // Open the modal
      const settingsButton = screen.getByRole('button', {
        name: /settings/i,
      });
      await user.click(settingsButton);

      // Click save
      const saveButton = screen.getByText('Save Settings');
      await user.click(saveButton);

      // The dialog should close
      await waitFor(() => {
        expect(screen.queryByText('Calendar Settings')).not.toBeInTheDocument();
      });
    });
  });
});
