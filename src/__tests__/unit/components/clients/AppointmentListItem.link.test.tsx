import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppointmentListItem } from '@/components/clients/AppointmentListItem';

jest.mock('next/link', () => {
  const MockLink = ({ href, children, ...props }: any) => (
    <a href={href as string} {...props}>
      {children}
    </a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

describe('AppointmentListItem link', () => {
  const baseAppointment = {
    id: 'apt-123',
    shop_id: 'shop-1',
    client_id: 'client-1',
    date: '2025-01-20',
    start_time: '10:00',
    end_time: '10:30',
    type: 'fitting' as const,
    status: 'confirmed' as const,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  };

  it('renders a link to day view with date and focus id', async () => {
    render(<AppointmentListItem appointment={baseAppointment as any} />);

    const link = screen.getByText(/at 10:00 - 10:30/i).closest('a');
    expect(link).toBeTruthy();
    expect(link?.getAttribute('href')).toBe(
      `/appointments?view=day&date=${baseAppointment.date}&focus=${baseAppointment.id}`
    );

    // ensure clicking the link text would not toggle expansion (stopPropagation)
    await userEvent.click(link as Element);
  });
});
