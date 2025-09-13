import { render, screen, waitFor } from '@testing-library/react';
import GarmentHistory from '../GarmentHistory';
import { getGarmentHistory } from '@/lib/actions/garments';
import { useGarment } from '@/contexts/GarmentContext';

// Mock the dependencies
jest.mock('@/lib/actions/garments');
jest.mock('@/contexts/GarmentContext');

const mockGetGarmentHistory = getGarmentHistory as jest.MockedFunction<
  typeof getGarmentHistory
>;
const mockUseGarment = useGarment as jest.MockedFunction<typeof useGarment>;

describe('GarmentHistory - Stage Transitions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGarment.mockReturnValue({
      garment: {} as any,
      optimisticHistoryEntry: null,
      historyRefreshSignal: 0,
    } as any);
  });

  it('displays "Garment started" when moving from New to In Progress', async () => {
    const mockHistory = [
      {
        id: '1',
        garment_id: 'test-garment',
        changed_by: 'user-1',
        changed_at: new Date().toISOString(),
        field_name: 'stage',
        old_value: 'New',
        new_value: 'In Progress',
        change_type: 'field_update',
        changed_by_user: { email: 'test@example.com' },
      },
    ];

    mockGetGarmentHistory.mockResolvedValue({
      success: true,
      history: mockHistory,
    } as any);

    render(<GarmentHistory garmentId="test-garment" />);

    await waitFor(() => {
      expect(screen.getByText('Garment started')).toBeInTheDocument();
      expect(screen.getByText('Moved to In Progress')).toBeInTheDocument();
    });
  });

  it('displays "Garment completed" when moving to Ready For Pickup', async () => {
    const mockHistory = [
      {
        id: '2',
        garment_id: 'test-garment',
        changed_by: 'user-1',
        changed_at: new Date().toISOString(),
        field_name: 'stage',
        old_value: 'In Progress',
        new_value: 'Ready For Pickup',
        change_type: 'field_update',
        changed_by_user: { email: 'test@example.com' },
      },
    ];

    mockGetGarmentHistory.mockResolvedValue({
      success: true,
      history: mockHistory,
    } as any);

    render(<GarmentHistory garmentId="test-garment" />);

    await waitFor(() => {
      expect(screen.getByText('Garment completed')).toBeInTheDocument();
      expect(screen.getByText('Ready for pickup')).toBeInTheDocument();
    });
  });

  it('displays "Garment picked up" when moving to Done', async () => {
    const mockHistory = [
      {
        id: '3',
        garment_id: 'test-garment',
        changed_by: 'user-1',
        changed_at: new Date().toISOString(),
        field_name: 'stage',
        old_value: 'Ready For Pickup',
        new_value: 'Done',
        change_type: 'field_update',
        changed_by_user: { email: 'test@example.com' },
      },
    ];

    mockGetGarmentHistory.mockResolvedValue({
      success: true,
      history: mockHistory,
    } as any);

    render(<GarmentHistory garmentId="test-garment" />);

    await waitFor(() => {
      expect(screen.getByText('Garment picked up')).toBeInTheDocument();
      expect(screen.getByText('Marked as done')).toBeInTheDocument();
    });
  });

  it('displays generic message for non-standard transitions', async () => {
    const mockHistory = [
      {
        id: '4',
        garment_id: 'test-garment',
        changed_by: 'user-1',
        changed_at: new Date().toISOString(),
        field_name: 'stage',
        old_value: 'Ready For Pickup',
        new_value: 'In Progress',
        change_type: 'field_update',
        changed_by_user: { email: 'test@example.com' },
      },
    ];

    mockGetGarmentHistory.mockResolvedValue({
      success: true,
      history: mockHistory,
    } as any);

    render(<GarmentHistory garmentId="test-garment" />);

    await waitFor(() => {
      expect(screen.getByText('Moved to In Progress')).toBeInTheDocument();
      expect(screen.getByText('From Ready For Pickup')).toBeInTheDocument();
    });
  });
});
