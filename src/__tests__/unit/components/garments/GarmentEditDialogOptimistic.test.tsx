import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GarmentProvider } from '@/contexts/GarmentContext';
import GarmentEditDialogOptimistic from '@/components/garments/GarmentEditDialogOptimistic';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import * as garmentActions from '@/lib/actions/garments';
import dayjs from 'dayjs';

const mockGarment = {
  id: 'test-garment-id',
  name: 'Test Garment',
  due_date: dayjs().add(7, 'days').format('YYYY-MM-DD'), // Future date
  event_date: dayjs().add(14, 'days').format('YYYY-MM-DD'), // Future date
  preset_icon_key: 'tops/blouse',
  preset_fill_color: '#D6C4F2',
  preset_outline_color: null,
  notes: 'Test notes',
  stage: 'Cutting',
  photo_url: null,
  image_cloud_id: null,
  created_at: '2024-01-01',
  order_id: 'test-order-id',
  garment_services: [],
  totalPriceCents: 0,
};

// Mock the garment actions
jest.mock('@/lib/actions/garments');

// Mock the DatePicker component to behave like a simple input
jest.mock('@mui/x-date-pickers/DatePicker', () => ({
  DatePicker: ({ label, value, onChange, slotProps, ...props }: any) => {
    const handleChange = (e: any) => {
      const dateValue = e.target.value;
      if (dateValue) {
        // Convert string to dayjs object for the onChange handler
        const dayjs = require('dayjs');
        onChange(dayjs(dateValue));
      } else {
        onChange(null);
      }
    };

    // Filter out React-incompatible props
    const { minDate, ...inputProps } = props;

    return (
      <div>
        <input
          aria-label={label}
          type="date"
          value={value ? value.format('YYYY-MM-DD') : ''}
          onChange={handleChange}
          {...inputProps}
        />
        {slotProps?.textField?.helperText && (
          <div>{slotProps.textField.helperText}</div>
        )}
      </div>
    );
  },
}));
jest.mock('@/lib/utils/toast');

// Mock the GarmentContext
const mockUpdateGarmentOptimistic = jest.fn();
const mockUpdateGarmentIcon = jest.fn();
const mockUpdateGarmentPhoto = jest.fn();
const mockDeleteGarmentPhoto = jest.fn();

let currentMockGarment = mockGarment;

