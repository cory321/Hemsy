import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EditServiceDialog from '../EditServiceDialog';
import { Service } from '@/lib/utils/serviceUtils';

describe('EditServiceDialog', () => {
  const mockService: Service = {
    id: '1',
    name: 'Test Service',
    description: 'Test Description',
    default_qty: 1,
    default_unit: 'flat_rate',
    default_unit_price_cents: 1000,
    frequently_used: false,
    frequently_used_position: null,
  };

  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with service data', () => {
    render(
      <EditServiceDialog
        service={mockService}
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByDisplayValue('Test Service')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Price')).toBeInTheDocument();
    expect(screen.getByText('flat rate')).toBeInTheDocument();
  });

  it('uses ServicePriceInput for price and unit', () => {
    render(
      <EditServiceDialog
        service={mockService}
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    // Should have price input with dollar sign
    expect(screen.getByLabelText('Price')).toBeInTheDocument();

    // Should have unit dropdown
    const unitSelect = screen.getByRole('combobox');
    expect(unitSelect).toBeInTheDocument();
  });

  it('does not show separate quantity field', () => {
    render(
      <EditServiceDialog
        service={mockService}
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    // Should NOT have a separate quantity field
    expect(screen.queryByLabelText('Default Quantity')).not.toBeInTheDocument();
  });

  it('calls onSave with updated data', async () => {
    render(
      <EditServiceDialog
        service={mockService}
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    // Change the name - use a more flexible query
    const nameInput = screen.getByDisplayValue('Test Service');
    fireEvent.change(nameInput, { target: { value: 'Updated Service' } });

    // Change the price
    const priceInput = screen.getByLabelText('Price');
    fireEvent.focus(priceInput);
    fireEvent.change(priceInput, { target: { value: '25.00' } });
    fireEvent.blur(priceInput);

    // Save
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Updated Service',
          unit_price: 25,
        })
      );
    });
  });

  it('shows frequently used checkbox', () => {
    render(
      <EditServiceDialog
        service={mockService}
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(
      screen.getByLabelText('Mark as frequently used')
    ).toBeInTheDocument();
  });

  it('handles unit change', () => {
    render(
      <EditServiceDialog
        service={mockService}
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const unitSelect = screen.getByRole('combobox');
    fireEvent.mouseDown(unitSelect);

    // Find the menu item specifically
    const hourOption = screen.getByRole('option', { name: 'per hour' });
    fireEvent.click(hourOption);

    // Should now show per hour in the select
    const hourOptions = screen.getAllByText('per hour');
    expect(hourOptions.length).toBeGreaterThanOrEqual(1);
  });
});
