import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GarmentProvider, useGarment } from '../GarmentContext';
import { markGarmentAsPickedUp } from '@/lib/actions/garment-pickup';
import { showSuccessToast, showErrorToast } from '@/lib/utils/toast';

// Mock the dependencies
jest.mock('@/lib/actions/garment-pickup');
jest.mock('@/lib/utils/toast');

const mockMarkGarmentAsPickedUp = markGarmentAsPickedUp as jest.MockedFunction<
  typeof markGarmentAsPickedUp
>;
const mockShowSuccessToast = showSuccessToast as jest.MockedFunction<
  typeof showSuccessToast
>;
const mockShowErrorToast = showErrorToast as jest.MockedFunction<
  typeof showErrorToast
>;

// Test component that uses the garment context
function TestComponent() {
  const { garment, markAsPickedUp } = useGarment();

  return (
    <div>
      <div data-testid="garment-stage">{garment.stage}</div>
      <button onClick={markAsPickedUp}>Mark as Picked Up</button>
    </div>
  );
}

describe('GarmentContext - markAsPickedUp', () => {
  const initialGarment = {
    id: 'test-garment-id',
    name: 'Test Garment',
    stage: 'Ready For Pickup',
    due_date: null,
    event_date: null,
    preset_icon_key: null,
    preset_fill_color: null,
    preset_outline_color: null,
    notes: null,
    photo_url: null,
    image_cloud_id: null,
    created_at: '2024-01-01',
    order_id: 'test-order-id',
    garment_services: [],
    totalPriceCents: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('optimistically updates garment stage to Done', async () => {
    mockMarkGarmentAsPickedUp.mockResolvedValue({ success: true });

    render(
      <GarmentProvider initialGarment={initialGarment}>
        <TestComponent />
      </GarmentProvider>
    );

    expect(screen.getByTestId('garment-stage')).toHaveTextContent(
      'Ready For Pickup'
    );

    const button = screen.getByText('Mark as Picked Up');
    fireEvent.click(button);

    // Stage should update immediately (optimistic update)
    expect(screen.getByTestId('garment-stage')).toHaveTextContent('Done');

    // Wait for the server action to complete
    await waitFor(() => {
      expect(mockMarkGarmentAsPickedUp).toHaveBeenCalledWith({
        garmentId: 'test-garment-id',
      });
    });

    // Success toast should be shown
    expect(mockShowSuccessToast).toHaveBeenCalledWith(
      'Test Garment marked as picked up'
    );
  });

  it('rolls back stage on server error', async () => {
    mockMarkGarmentAsPickedUp.mockResolvedValue({
      success: false,
      error: 'Server error',
    });

    render(
      <GarmentProvider initialGarment={initialGarment}>
        <TestComponent />
      </GarmentProvider>
    );

    expect(screen.getByTestId('garment-stage')).toHaveTextContent(
      'Ready For Pickup'
    );

    const button = screen.getByText('Mark as Picked Up');
    fireEvent.click(button);

    // Stage should update immediately
    expect(screen.getByTestId('garment-stage')).toHaveTextContent('Done');

    // Wait for the server action to complete and rollback
    await waitFor(() => {
      expect(screen.getByTestId('garment-stage')).toHaveTextContent(
        'Ready For Pickup'
      );
    });

    // Error toast should be shown
    expect(mockShowErrorToast).toHaveBeenCalledWith('Server error');
  });

  it('shows error if garment is not in Ready For Pickup stage', async () => {
    const notReadyGarment = {
      ...initialGarment,
      stage: 'In Progress',
    };

    render(
      <GarmentProvider initialGarment={notReadyGarment}>
        <TestComponent />
      </GarmentProvider>
    );

    const button = screen.getByText('Mark as Picked Up');
    fireEvent.click(button);

    // Should not call server action
    expect(mockMarkGarmentAsPickedUp).not.toHaveBeenCalled();

    // Error toast should be shown
    expect(mockShowErrorToast).toHaveBeenCalledWith(
      'Garment must be in "Ready For Pickup" stage to mark as picked up'
    );

    // Stage should remain unchanged
    expect(screen.getByTestId('garment-stage')).toHaveTextContent(
      'In Progress'
    );
  });

  it('handles unexpected errors gracefully', async () => {
    mockMarkGarmentAsPickedUp.mockRejectedValue(new Error('Network error'));

    render(
      <GarmentProvider initialGarment={initialGarment}>
        <TestComponent />
      </GarmentProvider>
    );

    const button = screen.getByText('Mark as Picked Up');
    fireEvent.click(button);

    // Stage should update immediately
    expect(screen.getByTestId('garment-stage')).toHaveTextContent('Done');

    // Wait for the error and rollback
    await waitFor(() => {
      expect(screen.getByTestId('garment-stage')).toHaveTextContent(
        'Ready For Pickup'
      );
    });

    // Error toast should be shown
    expect(mockShowErrorToast).toHaveBeenCalledWith(
      'An unexpected error occurred'
    );
  });
});
