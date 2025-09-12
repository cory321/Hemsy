import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GarmentProvider, useGarment } from '../GarmentContext';
import { markGarmentAsPickedUp } from '@/lib/actions/garment-pickup';
import { checkGarmentBalanceStatus } from '@/lib/actions/garment-balance-check';
import { showSuccessToast, showErrorToast } from '@/lib/utils/toast';

// Mock the dependencies
jest.mock('@/lib/actions/garment-pickup');
jest.mock('@/lib/actions/garment-balance-check');
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
const mockCheckGarmentBalanceStatus =
  checkGarmentBalanceStatus as jest.MockedFunction<
    typeof checkGarmentBalanceStatus
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
    id: '550e8400-e29b-41d4-a716-446655440001',
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
    order_id: '550e8400-e29b-41d4-a716-446655440002',
    garment_services: [],
    totalPriceCents: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock for balance check - no outstanding balance
    mockCheckGarmentBalanceStatus.mockResolvedValue({
      success: true,
      isLastGarment: false,
      hasOutstandingBalance: false,
    });
  });

  // Helper to create a delay for testing async flows
  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

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

    // Wait for balance check to complete and stage to update optimistically
    await waitFor(() => {
      expect(screen.getByTestId('garment-stage')).toHaveTextContent('Done');
    });

    // Wait for the server action to complete
    await waitFor(() => {
      expect(mockMarkGarmentAsPickedUp).toHaveBeenCalledWith({
        garmentId: '550e8400-e29b-41d4-a716-446655440001',
      });
    });

    // Success toast should be shown
    expect(mockShowSuccessToast).toHaveBeenCalledWith(
      'Test Garment marked as picked up'
    );
  });

  it('rolls back stage on server error', async () => {
    // Add delay to mock so we can catch the optimistic update
    mockMarkGarmentAsPickedUp.mockImplementation(async () => {
      await delay(50); // Small delay to allow optimistic update
      return {
        success: false,
        error: 'Server error',
      };
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

    // Wait for balance check to be called first
    await waitFor(() => {
      expect(mockCheckGarmentBalanceStatus).toHaveBeenCalledWith({
        garmentId: '550e8400-e29b-41d4-a716-446655440001',
      });
    });

    // Wait for stage to update optimistically to Done
    await waitFor(() => {
      expect(screen.getByTestId('garment-stage')).toHaveTextContent('Done');
    });

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
    // Add delay to mock so we can catch the optimistic update
    mockMarkGarmentAsPickedUp.mockImplementation(async () => {
      await delay(50); // Small delay to allow optimistic update
      throw new Error('Network error');
    });

    render(
      <GarmentProvider initialGarment={initialGarment}>
        <TestComponent />
      </GarmentProvider>
    );

    const button = screen.getByText('Mark as Picked Up');
    fireEvent.click(button);

    // Wait for balance check to be called first
    await waitFor(() => {
      expect(mockCheckGarmentBalanceStatus).toHaveBeenCalledWith({
        garmentId: '550e8400-e29b-41d4-a716-446655440001',
      });
    });

    // Wait for stage to update optimistically to Done
    await waitFor(() => {
      expect(screen.getByTestId('garment-stage')).toHaveTextContent('Done');
    });

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

  it('shows balance dialog when there is outstanding balance', async () => {
    // Mock balance check to indicate outstanding balance
    mockCheckGarmentBalanceStatus.mockResolvedValue({
      success: true,
      isLastGarment: true,
      hasOutstandingBalance: true,
      balanceDue: 5000, // $50.00
      orderTotal: 10000, // $100.00
      paidAmount: 5000, // $50.00
      orderNumber: 'ORD-123',
      clientName: 'John Doe',
      invoiceId: 'inv-123',
      clientEmail: 'john@example.com',
    });

    render(
      <GarmentProvider initialGarment={initialGarment}>
        <TestComponent />
      </GarmentProvider>
    );

    const button = screen.getByText('Mark as Picked Up');
    fireEvent.click(button);

    // Should not update stage immediately (waiting for balance dialog)
    expect(screen.getByTestId('garment-stage')).toHaveTextContent(
      'Ready For Pickup'
    );

    // Should not call the pickup action yet
    expect(mockMarkGarmentAsPickedUp).not.toHaveBeenCalled();

    // Check that balance check was called
    await waitFor(() => {
      expect(mockCheckGarmentBalanceStatus).toHaveBeenCalledWith({
        garmentId: '550e8400-e29b-41d4-a716-446655440001',
      });
    });
  });

  it('proceeds with pickup when balance status is preloaded and no balance due', async () => {
    mockMarkGarmentAsPickedUp.mockResolvedValue({ success: true });

    // Provide initial balance status with no outstanding balance
    const balanceStatus = {
      isLastGarment: true,
      hasOutstandingBalance: false,
      balanceDue: 0,
      orderNumber: 'ORD-123',
      orderTotal: 10000,
      paidAmount: 10000,
      clientName: 'John Doe',
    };

    render(
      <GarmentProvider
        initialGarment={initialGarment}
        initialBalanceStatus={balanceStatus}
      >
        <TestComponent />
      </GarmentProvider>
    );

    const button = screen.getByText('Mark as Picked Up');
    fireEvent.click(button);

    // Should proceed directly to pickup without checking balance again
    await waitFor(() => {
      expect(screen.getByTestId('garment-stage')).toHaveTextContent('Done');
    });

    await waitFor(() => {
      expect(mockMarkGarmentAsPickedUp).toHaveBeenCalledWith({
        garmentId: '550e8400-e29b-41d4-a716-446655440001',
      });
    });

    // Should not call balance check since it was preloaded
    expect(mockCheckGarmentBalanceStatus).not.toHaveBeenCalled();

    expect(mockShowSuccessToast).toHaveBeenCalledWith(
      'Test Garment marked as picked up'
    );
  });
});