jest.mock('@/contexts/GarmentContext', () => ({
  useGarment: () => ({
    garment: currentMockGarment,
    updateGarmentOptimistic: mockUpdateGarmentOptimistic,
    updateGarmentIcon: mockUpdateGarmentIcon,
    updateGarmentPhoto: mockUpdateGarmentPhoto,
    deleteGarmentPhoto: mockDeleteGarmentPhoto,
  }),
  GarmentProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const mockOnClose = jest.fn();

const renderComponent = (garment = mockGarment) => {
  currentMockGarment = garment;
  return render(
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <GarmentEditDialogOptimistic open={true} onClose={mockOnClose} />
    </LocalizationProvider>
  );
};

describe('GarmentEditDialogOptimistic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    currentMockGarment = mockGarment;
    mockUpdateGarmentOptimistic.mockResolvedValue(undefined);
    (garmentActions.updateGarment as jest.Mock).mockResolvedValue({
      success: true,
    });
  });

  it.skip('renders with initial garment data', () => {
    renderComponent();

    // Check garment name
    const nameInput = screen.getByRole('textbox', { name: /garment name/i });
    expect(nameInput).toHaveValue('Test Garment');

    // Check special event checkbox
    expect(
      screen.getByRole('checkbox', { name: /special event/i })
    ).toBeChecked();

    // Check that both date pickers are rendered
    const dateInputs = screen.getAllByPlaceholderText(/EEEE, MMMM/i);
    expect(dateInputs).toHaveLength(2); // Due date and event date

    // Check notes
    const notesInput = screen.getByRole('textbox', { name: /notes/i });
    expect(notesInput).toHaveValue('Test notes');
  });

  it.skip('shows event date picker only when Special Event is checked', async () => {
    renderComponent();

    // Initially checked, so event date should be visible (2 date pickers)
    let dateInputs = screen.getAllByPlaceholderText(/EEEE, MMMM/i);
    expect(dateInputs).toHaveLength(2);

    // Uncheck Special Event
    const specialEventCheckbox = screen.getByRole('checkbox', {
      name: /special event/i,
    });
    fireEvent.click(specialEventCheckbox);

    // Event date picker should be hidden (only 1 date picker now)
    dateInputs = screen.getAllByPlaceholderText(/EEEE, MMMM/i);
    expect(dateInputs).toHaveLength(1);

    // Check it again
    fireEvent.click(specialEventCheckbox);

    // Event date picker should be visible again (2 date pickers)
    dateInputs = screen.getAllByPlaceholderText(/EEEE, MMMM/i);
    expect(dateInputs).toHaveLength(2);
  });

  it('disables save when form is invalid', () => {
    // Render with empty garment name
    renderComponent({
      ...mockGarment,
      name: '',
    });

    // Save button should be disabled when name is empty
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    expect(saveButton).toBeDisabled();
  });

  it.skip('saves changes with optimistic update', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Change garment name
    const nameInput = screen.getByRole('textbox', { name: /garment name/i });
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Garment');

    // Click save
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    // Wait for async operations to complete
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });

    // Verify updateGarmentOptimistic was called with correct data
    await waitFor(() => {
      expect(mockUpdateGarmentOptimistic).toHaveBeenCalledWith({
        name: 'Updated Garment',
        due_date: dayjs().add(7, 'days').format('YYYY-MM-DD'),
        event_date: dayjs().add(14, 'days').format('YYYY-MM-DD'),
        notes: 'Test notes',
      });
    });
  });

  it('clears event date when Special Event is unchecked', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Uncheck Special Event
    const specialEventCheckbox = screen.getByRole('checkbox', {
      name: /special event/i,
    });
    await user.click(specialEventCheckbox);

    // Save changes
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    // Wait for async operations to complete
    await waitFor(() => {
      expect(mockUpdateGarmentOptimistic).toHaveBeenCalledWith({
        name: 'Test Garment',
        due_date: dayjs().add(7, 'days').format('YYYY-MM-DD'),
        event_date: null,
        notes: 'Test notes',
      });
    });
  });

  it.skip('shows formatted dates in date pickers', () => {
    renderComponent();

    // Check that date inputs have the correct format placeholder
    const dateInputs = screen.getAllByPlaceholderText(/EEEE, MMMM/i);

    // We have 2 date pickers (due date and event date)
    expect(dateInputs).toHaveLength(2);

    // Both should be using the formatted date placeholder
    expect(dateInputs[0]).toHaveAttribute(
      'placeholder',
      expect.stringContaining('EEEE, MMMM')
    );
    expect(dateInputs[1]).toHaveAttribute(
      'placeholder',
      expect.stringContaining('EEEE, MMMM')
    );
  });

  it.skip('prevents submission with past due date', async () => {
    const user = userEvent.setup();
    const pastDate = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

    renderComponent({
      ...mockGarment,
      due_date: pastDate,
    });

    // Try to save with past due date
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    // Should show validation error
    expect(
      screen.getByText('Due date cannot be in the past.')
    ).toBeInTheDocument();

    // Dialog should not close
    expect(mockOnClose).not.toHaveBeenCalled();

    // updateGarmentOptimistic should not be called
    expect(mockUpdateGarmentOptimistic).not.toHaveBeenCalled();
  });

  it.skip('prevents submission with past event date', async () => {
    const user = userEvent.setup();
    const pastDate = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
    const futureDate = dayjs().add(1, 'day').format('YYYY-MM-DD');

    renderComponent({
      ...mockGarment,
      due_date: futureDate, // Set future due date so it doesn't trigger first
      event_date: pastDate,
    });

    // Try to save with past event date
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    // Should show validation error
    expect(
      screen.getByText('Event date cannot be in the past.')
    ).toBeInTheDocument();

    // Dialog should not close
    expect(mockOnClose).not.toHaveBeenCalled();

    // updateGarmentOptimistic should not be called
    expect(mockUpdateGarmentOptimistic).not.toHaveBeenCalled();
  });

  it.skip('allows submission with today as due date', async () => {
    const user = userEvent.setup();
    const today = dayjs().format('YYYY-MM-DD');

    renderComponent({
      ...mockGarment,
      due_date: today,
      // Remove event_date to avoid conflicts
    });

    // Uncheck special event to avoid event date validation
    const specialEventCheckbox = screen.getByRole('checkbox', {
      name: /special event/i,
    });
    await user.click(specialEventCheckbox);

    // Try to save with today's date
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    // Should not show validation error
    expect(
      screen.queryByText('Due date cannot be in the past.')
    ).not.toBeInTheDocument();

    // Dialog should close
    expect(mockOnClose).toHaveBeenCalled();

    // updateGarmentOptimistic should be called
    expect(mockUpdateGarmentOptimistic).toHaveBeenCalled();
  });

  it.skip('allows submission with today as event date', async () => {
    const user = userEvent.setup();
    const today = dayjs().format('YYYY-MM-DD');
    const futureDate = dayjs().add(1, 'day').format('YYYY-MM-DD');

    renderComponent({
      ...mockGarment,
      due_date: futureDate, // Future due date
      event_date: today, // Today as event date
    });

    // Try to save with today's event date
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    // Should not show validation error
    expect(
      screen.queryByText('Event date cannot be in the past.')
    ).not.toBeInTheDocument();

    // Dialog should close
    expect(mockOnClose).toHaveBeenCalled();

    // updateGarmentOptimistic should be called
    expect(mockUpdateGarmentOptimistic).toHaveBeenCalled();
  });
});
