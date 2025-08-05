import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CalendarWithQuery } from '@/components/appointments/CalendarWithQuery';
import * as appointmentQueries from '@/lib/queries/appointment-queries';
import { ThemeProvider } from '@/components/providers/ThemeProvider';

// Mock the appointment queries module
jest.mock('@/lib/queries/appointment-queries');

const mockAppointmentQueries = appointmentQueries as jest.Mocked<
  typeof appointmentQueries
>;

describe('CalendarWithQuery - Rapid Navigation Protection', () => {
  let queryClient: QueryClient;

  const mockShopHours = [
    {
      day_of_week: 1,
      open_time: '09:00',
      close_time: '17:00',
      is_closed: false,
    },
  ];

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
      },
    });

    // Mock the query hooks
    mockAppointmentQueries.useAppointmentsTimeRange.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isFetching: false,
    } as any);

    mockAppointmentQueries.usePrefetchAdjacentWindows.mockImplementation(
      () => {}
    );

    mockAppointmentQueries.calculateDateRange.mockImplementation(
      (date, view) => ({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      })
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderCalendar = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <CalendarWithQuery
            shopId="test-shop-id"
            shopHours={mockShopHours}
            initialDate={new Date('2024-01-15')}
          />
        </ThemeProvider>
      </QueryClientProvider>
    );
  };

  it('should disable navigation buttons while data is being fetched', async () => {
    // Start with loading state
    mockAppointmentQueries.useAppointmentsTimeRange.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isFetching: true, // Data is being fetched
    } as any);

    renderCalendar();

    // Wait for the calendar to render
    await waitFor(() => {
      expect(screen.getByText('January 2024')).toBeInTheDocument();
    });

    // Get navigation buttons
    const prevButton = screen.getAllByRole('button')[0]; // First button should be previous
    const nextButton = screen.getAllByRole('button')[2]; // Third button should be next

    // Check that navigation buttons are disabled during fetch
    expect(prevButton).toBeDisabled();
    expect(nextButton).toBeDisabled();
  });

  it('should enable navigation buttons when data fetching is complete', async () => {
    // Start with data loaded
    mockAppointmentQueries.useAppointmentsTimeRange.mockReturnValue({
      data: [
        {
          id: '1',
          shop_id: 'test-shop-id',
          client_id: 'client-1',
          date: '2024-01-15',
          start_time: '10:00',
          end_time: '11:00',
          type: 'appointment',
          status: 'confirmed',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ],
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isFetching: false, // Not fetching
    } as any);

    renderCalendar();

    // Wait for the calendar to render
    await waitFor(() => {
      expect(screen.getByText('January 2024')).toBeInTheDocument();
    });

    // Get navigation buttons
    const prevButton = screen.getAllByRole('button')[0];
    const nextButton = screen.getAllByRole('button')[2];

    // Check that navigation buttons are enabled
    expect(prevButton).not.toBeDisabled();
    expect(nextButton).not.toBeDisabled();
  });

  it('should show loading indicator but keep calendar visible during navigation', async () => {
    // Initial render with data
    const { rerender } = renderCalendar();

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText('January 2024')).toBeInTheDocument();
    });

    // Simulate fetching state (would happen when clicking next/prev)
    mockAppointmentQueries.useAppointmentsTimeRange.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isFetching: true,
    } as any);

    // Force re-render to simulate state change
    rerender(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <CalendarWithQuery
            shopId="test-shop-id"
            shopHours={mockShopHours}
            initialDate={new Date('2024-01-15')}
          />
        </ThemeProvider>
      </QueryClientProvider>
    );

    // Calendar should still be visible (not showing skeleton)
    expect(screen.getByText('January 2024')).toBeInTheDocument();

    // Loading indicator should be present
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
  });

  it('should prevent rapid navigation clicks', async () => {
    const refetchMock = jest.fn();

    // Start with enabled state
    mockAppointmentQueries.useAppointmentsTimeRange.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: refetchMock,
      isFetching: false,
    } as any);

    renderCalendar();

    await waitFor(() => {
      expect(screen.getByText('January 2024')).toBeInTheDocument();
    });

    const nextButton = screen.getAllByRole('button')[2];

    // First click should work
    fireEvent.click(nextButton);

    // Now simulate that we're fetching
    mockAppointmentQueries.useAppointmentsTimeRange.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: refetchMock,
      isFetching: true,
    } as any);

    // Try to click again rapidly - button should be disabled
    expect(nextButton).toBeDisabled();

    // Even if user tries to click, nothing should happen
    fireEvent.click(nextButton);
    fireEvent.click(nextButton);

    // The rapid clicks shouldn't cause additional issues
  });
});
