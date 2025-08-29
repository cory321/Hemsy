import { render, screen, waitFor } from '@testing-library/react';
import { Dashboard } from '@/components/Dashboard';
import {
  getTodayAppointmentsDetailed,
  getNextAppointment,
} from '@/lib/actions/dashboard';
import type { Appointment } from '@/types';

// Mock the server actions
jest.mock('@/lib/actions/dashboard', () => ({
  getTodayAppointmentsDetailed: jest.fn(),
  getNextAppointment: jest.fn(),
}));

// Mock the child components
jest.mock('@/components/dashboard/DashboardHeader', () => ({
  DashboardHeader: () => (
    <div data-testid="dashboard-header">Dashboard Header</div>
  ),
}));

jest.mock('@/components/dashboard/alerts', () => ({
  DashboardAlerts: () => (
    <div data-testid="dashboard-alerts">Dashboard Alerts</div>
  ),
}));

jest.mock('@/components/dashboard/business-overview', () => ({
  BusinessOverview: () => (
    <div data-testid="business-overview">Business Overview</div>
  ),
}));

jest.mock('@/components/dashboard/garment-pipeline', () => ({
  GarmentPipeline: () => (
    <div data-testid="garment-pipeline">Garment Pipeline</div>
  ),
}));

jest.mock('@/components/dashboard/todays-focus', () => ({
  AppointmentsFocus: ({
    nextAppointment,
    todayAppointments,
  }: {
    nextAppointment: Appointment | null;
    todayAppointments: Appointment[];
  }) => (
    <div data-testid="appointments-focus">
      <div data-testid="next-appointment">
        {nextAppointment
          ? `Next: ${nextAppointment.id}`
          : 'No next appointment'}
      </div>
      <div data-testid="today-appointments">
        Today appointments: {todayAppointments.length}
      </div>
    </div>
  ),
}));

const mockGetTodayAppointmentsDetailed =
  getTodayAppointmentsDetailed as jest.MockedFunction<
    typeof getTodayAppointmentsDetailed
  >;
const mockGetNextAppointment = getNextAppointment as jest.MockedFunction<
  typeof getNextAppointment
>;

