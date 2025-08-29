import { render, screen } from '@testing-library/react';
import { ClientStatsCards } from '@/components/clients/ClientProfileCard';
import type { Tables } from '@/types/supabase';
import type { Appointment } from '@/types';

describe('ClientStatsCards', () => {
  const mockClient: Tables<'clients'> = {
    id: 'client_123',
    shop_id: 'shop_123',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    phone_number: '1234567890',
    accept_email: true,
    accept_sms: false,
    mailing_address: null,
    notes: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  it('should display formatted next appointment when one exists', () => {
    const mockAppointment: Appointment = {
      id: 'appt_123',
      shop_id: 'shop_123',
      client_id: mockClient.id,
      date: '2024-12-20',
      start_time: '14:30',
      end_time: '15:30',
      type: 'fitting',
      status: 'confirmed',
      notes: 'Test appointment',
      reminder_sent: false,
      created_at: '2024-12-10T10:00:00Z',
      updated_at: '2024-12-10T10:00:00Z',
    };

    render(
      <ClientStatsCards
        client={mockClient}
        nextAppointment={mockAppointment}
        readyForPickupCount={3}
      />
    );

    // Check that the next appointment is displayed with correct format
    expect(screen.getByText('Next Appointment')).toBeInTheDocument();
    expect(screen.getByText(/Fri, Dec 20 • 2:30 PM/)).toBeInTheDocument();
  });

  it('should display "None scheduled" when no upcoming appointment exists', () => {
    render(
      <ClientStatsCards
        client={mockClient}
        nextAppointment={null}
        readyForPickupCount={0}
      />
    );

    // Check that "None scheduled" is displayed
    expect(screen.getByText('Next Appointment')).toBeInTheDocument();
    expect(screen.getByText('None scheduled')).toBeInTheDocument();
  });

  it('should display other static stats correctly', () => {
    render(
      <ClientStatsCards
        client={mockClient}
        nextAppointment={null}
        readyForPickupCount={2}
      />
    );

    // Check static stats are displayed
    expect(screen.getByText('Active Orders')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();

    expect(screen.getByText('Outstanding')).toBeInTheDocument();
    expect(screen.getByText('$125.00')).toBeInTheDocument();

    expect(screen.getByText('Ready For Pickup')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should display real ready for pickup count', () => {
    const readyForPickupCount = 7;
    render(
      <ClientStatsCards
        client={mockClient}
        nextAppointment={null}
        readyForPickupCount={readyForPickupCount}
      />
    );

    expect(screen.getByText('Ready For Pickup')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('should display 0 when no garments are ready for pickup', () => {
    render(
      <ClientStatsCards
        client={mockClient}
        nextAppointment={null}
        readyForPickupCount={0}
      />
    );

    expect(screen.getByText('Ready For Pickup')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
