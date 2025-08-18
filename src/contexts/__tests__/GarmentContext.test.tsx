import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GarmentProvider, useGarment } from '../GarmentContext';
import { toggleServiceCompletion } from '@/lib/actions/garment-services';
import { toast } from 'sonner';

// Mock dependencies
jest.mock('@/lib/actions/garments');
jest.mock('@/lib/actions/garment-services');
jest.mock('sonner');

const mockGarment = {
  id: 'garment-123',
  name: 'Wedding Dress',
  due_date: '2024-02-01',
  event_date: '2024-02-15',
  preset_icon_key: null,
  preset_fill_color: null,
  preset_outline_color: null,
  notes: 'Handle with care',
  stage: 'New',
  photo_url: null,
  image_cloud_id: null,
  created_at: '2024-01-01',
  garment_services: [
    {
      id: 'service-1',
      name: 'Hemming',
      quantity: 1,
      unit: 'flat_rate',
      unit_price_cents: 5000,
      line_total_cents: 5000,
      description: null,
      is_done: false,
    },
    {
      id: 'service-2',
      name: 'Fitting',
      quantity: 1,
      unit: 'hour',
      unit_price_cents: 8000,
      line_total_cents: 8000,
      description: 'Full dress fitting',
      is_done: false,
    },
  ],
  order: {
    order_number: 'ORD-001',
    client: {
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'jane@example.com',
      phone_number: '555-1234',
    },
    shop_id: 'shop-123',
  },
  totalPriceCents: 13000,
};