describe('Dashboard', () => {
  const mockNextAppointment: Appointment = {
    id: 'apt-next',
    shop_id: 'shop-1',
    client_id: 'client-1',
    order_id: null,
    date: '2024-01-15',
    start_time: '10:30:00',
    end_time: '11:00:00',
    type: 'consultation',
    status: 'confirmed',
    notes: null,
    reminder_sent: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    client: {
      id: 'client-1',
      shop_id: 'shop-1',
      first_name: 'Sarah',
      last_name: 'Johnson',
      email: 'sarah@example.com',
      phone_number: '+1234567890',
      accept_email: true,
      accept_sms: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  };

  const mockTodayAppointments: Appointment[] = [
    mockNextAppointment,
    {
      id: 'apt-today-2',
      shop_id: 'shop-1',
      client_id: 'client-2',
      order_id: null,
      date: '2024-01-15',
      start_time: '14:00:00',
      end_time: '15:00:00',
      type: 'fitting',
      status: 'pending',
      notes: null,
      reminder_sent: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      client: {
        id: 'client-2',
        shop_id: 'shop-1',
        first_name: 'Michael',
        last_name: 'Brown',
        email: 'michael@example.com',
        phone_number: '+1987654321',
        accept_email: true,
        accept_sms: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetNextAppointment.mockResolvedValue(mockNextAppointment);
    mockGetTodayAppointmentsDetailed.mockResolvedValue(mockTodayAppointments);
  });

  it('renders all dashboard sections', async () => {
    render(<Dashboard />);

    // Check that all main sections are rendered
    expect(screen.getByTestId('dashboard-header')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-alerts')).toBeInTheDocument();
    expect(screen.getByTestId('business-overview')).toBeInTheDocument();
    expect(screen.getByTestId('garment-pipeline')).toBeInTheDocument();
    expect(screen.getByTestId('appointments-focus')).toBeInTheDocument();
  });

  it('fetches and passes appointment data to AppointmentsFocus', async () => {
    render(<Dashboard />);

    // Wait for the data to be fetched and passed to AppointmentsFocus
    await waitFor(() => {
      expect(screen.getByText('Next: apt-next')).toBeInTheDocument();
      expect(screen.getByText('Today appointments: 2')).toBeInTheDocument();
    });

    // Verify the server actions were called
    expect(mockGetNextAppointment).toHaveBeenCalledTimes(1);
    expect(mockGetTodayAppointmentsDetailed).toHaveBeenCalledTimes(1);
  });

  it('handles null next appointment', async () => {
    mockGetNextAppointment.mockResolvedValue(null);

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('No next appointment')).toBeInTheDocument();
    });
  });

  it('handles empty today appointments', async () => {
    mockGetTodayAppointmentsDetailed.mockResolvedValue([]);

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Today appointments: 0')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    mockGetNextAppointment.mockRejectedValue(new Error('API Error'));
    mockGetTodayAppointmentsDetailed.mockRejectedValue(new Error('API Error'));

    render(<Dashboard />);

    // Wait for error handling
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to fetch appointment data:',
        expect.any(Error)
      );
    });

    // Should still render with default empty state
    await waitFor(() => {
      expect(screen.getByText('No next appointment')).toBeInTheDocument();
      expect(screen.getByText('Today appointments: 0')).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it('handles partial API failures', async () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    mockGetNextAppointment.mockResolvedValue(mockNextAppointment);
    mockGetTodayAppointmentsDetailed.mockRejectedValue(
      new Error('Today appointments API Error')
    );

    render(<Dashboard />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to fetch appointment data:',
        expect.any(Error)
      );
    });

    // Should render with partial data
    await waitFor(() => {
      expect(screen.getByText('No next appointment')).toBeInTheDocument(); // Reset due to error
      expect(screen.getByText('Today appointments: 0')).toBeInTheDocument(); // Reset due to error
    });

    consoleSpy.mockRestore();
  });

  it('applies correct styling and layout', () => {
    render(<Dashboard />);

    const mainBox = screen.getByTestId('dashboard-header').closest('div');
    expect(mainBox).toHaveStyle({
      'background-color': '#FFFEFC',
      'min-height': '100vh',
      padding: '24px',
    });
  });

  it('uses Grid layout for responsive design', () => {
    render(<Dashboard />);

    // The Grid components should be present (though exact testing of Grid layout
    // depends on the specific Grid implementation)
    expect(screen.getByTestId('business-overview')).toBeInTheDocument();
    expect(screen.getByTestId('garment-pipeline')).toBeInTheDocument();
    expect(screen.getByTestId('appointments-focus')).toBeInTheDocument();
  });

  describe('Loading state', () => {
    it('shows initial state while loading', () => {
      // Mock slow API calls
      mockGetNextAppointment.mockImplementation(() => new Promise(() => {})); // Never resolves
      mockGetTodayAppointmentsDetailed.mockImplementation(
        () => new Promise(() => {})
      ); // Never resolves

      render(<Dashboard />);

      // Should show initial empty state while loading
      expect(screen.getByText('No next appointment')).toBeInTheDocument();
      expect(screen.getByText('Today appointments: 0')).toBeInTheDocument();
    });
  });

  describe('Data refresh', () => {
    it('fetches data on mount', () => {
      render(<Dashboard />);

      expect(mockGetNextAppointment).toHaveBeenCalledTimes(1);
      expect(mockGetTodayAppointmentsDetailed).toHaveBeenCalledTimes(1);
    });

    it('does not refetch data on re-render with same props', () => {
      const { rerender } = render(<Dashboard />);

      expect(mockGetNextAppointment).toHaveBeenCalledTimes(1);
      expect(mockGetTodayAppointmentsDetailed).toHaveBeenCalledTimes(1);

      rerender(<Dashboard />);

      // Should still only be called once (useEffect dependency array is empty)
      expect(mockGetNextAppointment).toHaveBeenCalledTimes(1);
      expect(mockGetTodayAppointmentsDetailed).toHaveBeenCalledTimes(1);
    });
  });
});
