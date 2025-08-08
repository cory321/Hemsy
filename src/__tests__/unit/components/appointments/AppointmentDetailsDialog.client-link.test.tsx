import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppointmentProvider } from '@/providers/AppointmentProvider';
import userEvent from '@testing-library/user-event';
import { AppointmentDetailsDialog } from '@/components/appointments/AppointmentDetailsDialog';
import type { Appointment } from '@/types';

// Mock next/navigation (used in component but not required for this test)
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}));

// Mock next/link to render as <a>
jest.mock('next/link', () => {
  const MockLink = ({ href, children, ...props }: any) => (
    <a href={href as string} {...props}>
      {children}
    </a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

describe('AppointmentDetailsDialog - Client link', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <AppointmentProvider shopId="shop123">{children}</AppointmentProvider>
    </QueryClientProvider>
  );

  const mockAppointment: Appointment = {
    id: 'apt-1',
    shop_id: 'shop123',
    client_id: 'client-999',
    date: '2025-01-20',
    start_time: '10:00',
    end_time: '10:30',
    type: 'fitting',
    status: 'confirmed',
    notes: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    client: {
      id: 'client-999',
      shop_id: 'shop123',
      first_name: 'Ada',
      last_name: 'Lovelace',
      email: 'ada@example.com',
      phone_number: '5551234567',
      accept_email: true,
      accept_sms: false,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    },
  };

  it('renders client name as a link to the client profile', async () => {
    render(
      <AppointmentDetailsDialog
        open={true}
        onClose={jest.fn()}
        appointment={mockAppointment}
        onEdit={jest.fn()}
      />,
      { wrapper: Wrapper }
    );

    const link = screen
      .getByText('Ada Lovelace')
      .closest('a') as HTMLAnchorElement;
    expect(link).toBeTruthy();
    expect(link.getAttribute('href')).toBe(
      `/clients/${mockAppointment.client!.id}`
    );

    // Click for good measure (no navigation occurs in test env)
    await userEvent.click(link);
  });

  it('shows fallback text when no client selected', () => {
    const noClientAppointment = {
      ...mockAppointment,
      client: undefined,
    } as Appointment;

    render(
      <AppointmentDetailsDialog
        open={true}
        onClose={jest.fn()}
        appointment={noClientAppointment}
        onEdit={jest.fn()}
      />,
      { wrapper: Wrapper }
    );

    expect(screen.getByText('No Client Selected')).toBeInTheDocument();
  });
});
