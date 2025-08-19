import React from 'react';
import { render, screen } from '@testing-library/react';
import { notFound } from 'next/navigation';
import ClientDetailPage from './page';
import { getClient } from '@/lib/actions/clients';
import type { Tables } from '@/types/supabase';

// Mock dependencies
jest.mock('next/navigation', () => ({
  notFound: jest.fn(),
}));

jest.mock('@/lib/actions/clients', () => ({
  getClient: jest.fn(),
}));

jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn().mockReturnValue(Promise.resolve({ userId: 'clerk-user-1' })),
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockReturnValue(
    Promise.resolve({
      from(table: string) {
        const api = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null }),
        } as any;
        if (table === 'users') {
          api.single = jest.fn().mockResolvedValue({ data: { id: 'user-1' } });
        }
        if (table === 'shops') {
          api.single = jest.fn().mockResolvedValue({ data: { id: 'shop-1' } });
        }
        return api;
      },
    })
  ),
}));

jest.mock('@/lib/actions/shop-hours', () => ({
  getShopHours: jest.fn().mockResolvedValue([
    {
      day_of_week: 1,
      open_time: '09:00',
      close_time: '17:00',
      is_closed: false,
    },
  ]),
}));

jest.mock('@/lib/actions/calendar-settings', () => ({
  getCalendarSettings: jest.fn().mockResolvedValue({
    buffer_time_minutes: 0,
    default_appointment_duration: 30,
  }),
}));

