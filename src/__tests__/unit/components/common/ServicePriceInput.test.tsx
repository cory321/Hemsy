import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ServicePriceInput from '@/components/common/ServicePriceInput';

describe('ServicePriceInput', () => {
  const defaultProps = {
    price: '10.00',
    unit: 'flat_rate' as const,
    quantity: 1,
    onPriceChange: jest.fn(),
    onUnitChange: jest.fn(),
    onQuantityChange: jest.fn(),
    showTotal: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all fields correctly for flat_rate', () => {
    render(<ServicePriceInput {...defaultProps} />);

    expect(screen.getByLabelText('Price')).toBeInTheDocument();
    expect(screen.getByText('flat rate')).toBeInTheDocument();
    // Quantity field should not be visible for flat_rate
    expect(screen.queryByLabelText('Quantity')).not.toBeInTheDocument();
  });

  it('renders all fields correctly for hour unit', () => {
    render(<ServicePriceInput {...defaultProps} unit="hour" />);

    expect(screen.getByLabelText('Price')).toBeInTheDocument();
    expect(screen.getByText('per hour')).toBeInTheDocument();
    expect(screen.getByLabelText('Hours')).toBeInTheDocument();
  });

  it('hides quantity field when unit is flat_rate', () => {
    render(<ServicePriceInput {...defaultProps} />);

    const quantityField = screen.queryByLabelText('Quantity');
    expect(quantityField).not.toBeInTheDocument();
  });

  it('shows quantity field when unit is hour', () => {
    render(<ServicePriceInput {...defaultProps} unit="hour" />);

    const quantityField = screen.getByLabelText('Hours');
    expect(quantityField).toBeInTheDocument();
    expect(quantityField).not.toBeDisabled();
  });

  it('shows quantity field when unit is day', () => {
    render(<ServicePriceInput {...defaultProps} unit="day" />);

    const quantityField = screen.getByLabelText('Days');
    expect(quantityField).toBeInTheDocument();
    expect(quantityField).not.toBeDisabled();
  });

  it('calls onQuantityChange when quantity is updated', () => {
    render(<ServicePriceInput {...defaultProps} unit="hour" />);

    const quantityField = screen.getByLabelText('Hours');
    fireEvent.change(quantityField, { target: { value: '5' } });

    expect(defaultProps.onQuantityChange).toHaveBeenCalledWith(5);
  });

  it('resets quantity to 1 when changing from hour/day to flat_rate', () => {
    const { rerender } = render(
      <ServicePriceInput {...defaultProps} unit="hour" quantity={5} />
    );

    // Simulate changing unit from hour to flat_rate
    rerender(
      <ServicePriceInput {...defaultProps} unit="flat_rate" quantity={5} />
    );

    // Component should call onQuantityChange with 1
    waitFor(() => {
      expect(defaultProps.onQuantityChange).toHaveBeenCalledWith(1);
    });
  });

  it('displays correct total for flat_rate', () => {
    render(<ServicePriceInput {...defaultProps} price="50.00" />);

    expect(screen.getByText('Total: $50.00')).toBeInTheDocument();
  });

  it('displays correct total for hourly rate', () => {
    render(
      <ServicePriceInput
        {...defaultProps}
        price="25.00"
        unit="hour"
        quantity={4}
      />
    );

    expect(screen.getByText('Total: $100.00 (4 hours)')).toBeInTheDocument();
  });

  it('displays correct total for daily rate', () => {
    render(
      <ServicePriceInput
        {...defaultProps}
        price="200.00"
        unit="day"
        quantity={3}
      />
    );

    expect(screen.getByText('Total: $600.00 (3 days)')).toBeInTheDocument();
  });

  it('ensures quantity is at least 1 on blur', () => {
    render(<ServicePriceInput {...defaultProps} unit="hour" />);

    const quantityField = screen.getByLabelText('Hours');

    // Set quantity to 0
    fireEvent.change(quantityField, { target: { value: '0' } });
    expect(defaultProps.onQuantityChange).toHaveBeenCalledWith(0);

    // Blur the field
    fireEvent.blur(quantityField);

    // Should reset to 1
    expect(defaultProps.onQuantityChange).toHaveBeenCalledWith(1);
  });

  it('handles price changes correctly', () => {
    render(<ServicePriceInput {...defaultProps} />);

    const priceField = screen.getByLabelText('Price');
    fireEvent.change(priceField, { target: { value: '25.50' } });

    expect(defaultProps.onPriceChange).toHaveBeenCalled();
  });

  it('handles unit changes correctly', () => {
    render(<ServicePriceInput {...defaultProps} />);

    const unitSelect = screen.getByText('flat rate');
    fireEvent.mouseDown(unitSelect);

    const hourOption = screen.getByRole('option', { name: 'per hour' });
    fireEvent.click(hourOption);

    expect(defaultProps.onUnitChange).toHaveBeenCalledWith('hour');
  });

  it('hides total when showTotal is false', () => {
    render(<ServicePriceInput {...defaultProps} showTotal={false} />);

    expect(screen.queryByText(/Total:/)).not.toBeInTheDocument();
  });

  it('handles disabled state correctly', () => {
    render(<ServicePriceInput {...defaultProps} disabled={true} unit="hour" />);

    expect(screen.getByLabelText('Price')).toBeDisabled();
    expect(screen.getByText('per hour')).toBeInTheDocument();
    expect(screen.getByLabelText('Hours')).toBeDisabled();
  });
});
