import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DayView } from '@/components/appointments/views/DayView';

// Mock timezone action used by useUserTimezone
jest.mock('@/lib/actions/user-timezone', () => ({
  getCurrentUserTimezone: jest.fn(async () => 'UTC'),
}));

describe('DayView focusAppointmentId', () => {
  const appointments = [
    {
      id: 'apt-1',
      shop_id: 'shop-1',
      client_id: 'client-1',
      date: '2025-01-20',
      start_time: '09:00',
      end_time: '09:30',
      type: 'fitting' as const,
      status: 'confirmed' as const,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    },
    {
      id: 'apt-2',
      shop_id: 'shop-1',
      client_id: 'client-1',
      date: '2025-01-20',
      start_time: '10:00',
      end_time: '10:30',
      type: 'consultation' as const,
      status: 'pending' as const,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    },
  ];

  const shopHours = [
    {
      day_of_week: 1,
      open_time: '08:00',
      close_time: '18:00',
      is_closed: false,
    },
  ];

  it('marks the focused appointment with data-focused', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <DayView
          currentDate={new Date(2025, 0, 20)}
          appointments={appointments as any}
          shopHours={shopHours}
          focusAppointmentId="apt-2"
        />
      </QueryClientProvider>
    );

    const focused = await screen.findByTestId('dayview-appointment-apt-2');
    expect(focused).toHaveAttribute('data-focused', 'true');
  });
});