jest.mock('@/components/clients/ClientEditDialog', () => {
  return function MockClientEditDialog({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return <div data-testid="edit-dialog">{children}</div>;
  };
});

jest.mock('@/components/clients/ClientDeleteDialog', () => {
  return function MockClientDeleteDialog({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return <div data-testid="delete-dialog">{children}</div>;
  };
});

jest.mock('@/components/clients/ClientAppointmentsSection', () => {
  return function MockClientAppointmentsSection() {
    return <div data-testid="appointments-section" />;
  };
});

jest.mock('@/components/clients/ClientOrdersSection', () => {
  return function MockClientOrdersSection() {
    return <div data-testid="orders-section" />;
  };
});

describe('ClientDetailPage', () => {
  const mockGetClient = getClient as jest.MockedFunction<typeof getClient>;
  const mockNotFound = notFound as jest.MockedFunction<typeof notFound>;

  const mockClient: Tables<'clients'> = {
    id: 'client1',
    shop_id: 'shop1',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    phone_number: '5551234567',
    accept_email: true,
    accept_sms: false,
    notes: 'Regular customer with specific preferences',
    mailing_address: '123 Main St\nAnytown, ST 12345',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders client details when client exists', async () => {
    mockGetClient.mockResolvedValueOnce(mockClient);

    const params = Promise.resolve({ id: 'client1' });
    const Component = await ClientDetailPage({ params });
    render(Component);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    // Phone now rendered within the profile card
    expect(screen.getByText('(555) 123-4567')).toBeInTheDocument();
    expect(
      screen.getByText('Regular customer with specific preferences')
    ).toBeInTheDocument();
    // Check that the address text exists (it may be split across nodes due to pre-line)
    expect(screen.getByText(/123 Main St/)).toBeInTheDocument();
    expect(screen.getByText(/Anytown, ST 12345/)).toBeInTheDocument();
  });

  it('displays communication preferences correctly', async () => {
    mockGetClient.mockResolvedValueOnce(mockClient);

    const params = Promise.resolve({ id: 'client1' });
    const Component = await ClientDetailPage({ params });
    render(Component);

    // Find the Communication Preferences section
    const preferencesSection = screen
      .getByText('Communication Preferences')
      .closest('.MuiCard-root');
    expect(preferencesSection).toBeInTheDocument();

    // Within the preferences section, find the chips
    // Use getAllByText but scope it to chip labels only
    const emailChips = screen.getAllByText('Email');
    const smsChip = screen.getByText('SMS');

    // Find the chip that's actually in the preferences section (not the contact info section)
    const emailChipInPreferences = emailChips.find(
      (element) =>
        element.closest('.MuiChip-root') &&
        element
          .closest('.MuiCard-root')
          ?.textContent?.includes('Communication Preferences')
    );

    expect(emailChipInPreferences?.closest('.MuiChip-root')).toHaveClass(
      'MuiChip-colorSuccess'
    );
    expect(smsChip.closest('.MuiChip-root')).toHaveClass(
      'MuiChip-colorDefault'
    );
  });

  it('formats phone number correctly', async () => {
    mockGetClient.mockResolvedValueOnce(mockClient);

    const params = Promise.resolve({ id: 'client1' });
    const Component = await ClientDetailPage({ params });
    render(Component);

    expect(screen.getByText('(555) 123-4567')).toBeInTheDocument();
  });

  it('formats dates correctly', async () => {
    mockGetClient.mockResolvedValueOnce(mockClient);

    const params = Promise.resolve({ id: 'client1' });
    const Component = await ClientDetailPage({ params });
    render(Component);

    // Find the Record Information section
    const recordSection = screen
      .getByText('Record Information')
      .closest('.MuiCard-root');
    expect(recordSection).toBeInTheDocument();

    // The dates should be formatted correctly
    // Note: Dates might be off by one day due to timezone conversion
    // The date '2024-01-01T00:00:00Z' might show as Dec 31, 2023 in some timezones
    expect(recordSection?.textContent).toMatch(
      /December 31, 2023|January 1, 2024/
    );
    expect(recordSection?.textContent).toMatch(
      /January 14, 2024|January 15, 2024/
    );
  });

  it('renders edit and delete action buttons', async () => {
    mockGetClient.mockResolvedValueOnce(mockClient);

    const params = Promise.resolve({ id: 'client1' });
    const Component = await ClientDetailPage({ params });
    render(Component);

    // There are two edit triggers (header pencil and card button)
    expect(screen.getAllByTestId('edit-dialog').length).toBeGreaterThanOrEqual(
      1
    );
    expect(screen.getByTestId('delete-dialog')).toBeInTheDocument();
  });

  it('handles client with minimal data', async () => {
    const minimalClient: Tables<'clients'> = {
      id: 'client2',
      shop_id: 'shop1',
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane@example.com',
      phone_number: '5559876543',
      accept_email: false,
      accept_sms: true,
      notes: null,
      mailing_address: null,
      created_at: '2024-02-01T00:00:00Z',
      updated_at: '2024-02-01T00:00:00Z',
    };

    mockGetClient.mockResolvedValueOnce(minimalClient);

    const params = Promise.resolve({ id: 'client2' });
    const Component = await ClientDetailPage({ params });
    render(Component);

    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('(555) 987-6543')).toBeInTheDocument();

    // Should not render notes or mailing address sections
    expect(screen.queryByText('Notes')).not.toBeInTheDocument();
    expect(screen.queryByText('Mailing Address')).not.toBeInTheDocument();

    // Email should be default, SMS should be success
    const emailChips = screen.getAllByText('Email');
    const smsChip = screen.getByText('SMS');

    // Find the chip that's in the preferences section
    const emailChipInPreferences = emailChips.find(
      (element) =>
        element.closest('.MuiChip-root') &&
        element
          .closest('.MuiCard-root')
          ?.textContent?.includes('Communication Preferences')
    );

    expect(emailChipInPreferences?.closest('.MuiChip-root')).toHaveClass(
      'MuiChip-colorDefault'
    );
    expect(smsChip.closest('.MuiChip-root')).toHaveClass(
      'MuiChip-colorSuccess'
    );
  });

  it('calls notFound when client does not exist', async () => {
    mockGetClient.mockResolvedValueOnce(null);

    const params = Promise.resolve({ id: 'nonexistent' });

    await ClientDetailPage({ params });

    expect(mockNotFound).toHaveBeenCalled();
  });

  it('calls notFound when getClient throws an error', async () => {
    mockGetClient.mockRejectedValueOnce(new Error('Client not found'));

    const params = Promise.resolve({ id: 'error-client' });

    await ClientDetailPage({ params });

    expect(mockNotFound).toHaveBeenCalled();
  });

  it('calls getClient with correct ID', async () => {
    mockGetClient.mockResolvedValueOnce(mockClient);

    const params = Promise.resolve({ id: 'test-client-id' });
    const Component = await ClientDetailPage({ params });
    render(Component);

    expect(mockGetClient).toHaveBeenCalledWith('test-client-id');
  });

  it('displays all information sections when data is present', async () => {
    mockGetClient.mockResolvedValueOnce(mockClient);

    const params = Promise.resolve({ id: 'client1' });
    const Component = await ClientDetailPage({ params });
    render(Component);

    // Contact heading moved into the profile card
    expect(screen.getByText('Contact Information')).toBeInTheDocument();
    expect(screen.getByText('Communication Preferences')).toBeInTheDocument();
    expect(screen.getByText('Mailing Address')).toBeInTheDocument();
    expect(screen.getByText('Notes')).toBeInTheDocument();
    expect(screen.getByText('Record Information')).toBeInTheDocument();
  });

  it('preserves line breaks in notes and mailing address', async () => {
    const clientWithMultilineData: Tables<'clients'> = {
      ...mockClient,
      notes: 'Line 1\nLine 2\nLine 3',
      mailing_address: '123 Main St\nSuite 456\nAnytown, ST 12345',
    };

    mockGetClient.mockResolvedValueOnce(clientWithMultilineData);

    const params = Promise.resolve({ id: 'client1' });
    const Component = await ClientDetailPage({ params });
    render(Component);

    // Find the Notes section
    const notesSection = screen.getByText('Notes').closest('.MuiCard-root');
    expect(notesSection).toBeInTheDocument();

    // Check that multiline content is preserved (it will be rendered with pre-line)
    expect(notesSection).toHaveTextContent('Line 1');
    expect(notesSection).toHaveTextContent('Line 2');
    expect(notesSection).toHaveTextContent('Line 3');

    // Find the Mailing Address section
    const addressSection = screen
      .getByText('Mailing Address')
      .closest('.MuiCard-root');
    expect(addressSection).toBeInTheDocument();

    expect(addressSection).toHaveTextContent('123 Main St');
    expect(addressSection).toHaveTextContent('Suite 456');
    expect(addressSection).toHaveTextContent('Anytown, ST 12345');
  });
});
