import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GarmentEditDialogOptimistic from '@/components/garments/GarmentEditDialogOptimistic';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

// Mock the server actions
jest.mock('@/lib/actions/garments', () => ({
  updateGarment: jest.fn(),
}));

// Mock the toast notifications
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockUpdateGarmentOptimistic = jest.fn();
const mockUpdateGarmentIcon = jest.fn();
const mockUpdateGarmentPhoto = jest.fn();
const mockDeleteGarmentPhoto = jest.fn();

// Mock the useGarment hook
jest.mock('@/contexts/GarmentContext', () => ({
  useGarment: jest.fn(),
}));

const createMockGarment = (overrides = {}) => ({
  id: 'test-garment-id',
  name: 'Test Garment',
  due_date: null,
  event_date: null,
  preset_icon_key: 'icon1',
  preset_fill_color: '#D6C4F2',
  preset_outline_color: null,
  notes: 'Test notes',
  stage: 'Not Started',
  photo_url: null,
  image_cloud_id: null,
  created_at: '2024-01-01T00:00:00Z',
  order_id: 'test-order-id',
  garment_services: [],
  totalPriceCents: 0,
  ...overrides,
});

const renderComponent = (garmentOverrides = {}, dialogProps = {}) => {
  const mockGarment = createMockGarment(garmentOverrides);

  // Import the mocked useGarment hook
  const { useGarment } = require('@/contexts/GarmentContext');

  // Set up the mock return value for useGarment
  useGarment.mockReturnValue({
    garment: mockGarment,
    updateGarmentOptimistic: mockUpdateGarmentOptimistic,
    updateGarmentIcon: mockUpdateGarmentIcon,
    updateGarmentPhoto: mockUpdateGarmentPhoto,
    deleteGarmentPhoto: mockDeleteGarmentPhoto,
    addService: jest.fn(),
    removeService: jest.fn(),
    restoreService: jest.fn(),
    updateService: jest.fn(),
    toggleServiceComplete: jest.fn(),
    markAsPickedUp: jest.fn(),
    refreshGarment: jest.fn(),
    refreshHistory: jest.fn(),
    historyKey: 0,
    optimisticHistoryEntry: null,
    historyRefreshSignal: 0,
  });

  return render(
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <GarmentEditDialogOptimistic
        open={true}
        onClose={jest.fn()}
        {...dialogProps}
      />
    </LocalizationProvider>
  );
};

