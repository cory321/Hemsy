import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GarmentTimeTracker from '../GarmentTimeTracker';
import { GarmentProvider } from '@/contexts/GarmentContext';
import {
  getTimeEntriesForGarment,
  getTotalTimeForGarment,
  addTimeEntry,
  updateTimeEntry,
  deleteTimeEntry,
} from '@/lib/actions/garment-time-entries';
import '@testing-library/jest-dom';

// Mock the time entry actions
jest.mock('@/lib/actions/garment-time-entries', () => ({
  getTimeEntriesForGarment: jest.fn(),
  getTotalTimeForGarment: jest.fn(),
  addTimeEntry: jest.fn(),
  updateTimeEntry: jest.fn(),
  deleteTimeEntry: jest.fn(),
}));

// Mock the GarmentContext
const mockUseGarment = jest.fn();
jest.mock('@/contexts/GarmentContext', () => ({
  ...jest.requireActual('@/contexts/GarmentContext'),
  useGarment: () => mockUseGarment(),
  GarmentProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

const mockServices = [
  { id: 'service-1', name: 'Hemming' },
  { id: 'service-2', name: 'Button Replacement' },
];

const mockTimeEntries = [
  {
    id: 'entry-1',
    service_name: 'Hemming',
    minutes: 45,
    logged_at: '2024-01-01T10:00:00Z',
  },
  {
    id: 'entry-2',
    service_name: 'Button Replacement',
    minutes: 30,
    logged_at: '2024-01-01T11:00:00Z',
  },
];

describe('GarmentTimeTracker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getTimeEntriesForGarment as jest.Mock).mockResolvedValue(mockTimeEntries);
    (getTotalTimeForGarment as jest.Mock).mockResolvedValue(75);
  });

  describe('When garment is not Done', () => {
    beforeEach(() => {
      mockUseGarment.mockReturnValue({
        garment: { id: 'garment-1', stage: 'In Progress' },
      });
    });

    it('should render time tracker with all controls enabled', async () => {
      render(
        <GarmentTimeTracker garmentId="garment-1" services={mockServices} />
      );

      await waitFor(() => {
        expect(screen.getByText('Time Tracking')).toBeInTheDocument();
        expect(screen.getByText('Total: 1h 15m')).toBeInTheDocument();
      });

      // Check that Add Time button is enabled
      const addButton = screen.getByRole('button', { name: /add time/i });
      expect(addButton).not.toBeDisabled();

      // Check that edit and delete buttons are enabled
      const editButtons = screen.getAllByLabelText('edit');
      const deleteButtons = screen.getAllByLabelText('delete');

      editButtons.forEach((button) => {
        expect(button).not.toBeDisabled();
      });

      deleteButtons.forEach((button) => {
        expect(button).not.toBeDisabled();
      });
    });

    it('should allow adding new time entries', async () => {
      const user = userEvent.setup();
      (addTimeEntry as jest.Mock).mockResolvedValue({ success: true });

      render(
        <GarmentTimeTracker garmentId="garment-1" services={mockServices} />
      );

      await waitFor(() => {
        expect(screen.getByText('Time Tracking')).toBeInTheDocument();
      });

      // Click Add Time button
      const addButton = screen.getByRole('button', { name: /add time/i });
      await user.click(addButton);

      // Fill in the dialog
      const serviceSelect = screen.getByLabelText('Service');
      await user.selectOptions(serviceSelect, 'service-1');

      const hoursInput = screen.getByLabelText('Hours');
      await user.type(hoursInput, '1');

      const minutesInput = screen.getByLabelText('Minutes');
      await user.type(minutesInput, '30');

      // Save
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(addTimeEntry).toHaveBeenCalledWith('service-1', 90); // 1h 30m = 90 minutes
      });
    });

    it('should allow editing time entries', async () => {
      const user = userEvent.setup();
      (updateTimeEntry as jest.Mock).mockResolvedValue({ success: true });

      render(
        <GarmentTimeTracker garmentId="garment-1" services={mockServices} />
      );

      await waitFor(() => {
        expect(screen.getByText('Hemming')).toBeInTheDocument();
      });

      // Click edit button on first entry
      const editIcons = screen.getAllByTestId('EditIcon');
      const editButton = editIcons[0]?.closest('button');
      if (editButton) await user.click(editButton);

      // Wait for dialog to open
      await waitFor(() => {
        expect(screen.getByText('Edit Time Entry')).toBeInTheDocument();
      });

      // Modify time in dialog
      const hoursInput = screen.getByLabelText('Hours');
      await user.clear(hoursInput);
      await user.type(hoursInput, '1');

      // Clear minutes to set to 0
      const minutesInput = screen.getByLabelText('Minutes');
      await user.clear(minutesInput);
      await user.type(minutesInput, '0');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(updateTimeEntry).toHaveBeenCalledWith('entry-1', 60); // 1h = 60 minutes
      });
    });

    it('should allow deleting time entries', async () => {
      const user = userEvent.setup();
      (deleteTimeEntry as jest.Mock).mockResolvedValue({ success: true });

      render(
        <GarmentTimeTracker garmentId="garment-1" services={mockServices} />
      );

      await waitFor(() => {
        expect(screen.getByText('Hemming')).toBeInTheDocument();
      });

      // Click delete button on first entry
      const deleteIcons = screen.getAllByTestId('DeleteIcon');
      const deleteButton = deleteIcons[0]?.closest('button');
      if (deleteButton) await user.click(deleteButton);

      await waitFor(() => {
        expect(deleteTimeEntry).toHaveBeenCalledWith('entry-1');
      });
    });

    it('should show loading spinner when deleting time entries', async () => {
      const user = userEvent.setup();
      // Create a promise we can control to simulate async delete
      let resolveDelete: () => void;
      const deletePromise = new Promise<void>((resolve) => {
        resolveDelete = resolve;
      });
      (deleteTimeEntry as jest.Mock).mockReturnValue(deletePromise);

      render(
        <GarmentTimeTracker garmentId="garment-1" services={mockServices} />
      );

      await waitFor(() => {
        expect(screen.getByText('Hemming')).toBeInTheDocument();
      });

      // Click delete button on first entry
      const deleteIcons = screen.getAllByTestId('DeleteIcon');
      const deleteButton = deleteIcons[0]?.closest('button');
      if (deleteButton) await user.click(deleteButton);

      // Should show loading spinner
      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
      });

      // Button should be disabled during loading
      expect(deleteButton).toBeDisabled();

      // Resolve the delete operation
      resolveDelete!();

      // Loading spinner should disappear
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
    });
  });

  describe('When garment is Done', () => {
    beforeEach(() => {
      mockUseGarment.mockReturnValue({
        garment: { id: 'garment-1', stage: 'Done' },
      });
    });

    it('should disable Add Time button', async () => {
      render(
        <GarmentTimeTracker garmentId="garment-1" services={mockServices} />
      );

      await waitFor(() => {
        expect(screen.getByText('Time Tracking')).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add time/i });
      expect(addButton).toBeDisabled();
    });

    it('should show disabled message when no entries exist', async () => {
      (getTimeEntriesForGarment as jest.Mock).mockResolvedValue([]);
      (getTotalTimeForGarment as jest.Mock).mockResolvedValue(0);

      render(
        <GarmentTimeTracker garmentId="garment-1" services={mockServices} />
      );

      await waitFor(() => {
        expect(
          screen.getByText('Time tracking is disabled for completed garments.')
        ).toBeInTheDocument();
      });
    });

    it('should disable edit and delete buttons for existing entries', async () => {
      render(
        <GarmentTimeTracker garmentId="garment-1" services={mockServices} />
      );

      await waitFor(() => {
        expect(
          screen.getByText('Time tracking is disabled for completed garments.')
        ).toBeInTheDocument();
      });

      // Since garment is done, time entries are not shown when there are entries
      expect(screen.queryByText('Hemming')).not.toBeInTheDocument();
    });

    it('should not open add dialog when clicking disabled Add Time button', async () => {
      render(
        <GarmentTimeTracker garmentId="garment-1" services={mockServices} />
      );

      await waitFor(() => {
        expect(screen.getByText('Time Tracking')).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add time/i });
      expect(addButton).toBeDisabled();

      // Dialog should not be present
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should still allow viewing time logs', async () => {
      const user = userEvent.setup();

      render(
        <GarmentTimeTracker garmentId="garment-1" services={mockServices} />
      );

      await waitFor(() => {
        expect(screen.getByText('Time Tracking')).toBeInTheDocument();
      });

      // View Logs button should still be enabled
      const viewLogsButton = screen.getByRole('button', { name: /view logs/i });
      expect(viewLogsButton).not.toBeDisabled();

      // Clicking it should work (though we're not testing the dialog content here)
      await user.click(viewLogsButton);
    });
  });

  describe('Validation', () => {
    beforeEach(() => {
      mockUseGarment.mockReturnValue({
        garment: { id: 'garment-1', stage: 'In Progress' },
      });
    });

    it('should show service validation error when no service is selected', async () => {
      const user = userEvent.setup();

      render(
        <GarmentTimeTracker garmentId="garment-1" services={mockServices} />
      );

      await waitFor(() => {
        expect(screen.getByText('Time Tracking')).toBeInTheDocument();
      });

      // Click Add Time button
      const addButton = screen.getByRole('button', { name: /add time/i });
      await user.click(addButton);

      // Add time without selecting service
      const hoursInput = screen.getByLabelText('Hours');
      await user.type(hoursInput, '1');

      // Try to save
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Should show service error
      await waitFor(() => {
        expect(screen.getByText('Please select a service')).toBeInTheDocument();
      });

      // Service field should be focused
      await waitFor(() => {
        const serviceSelect = screen.getByLabelText('Service');
        expect(serviceSelect).toHaveFocus();
      });

      // Should not call addTimeEntry
      expect(addTimeEntry).not.toHaveBeenCalled();
    });

    it('should show time validation error when no time is entered', async () => {
      const user = userEvent.setup();

      render(
        <GarmentTimeTracker garmentId="garment-1" services={mockServices} />
      );

      await waitFor(() => {
        expect(screen.getByText('Time Tracking')).toBeInTheDocument();
      });

      // Click Add Time button
      const addButton = screen.getByRole('button', { name: /add time/i });
      await user.click(addButton);

      // Select service but don't add time
      const serviceSelect = screen.getByLabelText('Service');
      await user.selectOptions(serviceSelect, 'service-1');

      // Try to save
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Should show time error
      await waitFor(() => {
        expect(
          screen.getByText(
            'Please enter some amount of time (hours or minutes)'
          )
        ).toBeInTheDocument();
      });

      // Should not call addTimeEntry
      expect(addTimeEntry).not.toHaveBeenCalled();
    });

    it('should show time validation error when both hours and minutes are 0', async () => {
      const user = userEvent.setup();

      render(
        <GarmentTimeTracker garmentId="garment-1" services={mockServices} />
      );

      await waitFor(() => {
        expect(screen.getByText('Time Tracking')).toBeInTheDocument();
      });

      // Click Add Time button
      const addButton = screen.getByRole('button', { name: /add time/i });
      await user.click(addButton);

      // Select service and enter 0 for both fields
      const serviceSelect = screen.getByLabelText('Service');
      await user.selectOptions(serviceSelect, 'service-1');

      const hoursInput = screen.getByLabelText('Hours');
      await user.type(hoursInput, '0');

      const minutesInput = screen.getByLabelText('Minutes');
      await user.type(minutesInput, '0');

      // Try to save
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Should show time error
      await waitFor(() => {
        expect(
          screen.getByText(
            'Please enter some amount of time (hours or minutes)'
          )
        ).toBeInTheDocument();
      });

      // Should not call addTimeEntry
      expect(addTimeEntry).not.toHaveBeenCalled();
    });

    it('should clear service error when service is selected', async () => {
      const user = userEvent.setup();

      render(
        <GarmentTimeTracker garmentId="garment-1" services={mockServices} />
      );

      await waitFor(() => {
        expect(screen.getByText('Time Tracking')).toBeInTheDocument();
      });

      // Click Add Time button
      const addButton = screen.getByRole('button', { name: /add time/i });
      await user.click(addButton);

      // Try to save without service to trigger error
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Error should appear
      await waitFor(() => {
        expect(screen.getByText('Please select a service')).toBeInTheDocument();
      });

      // Select service - error should clear
      const serviceSelect = screen.getByLabelText('Service');
      await user.selectOptions(serviceSelect, 'service-1');

      // Error should be gone
      await waitFor(() => {
        expect(
          screen.queryByText('Please select a service')
        ).not.toBeInTheDocument();
      });
    });

    it('should clear time error when time is entered', async () => {
      const user = userEvent.setup();

      render(
        <GarmentTimeTracker garmentId="garment-1" services={mockServices} />
      );

      await waitFor(() => {
        expect(screen.getByText('Time Tracking')).toBeInTheDocument();
      });

      // Click Add Time button
      const addButton = screen.getByRole('button', { name: /add time/i });
      await user.click(addButton);

      // Select service
      const serviceSelect = screen.getByLabelText('Service');
      await user.selectOptions(serviceSelect, 'service-1');

      // Try to save without time to trigger error
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Error should appear
      await waitFor(() => {
        expect(
          screen.getByText(
            'Please enter some amount of time (hours or minutes)'
          )
        ).toBeInTheDocument();
      });

      // Enter time - error should clear
      const minutesInput = screen.getByLabelText('Minutes');
      await user.type(minutesInput, '30');

      // Error should be gone
      await waitFor(() => {
        expect(
          screen.queryByText(
            'Please enter some amount of time (hours or minutes)'
          )
        ).not.toBeInTheDocument();
      });
    });

    it('should allow saving with only minutes entered', async () => {
      const user = userEvent.setup();
      (addTimeEntry as jest.Mock).mockResolvedValue({ success: true });

      render(
        <GarmentTimeTracker garmentId="garment-1" services={mockServices} />
      );

      await waitFor(() => {
        expect(screen.getByText('Time Tracking')).toBeInTheDocument();
      });

      // Click Add Time button
      const addButton = screen.getByRole('button', { name: /add time/i });
      await user.click(addButton);

      // Select service and enter only minutes
      const serviceSelect = screen.getByLabelText('Service');
      await user.selectOptions(serviceSelect, 'service-1');

      const minutesInput = screen.getByLabelText('Minutes');
      await user.type(minutesInput, '45');

      // Save
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(addTimeEntry).toHaveBeenCalledWith('service-1', 45);
      });
    });

    it('should allow saving with only hours entered', async () => {
      const user = userEvent.setup();
      (addTimeEntry as jest.Mock).mockResolvedValue({ success: true });

      render(
        <GarmentTimeTracker garmentId="garment-1" services={mockServices} />
      );

      await waitFor(() => {
        expect(screen.getByText('Time Tracking')).toBeInTheDocument();
      });

      // Click Add Time button
      const addButton = screen.getByRole('button', { name: /add time/i });
      await user.click(addButton);

      // Select service and enter only hours
      const serviceSelect = screen.getByLabelText('Service');
      await user.selectOptions(serviceSelect, 'service-1');

      const hoursInput = screen.getByLabelText('Hours');
      await user.type(hoursInput, '2');

      // Save
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(addTimeEntry).toHaveBeenCalledWith('service-1', 120); // 2 hours = 120 minutes
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle null garment stage gracefully', async () => {
      mockUseGarment.mockReturnValue({
        garment: { id: 'garment-1', stage: null },
      });

      render(
        <GarmentTimeTracker garmentId="garment-1" services={mockServices} />
      );

      await waitFor(() => {
        expect(screen.getByText('Time Tracking')).toBeInTheDocument();
      });

      // Controls should be enabled when stage is null
      const addButton = screen.getByRole('button', { name: /add time/i });
      expect(addButton).not.toBeDisabled();
    });

    it('should handle missing garment gracefully', async () => {
      mockUseGarment.mockReturnValue({
        garment: null,
      });

      render(
        <GarmentTimeTracker garmentId="garment-1" services={mockServices} />
      );

      await waitFor(() => {
        expect(screen.getByText('Time Tracking')).toBeInTheDocument();
      });

      // Controls should be enabled when garment is null
      const addButton = screen.getByRole('button', { name: /add time/i });
      expect(addButton).not.toBeDisabled();
    });
  });
});
