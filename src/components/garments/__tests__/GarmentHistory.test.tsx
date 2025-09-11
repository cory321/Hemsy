import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import GarmentHistory from '../GarmentHistory';
import { GarmentProvider } from '@/contexts/GarmentContext';
import { getGarmentHistory } from '@/lib/actions/garments';
import '@testing-library/jest-dom';

// Mock the garments actions
jest.mock('@/lib/actions/garments', () => ({
  getGarmentHistory: jest.fn(),
}));

// Mock the GarmentContext
jest.mock('@/contexts/GarmentContext', () => {
  const actualContext = jest.requireActual('@/contexts/GarmentContext');
  return {
    ...actualContext,
    useGarment: jest.fn(),
  };
});

import { useGarment } from '@/contexts/GarmentContext';

const mockGetGarmentHistory = getGarmentHistory as jest.MockedFunction<
  typeof getGarmentHistory
>;

const mockUseGarment = useGarment as jest.MockedFunction<typeof useGarment>;

const mockGarmentContextValue = {
  garment: {
    id: 'test-garment-id',
    name: 'Test Garment',
    due_date: '2024-01-15',
    event_date: null,
    preset_icon_key: null,
    preset_fill_color: null,
    preset_outline_color: null,
    notes: null,
    stage: 'In Progress',
    photo_url: null,
    image_cloud_id: null,
    created_at: '2024-01-01T00:00:00Z',
    order_id: 'test-order-id',
    garment_services: [],
    totalPriceCents: 0,
  },
  updateGarmentOptimistic: jest.fn(),
  updateGarmentIcon: jest.fn(),
  updateGarmentPhoto: jest.fn(),
  deleteGarmentPhoto: jest.fn(),
  addService: jest.fn(),
  removeService: jest.fn(),
  restoreService: jest.fn(),
  updateService: jest.fn(),
  toggleServiceComplete: jest.fn(),
  markAsPickedUp: jest.fn(),
  refreshGarment: jest.fn(),
  refreshHistory: jest.fn(),
  historyKey: 0,
  optimisticHistoryEntry: null,
  historyRefreshSignal: 0,
};