// Test component that uses the context
function TestComponent() {
  const { garment, toggleServiceComplete } = useGarment();

  return (
    <div>
      <div data-testid="garment-stage">{garment.stage}</div>
      <div data-testid="services">
        {garment.garment_services.map((service) => (
          <div key={service.id} data-testid={`service-${service.id}`}>
            <span>{service.name}</span>
            <span data-testid={`service-${service.id}-status`}>
              {service.is_done ? 'Complete' : 'Incomplete'}
            </span>
            <button
              onClick={() =>
                toggleServiceComplete(service.id, !service.is_done)
              }
              data-testid={`toggle-${service.id}`}
            >
              Toggle
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

describe('GarmentContext - toggleServiceComplete', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should optimistically update service completion status', async () => {
    (toggleServiceCompletion as jest.Mock).mockResolvedValue({
      success: true,
      updatedStage: 'In Progress',
    });

    render(
      <GarmentProvider initialGarment={mockGarment}>
        <TestComponent />
      </GarmentProvider>
    );

    // Initial state
    expect(screen.getByTestId('garment-stage')).toHaveTextContent('New');
    expect(screen.getByTestId('service-service-1-status')).toHaveTextContent(
      'Incomplete'
    );

    // Toggle service completion
    const toggleButton = screen.getByTestId('toggle-service-1');
    await userEvent.click(toggleButton);

    // Check optimistic update
    expect(screen.getByTestId('service-service-1-status')).toHaveTextContent(
      'Complete'
    );
    expect(screen.getByTestId('garment-stage')).toHaveTextContent(
      'In Progress'
    );

    // Verify the action was called
    await waitFor(() => {
      expect(toggleServiceCompletion).toHaveBeenCalledWith({
        garmentServiceId: 'service-1',
        isDone: true,
      });
    });
  });

  it('should update stage to "Ready For Pickup" when all services are complete', async () => {
    (toggleServiceCompletion as jest.Mock).mockResolvedValue({
      success: true,
      updatedStage: 'Ready For Pickup',
    });

    // Start with one service already completed
    const garmentWithOneComplete = {
      ...mockGarment,
      garment_services: [
        { ...mockGarment.garment_services[0], is_done: true },
        mockGarment.garment_services[1],
      ],
    } as any;

    render(
      <GarmentProvider initialGarment={garmentWithOneComplete}>
        <TestComponent />
      </GarmentProvider>
    );

    // Toggle the second service
    const toggleButton = screen.getByTestId('toggle-service-2');
    await userEvent.click(toggleButton);

    // Check that stage updated to "Ready For Pickup"
    expect(screen.getByTestId('garment-stage')).toHaveTextContent(
      'Ready For Pickup'
    );
  });

  it('should update stage to "New" when all services are marked incomplete', async () => {
    (toggleServiceCompletion as jest.Mock).mockResolvedValue({
      success: true,
      updatedStage: 'New',
    });

    // Start with one service completed
    const garmentWithOneComplete = {
      ...mockGarment,
      stage: 'In Progress',
      garment_services: [
        { ...mockGarment.garment_services[0], is_done: true },
        mockGarment.garment_services[1],
      ],
    } as any;

    render(
      <GarmentProvider initialGarment={garmentWithOneComplete}>
        <TestComponent />
      </GarmentProvider>
    );

    // Toggle the completed service to incomplete
    const toggleButton = screen.getByTestId('toggle-service-1');
    await userEvent.click(toggleButton);

    // Check that stage updated to "New"
    expect(screen.getByTestId('garment-stage')).toHaveTextContent('New');
  });

  it('should rollback on failure and show error toast', async () => {
    (toggleServiceCompletion as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Failed to update service',
    });

    render(
      <GarmentProvider initialGarment={mockGarment}>
        <TestComponent />
      </GarmentProvider>
    );

    // Initial state
    expect(screen.getByTestId('service-service-1-status')).toHaveTextContent(
      'Incomplete'
    );
    expect(screen.getByTestId('garment-stage')).toHaveTextContent('New');

    // Toggle service completion
    const toggleButton = screen.getByTestId('toggle-service-1');
    await userEvent.click(toggleButton);

    // Wait for rollback
    await waitFor(() => {
      // Should rollback to original state
      expect(screen.getByTestId('service-service-1-status')).toHaveTextContent(
        'Incomplete'
      );
      expect(screen.getByTestId('garment-stage')).toHaveTextContent('New');

      // Should show error toast
      expect(toast.error).toHaveBeenCalledWith('Failed to update service');
    });
  });

  it('should show success toast on successful completion', async () => {
    (toggleServiceCompletion as jest.Mock).mockResolvedValue({
      success: true,
      updatedStage: 'In Progress',
    });

    render(
      <GarmentProvider initialGarment={mockGarment}>
        <TestComponent />
      </GarmentProvider>
    );

    // Toggle service to complete
    const toggleButton = screen.getByTestId('toggle-service-1');
    await userEvent.click(toggleButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Service marked as complete');
    });
  });

  it('should show success toast when marking service as incomplete', async () => {
    (toggleServiceCompletion as jest.Mock).mockResolvedValue({
      success: true,
      updatedStage: 'New',
    });

    const garmentWithCompleteService = {
      ...mockGarment,
      garment_services: [
        { ...mockGarment.garment_services[0], is_done: true },
        mockGarment.garment_services[1],
      ],
    } as any;

    render(
      <GarmentProvider initialGarment={garmentWithCompleteService}>
        <TestComponent />
      </GarmentProvider>
    );

    // Toggle service to incomplete
    const toggleButton = screen.getByTestId('toggle-service-1');
    await userEvent.click(toggleButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'Service marked as incomplete'
      );
    });
  });

  it('should handle unexpected errors gracefully', async () => {
    (toggleServiceCompletion as jest.Mock).mockRejectedValue(
      new Error('Network error')
    );

    render(
      <GarmentProvider initialGarment={mockGarment}>
        <TestComponent />
      </GarmentProvider>
    );

    // Toggle service completion
    const toggleButton = screen.getByTestId('toggle-service-1');
    await userEvent.click(toggleButton);

    await waitFor(() => {
      // Should show generic error toast
      expect(toast.error).toHaveBeenCalledWith('An unexpected error occurred');

      // Should rollback to original state
      expect(screen.getByTestId('service-service-1-status')).toHaveTextContent(
        'Incomplete'
      );
      expect(screen.getByTestId('garment-stage')).toHaveTextContent('New');
    });
  });

  it('should not do anything if service is not found', async () => {
    const TestComponentWithInvalidId = () => {
      const { toggleServiceComplete } = useGarment();

      return (
        <button
          onClick={() => toggleServiceComplete('invalid-id', true)}
          data-testid="toggle-invalid"
        >
          Toggle Invalid
        </button>
      );
    };

    render(
      <GarmentProvider initialGarment={mockGarment}>
        <TestComponentWithInvalidId />
      </GarmentProvider>
    );

    // Click button with invalid service ID
    const toggleButton = screen.getByTestId('toggle-invalid');
    await userEvent.click(toggleButton);

    // Should not call the server action
    expect(toggleServiceCompletion).not.toHaveBeenCalled();
  });
});
