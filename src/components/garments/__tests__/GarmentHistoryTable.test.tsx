import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import GarmentHistoryTable from '../GarmentHistoryTable';
import { getGarmentHistory } from '@/lib/actions/garments';
import { useGarment } from '@/contexts/GarmentContext';

// Mock the dependencies
jest.mock('@/lib/actions/garments');
jest.mock('@/contexts/GarmentContext');

const mockGetGarmentHistory = getGarmentHistory as jest.MockedFunction<
  typeof getGarmentHistory
>;
const mockUseGarment = useGarment as jest.MockedFunction<typeof useGarment>;

const mockGarmentContextValue = {
  garment: {} as any,
  optimisticHistoryEntry: null,
  historyRefreshSignal: 0,
} as any;

describe('GarmentHistoryTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGarment.mockReturnValue(mockGarmentContextValue);
  });

  it('renders loading state initially', () => {
    mockGetGarmentHistory.mockImplementation(() => new Promise(() => {}));

    render(<GarmentHistoryTable garmentId="test-garment-id" />);

    // Component uses Skeleton components for loading state
    expect(screen.queryByText('Change History')).not.toBeInTheDocument();
    // Check for skeleton elements by class
    const skeletons = document.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons).toHaveLength(2);
  });

  it('renders table with history entries', async () => {
    const mockHistory = [
      {
        id: '1',
        garment_id: 'test-garment-id',
        changed_by: 'user-1',
        changed_at: new Date().toISOString(),
        field_name: 'stage',
        old_value: 'New',
        new_value: 'In Progress',
        change_type: 'field_update',
        changed_by_user: null,
      },
      {
        id: '2',
        garment_id: 'test-garment-id',
        changed_by: 'user-1',
        changed_at: new Date().toISOString(),
        field_name: 'services',
        old_value: null,
        new_value: { name: 'Hemming' },
        change_type: 'service_added',
        changed_by_user: null,
      },
    ];

    mockGetGarmentHistory.mockResolvedValue({
      success: true,
      history: mockHistory,
    } as any);

    render(<GarmentHistoryTable garmentId="test-garment-id" />);

    await waitFor(() => {
      expect(screen.getByText('Change History')).toBeInTheDocument();
      expect(screen.getByText('2 changes')).toBeInTheDocument();
      expect(screen.getByText('Garment started')).toBeInTheDocument();
      expect(screen.getByText('Service added')).toBeInTheDocument();
    });
  });

  it('filters history by type', async () => {
    const mockHistory = [
      {
        id: '1',
        garment_id: 'test-garment-id',
        changed_by: 'user-1',
        changed_at: new Date().toISOString(),
        field_name: 'stage',
        old_value: 'New',
        new_value: 'In Progress',
        change_type: 'field_update',
        changed_by_user: null,
      },
      {
        id: '2',
        garment_id: 'test-garment-id',
        changed_by: 'user-1',
        changed_at: new Date().toISOString(),
        field_name: 'services',
        old_value: null,
        new_value: { name: 'Hemming' },
        change_type: 'service_added',
        changed_by_user: null,
      },
    ];

    mockGetGarmentHistory.mockResolvedValue({
      success: true,
      history: mockHistory,
    } as any);

    render(<GarmentHistoryTable garmentId="test-garment-id" />);

    await waitFor(() => {
      expect(screen.getByText('2 changes')).toBeInTheDocument();
    });

    // Filter to stage changes only - get the filter dropdown by text content
    const filterSelect = screen.getByText('All Changes');
    fireEvent.mouseDown(filterSelect);
    fireEvent.click(screen.getByText('Stage Changes'));

    await waitFor(() => {
      expect(screen.getByText('1 of 2 change')).toBeInTheDocument();
      expect(screen.getByText('Garment started')).toBeInTheDocument();
      expect(screen.queryByText('Service added')).not.toBeInTheDocument();
    });
  });

  it('handles pagination correctly', async () => {
    const mockHistory = Array.from({ length: 15 }, (_, i) => ({
      id: `${i + 1}`,
      garment_id: 'test-garment-id',
      changed_by: 'user-1',
      changed_at: new Date().toISOString(),
      field_name: 'name',
      old_value: `Old Name ${i}`,
      new_value: `New Name ${i}`,
      change_type: 'field_update',
      changed_by_user: null,
    }));

    mockGetGarmentHistory.mockResolvedValue({
      success: true,
      history: mockHistory,
    } as any);

    render(<GarmentHistoryTable garmentId="test-garment-id" />);

    await waitFor(() => {
      expect(screen.getByText('15 changes')).toBeInTheDocument();
      // Default rows per page is 10
      expect(screen.getAllByText(/Name updated/)).toHaveLength(10);
    });

    // Go to second page
    const nextPageButton = screen.getByTitle('Go to next page');
    fireEvent.click(nextPageButton);

    await waitFor(() => {
      // Should show remaining 5 entries
      expect(screen.getAllByText(/Name updated/)).toHaveLength(5);
    });
  });

  it('shows empty state when no history', async () => {
    mockGetGarmentHistory.mockResolvedValue({
      success: true,
      history: [],
    } as any);

    render(<GarmentHistoryTable garmentId="test-garment-id" />);

    await waitFor(() => {
      expect(screen.getByText('No changes recorded yet')).toBeInTheDocument();
    });
  });

  it('handles refresh action', async () => {
    const mockHistory = [
      {
        id: '1',
        garment_id: 'test-garment-id',
        changed_by: 'user-1',
        changed_at: new Date().toISOString(),
        field_name: 'stage',
        old_value: 'New',
        new_value: 'In Progress',
        change_type: 'field_update',
        changed_by_user: null,
      },
    ];

    mockGetGarmentHistory.mockResolvedValue({
      success: true,
      history: mockHistory,
    } as any);

    render(<GarmentHistoryTable garmentId="test-garment-id" />);

    await waitFor(() => {
      expect(screen.getByText('Garment started')).toBeInTheDocument();
    });

    // Clear the mock to track new calls
    mockGetGarmentHistory.mockClear();

    // Click refresh button
    const refreshButton = screen.getByLabelText('Refresh history');
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(mockGetGarmentHistory).toHaveBeenCalledWith('test-garment-id');
    });
  });
});
