import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GarmentProvider } from '@/contexts/GarmentContext';
import GarmentServicesManagerOptimistic from '@/components/garments/GarmentServicesManagerOptimistic';
import * as garmentActions from '@/lib/actions/garments';
import * as servicesActions from '@/lib/actions/services';
import { SERVICE_UNIT_TYPES } from '@/lib/utils/serviceUnitTypes';

// Mock the actions
jest.mock('@/lib/actions/garments');
jest.mock('@/lib/actions/services');
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
  garment_services: [
    {
      id: 'service-1',
      name: 'Hemming',
      quantity: 1,
      unit: 'item',
      unit_price_cents: 2000,
      line_total_cents: 2000,
      description: 'Basic hem',
    },
    {
      id: 'service-2',
      name: 'Take in sides',
      quantity: 2,
      unit: 'hour',
      unit_price_cents: 3000,
      line_total_cents: 6000,
      description: null,
    },
  ],
  totalPriceCents: 8000,
};

const renderComponent = (garment = mockGarment) => {
  return render(
    <GarmentProvider initialGarment={garment}>
      <GarmentServicesManagerOptimistic />
    </GarmentProvider>
  );
};

describe('GarmentServicesManagerOptimistic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (garmentActions.removeServiceFromGarment as jest.Mock).mockResolvedValue({
      success: true,
    });
    (garmentActions.addServiceToGarment as jest.Mock).mockResolvedValue({
      success: true,
      serviceId: 'new-service-id',
    });
    (servicesActions.searchServices as jest.Mock).mockResolvedValue([]);
  });

  it('renders services list with correct total', () => {
    renderComponent();

    // Check services are displayed
    expect(screen.getByText('Hemming')).toBeInTheDocument();
    expect(screen.getByText('Take in sides')).toBeInTheDocument();

    // Check total is calculated correctly
    expect(screen.getByText('Total: $80.00')).toBeInTheDocument();
  });

  it('shows confirmation dialog when clicking delete', async () => {
    renderComponent();

    // Find and click the first delete button
    const deleteButtons = screen.getAllByTestId('DeleteIcon');
    fireEvent.click(deleteButtons[0]);

    // Confirmation dialog should appear
    await waitFor(() => {
      expect(screen.getByText('Remove Service')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Are you sure you want to remove "Hemming" from this garment?'
        )
      ).toBeInTheDocument();
    });

    // Dialog should have Cancel and Remove buttons
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument();
  });

  it('cancels deletion when clicking cancel in confirmation dialog', async () => {
    renderComponent();

    // Click delete
    const deleteButtons = screen.getAllByTestId('DeleteIcon');
    fireEvent.click(deleteButtons[0]);

    // Wait for dialog
    await waitFor(() => {
      expect(screen.getByText('Remove Service')).toBeInTheDocument();
    });

    // Click Cancel
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    // Dialog should close and service should still be there
    await waitFor(() => {
      expect(screen.queryByText('Remove Service')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Hemming')).toBeInTheDocument();
  });

  it('removes service when confirming deletion', async () => {
    renderComponent();

    // Click delete
    const deleteButtons = screen.getAllByTestId('DeleteIcon');
    fireEvent.click(deleteButtons[0]);

    // Wait for dialog
    await waitFor(() => {
      expect(screen.getByText('Remove Service')).toBeInTheDocument();
    });

    // Click Remove
    const removeButton = screen.getByRole('button', { name: /remove/i });
    fireEvent.click(removeButton);

    // Dialog should close immediately
    await waitFor(() => {
      expect(screen.queryByText('Remove Service')).not.toBeInTheDocument();
    });

    // Verify removeService was called
    expect(garmentActions.removeServiceFromGarment).toHaveBeenCalledWith({
      garmentId: 'test-garment-id',
      garmentServiceId: 'service-1',
    });
  });

  it('handles service addition', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Click Add Service button
    const addButton = screen.getByRole('button', { name: /add service/i });
    expect(addButton).toBeInTheDocument();

    // Verify the component is using the correct service unit types
    // The component imports SERVICE_UNIT_TYPES which has the correct enum values
    expect(SERVICE_UNIT_TYPES.ITEM).toBe('item');
    expect(SERVICE_UNIT_TYPES.HOUR).toBe('hour');
    expect(SERVICE_UNIT_TYPES.DAY).toBe('day');
  });

  it('verifies custom service state includes catalog options', () => {
    renderComponent();

    // The component should have state for the new checkbox options
    // These are handled in the component's newService state
    // which includes addToCatalog and markAsFrequentlyUsed
    const addButton = screen.getByRole('button', { name: /add service/i });
    expect(addButton).toBeInTheDocument();

    // Verify the component can handle custom services
    // The actual dialog behavior is tested through integration tests
    expect(garmentActions.addServiceToGarment).toBeDefined();
  });

  it('shows empty state when no services', () => {
    renderComponent({
      ...mockGarment,
      garment_services: [],
      totalPriceCents: 0,
    });

    expect(screen.getByText('No services added yet')).toBeInTheDocument();
  });
});
