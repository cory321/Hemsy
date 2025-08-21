import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GarmentProvider } from '@/contexts/GarmentContext';
import GarmentEditDialogOptimistic from '@/components/garments/GarmentEditDialogOptimistic';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import * as garmentActions from '@/lib/actions/garments';

// Mock the garment actions
jest.mock('@/lib/actions/garments');
jest.mock('sonner');

const mockGarment = {
  id: 'test-garment-id',
  name: 'Test Garment',
  due_date: '2024-12-01',
  event_date: '2024-12-15',
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

const mockOnClose = jest.fn();

const renderComponent = (garment = mockGarment) => {
  return render(
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <GarmentProvider initialGarment={garment}>
        <GarmentEditDialogOptimistic open={true} onClose={mockOnClose} />
      </GarmentProvider>
    </LocalizationProvider>
  );
};

describe('GarmentEditDialogOptimistic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (garmentActions.updateGarment as jest.Mock).mockResolvedValue({
      success: true,
    });
  });

  it('renders with initial garment data', () => {
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

  it('shows event date picker only when Special Event is checked', async () => {
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

  it('saves changes with optimistic update', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Change garment name
    const nameInput = screen.getByRole('textbox', { name: /garment name/i });
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Garment');

    // Click save
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    // Dialog should close immediately (optimistic)
    expect(mockOnClose).toHaveBeenCalled();

    // Verify updateGarment was called with correct data
    expect(garmentActions.updateGarment).toHaveBeenCalledWith({
      garmentId: 'test-garment-id',
      updates: {
        name: 'Updated Garment',
        dueDate: '2024-12-01',
        eventDate: '2024-12-15',
        notes: 'Test notes',
      },
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

    // Verify updateGarment was called with null event date
    expect(garmentActions.updateGarment).toHaveBeenCalledWith({
      garmentId: 'test-garment-id',
      updates: {
        name: 'Test Garment',
        dueDate: '2024-12-01',
        eventDate: null,
        notes: 'Test notes',
      },
    });
  });

  it('shows formatted dates in date pickers', () => {
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
});
