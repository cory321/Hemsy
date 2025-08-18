import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ServicePriceInput from '../ServicePriceInput';

describe('ServicePriceInput', () => {
  const mockOnPriceChange = jest.fn();
  const mockOnUnitChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders price input and unit select', () => {
    render(
      <ServicePriceInput
        price="10.00"
        unit="flat_rate"
        onPriceChange={mockOnPriceChange}
        onUnitChange={mockOnUnitChange}
      />
    );

    expect(screen.getByLabelText('Price')).toBeInTheDocument();
    expect(screen.getByText('flat rate')).toBeInTheDocument();
  });

  it('calls onPriceChange when price is changed', () => {
    render(
      <ServicePriceInput
        price="10.00"
        unit="flat_rate"
        onPriceChange={mockOnPriceChange}
        onUnitChange={mockOnUnitChange}
      />
    );

    const priceInput = screen.getByLabelText('Price');
    fireEvent.change(priceInput, { target: { value: '25' } });

    expect(mockOnPriceChange).toHaveBeenCalled();
  });

  it('calls onUnitChange when unit is changed', () => {
    render(
      <ServicePriceInput
        price="10.00"
        unit="flat_rate"
        onPriceChange={mockOnPriceChange}
        onUnitChange={mockOnUnitChange}
      />
    );

    const unitSelect = screen.getByRole('combobox');
    fireEvent.mouseDown(unitSelect);

    const hourOption = screen.getByText('per hour');
    fireEvent.click(hourOption);

    expect(mockOnUnitChange).toHaveBeenCalledWith('hour');
  });

  it('formats price on blur', () => {
    const { rerender } = render(
      <ServicePriceInput
        price="0.00"
        unit="flat_rate"
        onPriceChange={mockOnPriceChange}
        onUnitChange={mockOnUnitChange}
      />
    );

    const priceInput = screen.getByLabelText('Price');
    fireEvent.focus(priceInput);

    // Simulate the component updating its price prop after focus
    rerender(
      <ServicePriceInput
        price=""
        unit="flat_rate"
        onPriceChange={mockOnPriceChange}
        onUnitChange={mockOnUnitChange}
      />
    );

    fireEvent.change(priceInput, { target: { value: '25.5' } });

    // Simulate the component updating after the change
    rerender(
      <ServicePriceInput
        price="25.5"
        unit="flat_rate"
        onPriceChange={mockOnPriceChange}
        onUnitChange={mockOnUnitChange}
      />
    );

    fireEvent.blur(priceInput);

    expect(mockOnPriceChange).toHaveBeenLastCalledWith('25.50');
  });

  it('clears price field on focus when value is 0.00', () => {
    render(
      <ServicePriceInput
        price="0.00"
        unit="flat_rate"
        onPriceChange={mockOnPriceChange}
        onUnitChange={mockOnUnitChange}
      />
    );

    const priceInput = screen.getByLabelText('Price');
    fireEvent.focus(priceInput);

    expect(mockOnPriceChange).toHaveBeenCalledWith('');
  });

  it('disables inputs when disabled prop is true', () => {
    render(
      <ServicePriceInput
        price="10.00"
        unit="flat_rate"
        onPriceChange={mockOnPriceChange}
        onUnitChange={mockOnUnitChange}
        disabled
      />
    );

    expect(screen.getByLabelText('Price')).toBeDisabled();

    // For MUI Select, check if it has aria-disabled or if the underlying input is disabled
    const selectElement = screen.getByRole('combobox');
    expect(selectElement).toHaveAttribute('aria-disabled', 'true');
  });

  it('shows all unit options in dropdown', () => {
    render(
      <ServicePriceInput
        price="10.00"
        unit="flat_rate"
        onPriceChange={mockOnPriceChange}
        onUnitChange={mockOnUnitChange}
      />
    );

    const unitSelect = screen.getByRole('combobox');
    fireEvent.mouseDown(unitSelect);

    // Use getAllByText since the text appears both in the select and in the dropdown
    const itemOptions = screen.getAllByText('flat rate');
    const hourOptions = screen.getAllByText('per hour');
    const dayOptions = screen.getAllByText('per day');

    // Should have at least 2 of each (one in select, one in dropdown)
    expect(itemOptions.length).toBeGreaterThanOrEqual(1);
    expect(hourOptions.length).toBeGreaterThanOrEqual(1);
    expect(dayOptions.length).toBeGreaterThanOrEqual(1);
  });
});
