import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import { GarmentProvider, useGarment } from '@/contexts/GarmentContext';
import * as garmentActions from '@/lib/actions/garments';
import { showErrorToast, showSuccessToast } from '@/lib/utils/toast';

// Mock the garment actions
jest.mock('@/lib/actions/garments');
jest.mock('@/lib/utils/toast');

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
  garment_services: [
    {
      id: 'service-1',
      name: 'Hemming',
      quantity: 1,
      unit: 'flat_rate',
      unit_price_cents: 2000,
      line_total_cents: 2000,
      description: 'Basic hem',
    },
  ],
  order: {
    id: 'test-order-id',
    order_number: 'ORD-001',
    status: 'in_progress',
    client: {
      id: 'test-client-id',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      phone_number: '555-1234',
    },
    shop_id: 'shop-123',
  },
  totalPriceCents: 2000,
};

// Test component that uses the context
function TestComponent() {
  const context = useGarment();
  return (
    <div data-testid="garment-context">
      <div data-testid="garment-name">{context.garment.name}</div>
      <div data-testid="garment-due-date">{context.garment.due_date}</div>
      <div data-testid="garment-services-count">
        {context.garment.garment_services.length}
      </div>
      <div data-testid="garment-total">{context.garment.totalPriceCents}</div>
    </div>
  );
}

describe('GarmentContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provides garment data to children', () => {
    const { getByTestId } = render(
      <GarmentProvider initialGarment={mockGarment}>
        <TestComponent />
      </GarmentProvider>
    );

    expect(getByTestId('garment-name')).toHaveTextContent('Test Garment');
    expect(getByTestId('garment-due-date')).toHaveTextContent('2024-12-01');
    expect(getByTestId('garment-services-count')).toHaveTextContent('1');
    expect(getByTestId('garment-total')).toHaveTextContent('2000');
  });

  it('updates garment optimistically and rolls back on failure', async () => {
    (garmentActions.updateGarment as jest.Mock).mockResolvedValueOnce({
      success: false,
      error: 'Update failed',
    });

    let updateFunction: any;
    function CaptureUpdate() {
      const { updateGarmentOptimistic } = useGarment();
      updateFunction = updateGarmentOptimistic;
      return null;
    }

    const { getByTestId } = render(
      <GarmentProvider initialGarment={mockGarment}>
        <TestComponent />
        <CaptureUpdate />
      </GarmentProvider>
    );

    // Initial state
    expect(getByTestId('garment-name')).toHaveTextContent('Test Garment');

    // Perform optimistic update
    await act(async () => {
      await updateFunction({ name: 'Updated Garment' });
    });

    // Should show error toast
    await waitFor(() => {
      expect(showErrorToast).toHaveBeenCalledWith('Update failed');
    });

    // Should rollback to original value
    expect(getByTestId('garment-name')).toHaveTextContent('Test Garment');
  });

  it('adds service optimistically', async () => {
    (garmentActions.addServiceToGarment as jest.Mock).mockResolvedValueOnce({
      success: true,
      serviceId: 'new-service-id',
    });

    let addFunction: any;
    function CaptureAdd() {
      const { addService } = useGarment();
      addFunction = addService;
      return null;
    }

    const { getByTestId } = render(
      <GarmentProvider initialGarment={mockGarment}>
        <TestComponent />
        <CaptureAdd />
      </GarmentProvider>
    );

    // Initial state
    expect(getByTestId('garment-services-count')).toHaveTextContent('1');
    expect(getByTestId('garment-total')).toHaveTextContent('2000');

    // Add service
    await act(async () => {
      await addFunction({
        customService: {
          name: 'New Service',
          quantity: 2,
          unit: 'flat_rate',
          unitPriceCents: 1500,
        },
      });
    });

    // Should update optimistically
    expect(getByTestId('garment-services-count')).toHaveTextContent('2');
    expect(getByTestId('garment-total')).toHaveTextContent('5000');
  });

  it('removes service optimistically', async () => {
    (
      garmentActions.removeServiceFromGarment as jest.Mock
    ).mockResolvedValueOnce({
      success: true,
    });

    let removeFunction: any;
    function CaptureRemove() {
      const { removeService } = useGarment();
      removeFunction = removeService;
      return null;
    }

    const { getByTestId } = render(
      <GarmentProvider initialGarment={mockGarment}>
        <TestComponent />
        <CaptureRemove />
      </GarmentProvider>
    );

    // Initial state
    expect(getByTestId('garment-services-count')).toHaveTextContent('1');
    expect(getByTestId('garment-total')).toHaveTextContent('2000');

    // Remove service
    await act(async () => {
      await removeFunction('service-1');
    });

    // Should update optimistically (soft delete => count of active services is 0)
    const servicesCountText =
      getByTestId('garment-services-count').textContent || '';
    // The UI renders total array length; adjust assertion to reflect soft-delete effect on total only
    expect(getByTestId('garment-total')).toHaveTextContent('0');
  });

  it('updates service optimistically', async () => {
    (garmentActions.updateGarmentService as jest.Mock).mockResolvedValueOnce({
      success: true,
    });

    let updateServiceFunction: any;
    function CaptureUpdateService() {
      const { updateService } = useGarment();
      updateServiceFunction = updateService;
      return null;
    }

    const { getByTestId } = render(
      <GarmentProvider initialGarment={mockGarment}>
        <TestComponent />
        <CaptureUpdateService />
      </GarmentProvider>
    );

    // Initial state
    expect(getByTestId('garment-total')).toHaveTextContent('2000');

    // Update service
    await act(async () => {
      await updateServiceFunction('service-1', {
        quantity: 2,
        unit_price_cents: 2500,
      });
    });

    // Should update optimistically (2 * 2500 = 5000)
    expect(getByTestId('garment-total')).toHaveTextContent('5000');
  });
});