describe('GarmentEditDialogOptimistic - Past Due Date Handling', () => {
  const today = dayjs().startOf('day');
  const yesterday = today.subtract(1, 'day').format('YYYY-MM-DD');
  const tomorrow = today.add(1, 'day').format('YYYY-MM-DD');
  const lastWeek = today.subtract(7, 'days').format('YYYY-MM-DD');
  const nextWeek = today.add(7, 'days').format('YYYY-MM-DD');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Garment with past due date', () => {
    it('should show warning when garment has a past due date', () => {
      renderComponent({ due_date: yesterday });

      const warning = screen.getByRole('alert');
      expect(warning).toHaveTextContent(/This garment has a past due date/);
      expect(warning).toHaveTextContent(
        dayjs(yesterday).format('MMM DD, YYYY')
      );
    });

    it('should allow keeping the existing past due date', async () => {
      const mockOnClose = jest.fn();
      renderComponent({ due_date: yesterday }, { onClose: mockOnClose });

      // Change only the name
      const nameField = screen.getByLabelText(/Garment Name/i);
      await userEvent.clear(nameField);
      await userEvent.type(nameField, 'Updated Garment Name');

      // Submit without changing the date
      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateGarmentOptimistic).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Updated Garment Name',
            due_date: yesterday,
          })
        );
      });

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should allow selecting a different past date when original was past', async () => {
      renderComponent({ due_date: yesterday });

      // The DatePicker should not have minDate restriction
      const dueDatePicker = screen.getByLabelText(/Due Date/i);
      expect(dueDatePicker).toBeInTheDocument();

      // Helper text should indicate past dates are allowed
      const helperText = screen.getByText(
        /Past dates are allowed since this garment already has a past due date/
      );
      expect(helperText).toBeInTheDocument();
    });

    it('should allow changing from past date to future date', async () => {
      const mockOnClose = jest.fn();
      renderComponent({ due_date: yesterday }, { onClose: mockOnClose });

      // Change to a future date
      const dueDatePicker = screen.getByLabelText(/Due Date/i);

      // Simulate date picker change (simplified for testing)
      fireEvent.change(dueDatePicker, { target: { value: tomorrow } });

      // Submit
      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateGarmentOptimistic).toHaveBeenCalled();
      });

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Garment without past due date', () => {
    it('should not show warning when garment has a future due date', () => {
      renderComponent({ due_date: tomorrow });

      const warning = screen.queryByRole('alert');
      expect(warning).not.toBeInTheDocument();
    });

    it('should not show warning when garment has no due date', () => {
      renderComponent({ due_date: null });

      const warning = screen.queryByRole('alert');
      expect(warning).not.toBeInTheDocument();
    });

    it('should prevent setting a past due date', async () => {
      renderComponent({ due_date: tomorrow });

      // The DatePicker should have minDate restriction
      const dueDatePicker = screen.getByLabelText(/Due Date/i);
      expect(dueDatePicker).toBeInTheDocument();

      // Helper text should not mention past dates
      const helperText = screen.queryByText(/Past dates are allowed/);
      expect(helperText).not.toBeInTheDocument();
    });
  });

  describe('Event date handling', () => {
    it('should show warning when garment has a past event date', () => {
      renderComponent({ event_date: yesterday });

      // First check the special event checkbox
      const specialEventCheckbox = screen.getByLabelText(/Special Event/i);
      expect(specialEventCheckbox).toBeChecked();

      const warning = screen.getByText(/This garment has a past event date/);
      expect(warning).toBeInTheDocument();
    });

    it('should allow keeping the existing past event date', async () => {
      const mockOnClose = jest.fn();
      renderComponent(
        { event_date: yesterday, due_date: lastWeek },
        { onClose: mockOnClose }
      );

      // Change only the name
      const nameField = screen.getByLabelText(/Garment Name/i);
      await userEvent.clear(nameField);
      await userEvent.type(nameField, 'Updated Garment Name');

      // Submit without changing the dates
      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateGarmentOptimistic).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Updated Garment Name',
            event_date: yesterday,
          })
        );
      });

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should show helper text for past event dates', () => {
      renderComponent({ event_date: yesterday });

      const helperText = screen.getByText(
        /Past dates are allowed since this garment already has a past event date/
      );
      expect(helperText).toBeInTheDocument();
    });
  });

  describe('Date validation', () => {
    it('should validate that event date is not before due date', async () => {
      renderComponent({ due_date: tomorrow, event_date: nextWeek });

      // Try to set event date before due date
      const eventDatePicker = screen.getByLabelText(/Event Date/i);
      fireEvent.change(eventDatePicker, {
        target: { value: today.format('YYYY-MM-DD') },
      });

      // Should show validation error
      await waitFor(() => {
        const error = screen.getByText(
          /Event date cannot be before the due date/
        );
        expect(error).toBeInTheDocument();
      });
    });

    it('should clear validation error when dates are corrected', async () => {
      renderComponent({ due_date: tomorrow, event_date: null });

      // Enable special event
      const specialEventCheckbox = screen.getByLabelText(/Special Event/i);
      fireEvent.click(specialEventCheckbox);

      // Set event date before due date (should show error)
      const eventDatePicker = screen.getByLabelText(/Event Date/i);
      fireEvent.change(eventDatePicker, {
        target: { value: today.format('YYYY-MM-DD') },
      });

      await waitFor(() => {
        const error = screen.getByText(
          /Event date cannot be before the due date/
        );
        expect(error).toBeInTheDocument();
      });

      // Correct the date
      fireEvent.change(eventDatePicker, { target: { value: nextWeek } });

      await waitFor(() => {
        const error = screen.queryByText(
          /Event date cannot be before the due date/
        );
        expect(error).not.toBeInTheDocument();
      });
    });
  });

  describe('Form submission', () => {
    it('should not submit when validation errors exist', async () => {
      const mockOnClose = jest.fn();
      renderComponent({ due_date: tomorrow }, { onClose: mockOnClose });

      // Try to set a past date (should fail for future-dated garment)
      const dueDatePicker = screen.getByLabelText(/Due Date/i);
      fireEvent.change(dueDatePicker, { target: { value: yesterday } });

      // Wait for validation error
      await waitFor(() => {
        const error = screen.getByText(
          /Due date cannot be in the past unless the garment already had a past due date/
        );
        expect(error).toBeInTheDocument();
      });

      // Try to submit
      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);

      // Should not call update or close
      expect(mockUpdateGarmentOptimistic).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should submit successfully when all validations pass', async () => {
      const mockOnClose = jest.fn();
      renderComponent({ due_date: yesterday }, { onClose: mockOnClose });

      // Update the name
      const nameField = screen.getByLabelText(/Garment Name/i);
      await userEvent.clear(nameField);
      await userEvent.type(nameField, 'Updated Name');

      // Submit
      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateGarmentOptimistic).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Updated Name',
            due_date: yesterday,
          })
        );
      });

      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