describe('GarmentHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock for useGarment
    mockUseGarment.mockReturnValue(mockGarmentContextValue);
  });

  it('renders loading state initially', () => {
    mockGetGarmentHistory.mockImplementation(() => new Promise(() => {}));

    render(<GarmentHistory garmentId="test-garment-id" />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders history entries after loading', async () => {
    const mockHistory = [
      {
        id: '1',
        garment_id: 'test-garment-id',
        changed_by: 'user-1',
        changed_at: new Date().toISOString(),
        field_name: 'name',
        old_value: 'Old Name',
        new_value: 'New Name',
        change_type: 'field_update',
        changed_by_user: {
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
        },
      },
    ];

    mockGetGarmentHistory.mockResolvedValue({
      success: true,
      history: mockHistory,
    } as any);

    render(<GarmentHistory garmentId="test-garment-id" />);

    await waitFor(() => {
      // Component now shows "HISTORY" when it has entries
      expect(screen.getByText('HISTORY')).toBeInTheDocument();
      expect(screen.getByText('Name changed')).toBeInTheDocument();
      expect(screen.getByText('"Old Name" → "New Name"')).toBeInTheDocument();
    });
  });

  it('shows optimistic updates immediately with loading indicator', async () => {
    mockGetGarmentHistory.mockResolvedValue({
      success: true,
      history: [],
    });

    const optimisticEntry = {
      id: 'optimistic-1',
      garment_id: 'test-garment-id',
      changed_by: 'current-user',
      changed_at: new Date().toISOString(),
      field_name: 'due_date',
      old_value: '2024-01-15',
      new_value: '2024-01-20',
      change_type: 'field_update',
      changed_by_user: {
        first_name: 'Current',
        last_name: 'User',
        email: 'user@example.com',
      },
      isOptimistic: true,
    };

    const { rerender } = render(<GarmentHistory garmentId="test-garment-id" />);

    await waitFor(() => {
      // Component shows "Change History" when empty
      expect(screen.getByText('Change History')).toBeInTheDocument();
    });

    // Update mock with optimistic entry
    mockUseGarment.mockReturnValue({
      ...mockGarmentContextValue,
      optimisticHistoryEntry: optimisticEntry,
    });

    rerender(<GarmentHistory garmentId="test-garment-id" />);

    // Should show the optimistic update immediately
    await waitFor(() => {
      expect(screen.getByText('Due date')).toBeInTheDocument();
      expect(screen.getByText('1/15/24 → 1/20/24')).toBeInTheDocument();
      // Check for loading spinner (CircularProgress)
      expect(screen.getAllByRole('progressbar')).toHaveLength(1);
    });
  });

  it('handles service addition optimistically', async () => {
    mockGetGarmentHistory.mockResolvedValue({
      success: true,
      history: [],
    });

    const optimisticServiceEntry = {
      id: 'optimistic-service-1',
      garment_id: 'test-garment-id',
      changed_by: 'current-user',
      changed_at: new Date().toISOString(),
      field_name: 'service',
      old_value: null,
      new_value: {
        name: 'Hemming',
        quantity: 2,
        unit_price_cents: 2500,
      },
      change_type: 'service_added',
      changed_by_user: {
        first_name: 'Current',
        last_name: 'User',
        email: 'user@example.com',
      },
      isOptimistic: true,
    };

    const { rerender } = render(<GarmentHistory garmentId="test-garment-id" />);

    await waitFor(() => {
      // Component shows "Change History" when empty
      expect(screen.getByText('Change History')).toBeInTheDocument();
    });

    // Update mock with optimistic service entry
    mockUseGarment.mockReturnValue({
      ...mockGarmentContextValue,
      optimisticHistoryEntry: optimisticServiceEntry,
    });

    rerender(<GarmentHistory garmentId="test-garment-id" />);

    // Should show the service addition immediately
    await waitFor(() => {
      expect(screen.getByText('Service added')).toBeInTheDocument();
      expect(screen.getByText('Hemming (2 @ $25.00)')).toBeInTheDocument();
    });
  });

  it('refreshes history when historyRefreshSignal changes', async () => {
    const initialHistory = [
      {
        id: '1',
        garment_id: 'test-garment-id',
        changed_by: 'user-1',
        changed_at: new Date().toISOString(),
        field_name: 'name',
        old_value: 'Initial Name',
        new_value: 'Updated Name',
        change_type: 'field_update',
        changed_by_user: {
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
        },
      },
    ];

    const updatedHistory = [
      ...initialHistory,
      {
        id: '2',
        garment_id: 'test-garment-id',
        changed_by: 'user-1',
        changed_at: new Date().toISOString(),
        field_name: 'stage',
        old_value: 'In Progress',
        new_value: 'Ready For Pickup',
        change_type: 'field_update',
        changed_by_user: {
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
        },
      },
    ];

    mockGetGarmentHistory
      .mockResolvedValueOnce({
        success: true,
        history: initialHistory,
      } as any)
      .mockResolvedValueOnce({
        success: true,
        history: updatedHistory,
      } as any);

    const { rerender } = render(<GarmentHistory garmentId="test-garment-id" />);

    await waitFor(() => {
      expect(screen.getByText('Name changed')).toBeInTheDocument();
    });

    // Trigger refresh by updating historyRefreshSignal
    mockUseGarment.mockReturnValue({
      ...mockGarmentContextValue,
      historyRefreshSignal: 1,
    });

    rerender(<GarmentHistory garmentId="test-garment-id" />);

    await waitFor(() => {
      expect(screen.getByText('Stage updated')).toBeInTheDocument();
      expect(
        screen.getByText('In Progress → Ready For Pickup')
      ).toBeInTheDocument();
    });

    expect(mockGetGarmentHistory).toHaveBeenCalledTimes(2);
  });

  it('handles error state gracefully', async () => {
    mockGetGarmentHistory.mockRejectedValue(new Error('Network error'));

    render(<GarmentHistory garmentId="test-garment-id" />);

    await waitFor(() => {
      expect(
        screen.getByText('An unexpected error occurred')
      ).toBeInTheDocument();
    });
  });

  it('groups history entries by date correctly', async () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const mockHistory = [
      {
        id: '1',
        garment_id: 'test-garment-id',
        changed_by: 'user-1',
        changed_at: today.toISOString(),
        field_name: 'name',
        old_value: 'Old Name',
        new_value: 'New Name',
        change_type: 'field_update',
        changed_by_user: {
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
        },
      },
      {
        id: '2',
        garment_id: 'test-garment-id',
        changed_by: 'user-1',
        changed_at: yesterday.toISOString(),
        field_name: 'stage',
        old_value: 'New',
        new_value: 'In Progress',
        change_type: 'field_update',
        changed_by_user: {
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane@example.com',
        },
      },
    ];

    mockGetGarmentHistory.mockResolvedValue({
      success: true,
      history: mockHistory,
    } as any);

    render(<GarmentHistory garmentId="test-garment-id" />);

    await waitFor(() => {
      expect(screen.getByText('Today')).toBeInTheDocument();
      expect(screen.getByText('Yesterday')).toBeInTheDocument();
    });
  });
});
