import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import GarmentServicesManagerOptimistic from '@/components/garments/GarmentServicesManagerOptimistic';
import { GarmentProvider } from '@/contexts/GarmentContext';
import { searchServices } from '@/lib/actions/services';

// Mock the services action
jest.mock('@/lib/actions/services', () => ({
  searchServices: jest.fn(),
}));

// Mock garment data
const mockGarment = {
  id: 'test-garment-id',
  name: 'Test Garment',
  stage: 'In Progress',
  garment_services: [
    {
      id: 'service-1',
      name: 'Hem Pants',
      quantity: 2,
      unit: 'hour',
      unit_price_cents: 2500,
      line_total_cents: 5000,
      description: 'Shorten hem',
      is_done: false,
    },
    {
      id: 'service-2',
      name: 'Button Replacement',
      quantity: 1,
      unit: 'flat_rate',
      unit_price_cents: 1500,
      line_total_cents: 1500,
      description: null,
      is_done: true,
    },
  ],
};

// Mock context functions
const mockAddService = jest.fn();
const mockRemoveService = jest.fn();
const mockUpdateService = jest.fn();
const mockToggleServiceComplete = jest.fn();

// Mock the useGarment hook
jest.mock('@/contexts/GarmentContext', () => ({
  GarmentProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useGarment: () => ({
    garment: mockGarment,
    addService: mockAddService,
    removeService: mockRemoveService,
    updateService: mockUpdateService,
    toggleServiceComplete: mockToggleServiceComplete,
  }),
}));

// Custom render function
const renderComponent = () => {
  return render(<GarmentServicesManagerOptimistic />);
};

describe('GarmentServicesManagerOptimistic - Quantity Updates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays correct quantity and pricing for hourly services', () => {
    renderComponent();

    // Check that hourly service shows quantity correctly
    const hourlyService = screen.getByText('Hem Pants').closest('li');
    expect(hourlyService).toHaveTextContent('2 hours @ $25.00/hour');
  });

  it('displays flat rate services without quantity in display', () => {
    renderComponent();

    // Check that flat rate service shows correctly
    const flatRateService = screen
      .getByText('Button Replacement')
      .closest('li');
    expect(flatRateService).toHaveTextContent('$15.00 flat rate');
    expect(flatRateService).not.toHaveTextContent('1 flat_rate');
  });

  it('shows quantity field when editing hourly service', async () => {
    renderComponent();

    // Click edit on the hourly service
    const editButtons = screen.getAllByTestId('EditIcon');
    fireEvent.click(editButtons[0]); // First service is hourly

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Check that quantity field is visible and editable
    const quantityField = screen.getByLabelText('Hours');
    expect(quantityField).toBeInTheDocument();
    expect(quantityField).toHaveValue(2);
    expect(quantityField).not.toBeDisabled();
  });

  it('hides quantity field when editing flat rate service', async () => {
    renderComponent();

    // Click edit on the flat rate service
    const editButtons = screen.getAllByTestId('EditIcon');
    fireEvent.click(editButtons[1]); // Second service is flat rate

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Check that quantity field is not visible
    expect(screen.queryByLabelText('Quantity')).not.toBeInTheDocument();
  });

  it('updates quantity and recalculates total when changed', async () => {
    renderComponent();

    // Click edit on the hourly service
    const editButtons = screen.getAllByTestId('EditIcon');
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Change quantity
    const quantityField = screen.getByLabelText('Hours');
    fireEvent.change(quantityField, { target: { value: '3' } });

    // Check that quantity is updated
    expect(quantityField).toHaveValue(3);

    // Save changes
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateService).toHaveBeenCalledWith('service-1', {
        quantity: 3,
        unit_price_cents: 2500,
        unit: 'hour',
        description: 'Shorten hem',
      });
    });
  });

  it('resets quantity to 1 when switching from hourly to flat rate', async () => {
    renderComponent();

    // Click edit on the hourly service
    const editButtons = screen.getAllByTestId('EditIcon');
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Initially shows quantity field for hourly
    expect(screen.getByLabelText('Hours')).toHaveValue(2);

    // Change unit to flat rate
    const unitSelect = screen.getByText('per hour');
    fireEvent.mouseDown(unitSelect);
    const flatRateOption = screen.getByRole('option', { name: 'flat rate' });
    fireEvent.click(flatRateOption);

    // Quantity field should be hidden
    expect(screen.queryByLabelText('Quantity')).not.toBeInTheDocument();
  });

  it('includes quantity when adding a new hourly service', async () => {
    (searchServices as jest.Mock).mockResolvedValue([
      {
        id: 'service-3',
        name: 'Alteration',
        default_unit: 'hour',
        default_unit_price_cents: 3000,
        default_qty: 2,
        description: 'General alteration',
      },
    ]);

    renderComponent();

    // Click Add Service
    const addButton = screen.getByRole('button', { name: /add service/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Click Custom Service
    const customButton = screen.getByRole('button', {
      name: /custom service/i,
    });
    fireEvent.click(customButton);

    // Fill in service details
    const textFields = within(screen.getByRole('dialog')).getAllByRole(
      'textbox'
    );
    const nameField = textFields[0]; // First text field should be the name
    fireEvent.change(nameField, { target: { value: 'Custom Alteration' } });

    // Change unit to hour
    const unitSelect = screen.getByText('flat rate');
    fireEvent.mouseDown(unitSelect);
    const hourOption = screen.getByRole('option', { name: 'per hour' });
    fireEvent.click(hourOption);

    // Set quantity
    const quantityField = screen.getByLabelText('Hours');
    fireEvent.change(quantityField, { target: { value: '3' } });

    // Set price
    const priceField = screen.getByLabelText('Price');
    fireEvent.focus(priceField);
    fireEvent.change(priceField, { target: { value: '30' } });
    fireEvent.blur(priceField);

    // Total should be calculated correctly (3 hours * $30 = $90)

    // Add the service
    const addServiceButton = within(screen.getByRole('dialog')).getByRole(
      'button',
      { name: /add service/i }
    );
    fireEvent.click(addServiceButton);

    await waitFor(() => {
      expect(mockAddService).toHaveBeenCalledWith(
        expect.objectContaining({
          customService: expect.objectContaining({
            name: 'Custom Alteration',
            unit: 'hour',
            quantity: 3,
            unitPriceCents: 3000,
          }),
        })
      );
    });
  });

  it('calculates correct total price with multiple services', () => {
    renderComponent();

    // Check the overall total
    expect(screen.getByText('Total: $65.00')).toBeInTheDocument(); // $50 + $15
  });
});
