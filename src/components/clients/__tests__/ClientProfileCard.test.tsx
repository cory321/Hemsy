import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ClientProfileCard from '../ClientProfileCard';
import type { Tables } from '@/types/supabase';

// Mock client data
const mockClient: Tables<'clients'> = {
  id: '1',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  phone_number: '5551234567',
  accept_email: true,
  accept_sms: false,
  mailing_address: null,
  notes: null,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  shop_id: 'shop-1',
};

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

// Mock the ClientEditDialog component
jest.mock('@/components/clients/ClientEditDialog', () => {
  return function MockClientEditDialog({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return <div data-testid="client-edit-dialog">{children}</div>;
  };
});

describe('ClientProfileCard', () => {
  it('renders client name and initials', () => {
    renderWithTheme(<ClientProfileCard client={mockClient} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('displays contact information', () => {
    renderWithTheme(<ClientProfileCard client={mockClient} />);

    expect(screen.getByText('Contact Information')).toBeInTheDocument();
    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    expect(screen.getByText('(555) 123-4567')).toBeInTheDocument();
  });

  it('formats phone number correctly', () => {
    renderWithTheme(<ClientProfileCard client={mockClient} />);

    expect(screen.getByText('(555) 123-4567')).toBeInTheDocument();
  });

  it('displays client since date', () => {
    renderWithTheme(<ClientProfileCard client={mockClient} />);

    expect(screen.getByText('Client since December 2023')).toBeInTheDocument();
  });

  it('handles null created_at date gracefully', () => {
    const clientWithNullDate = { ...mockClient, created_at: null };
    renderWithTheme(<ClientProfileCard client={clientWithNullDate} />);

    expect(screen.getByText('Client since Unknown')).toBeInTheDocument();
  });

  it('renders edit button', () => {
    renderWithTheme(<ClientProfileCard client={mockClient} />);

    expect(
      screen.getByRole('button', { name: /edit client information/i })
    ).toBeInTheDocument();
  });

  it('generates correct initials for different name combinations', () => {
    // Test with both names
    renderWithTheme(<ClientProfileCard client={mockClient} />);
    expect(screen.getByText('JD')).toBeInTheDocument();

    // Test with only first name
    const clientFirstOnly = { ...mockClient, last_name: null };
    const { rerender } = renderWithTheme(
      <ClientProfileCard client={clientFirstOnly} />
    );
    expect(screen.getByText('J')).toBeInTheDocument();

    // Test with only last name
    const clientLastOnly = { ...mockClient, first_name: null };
    rerender(
      <ThemeProvider theme={theme}>
        <ClientProfileCard client={clientLastOnly} />
      </ThemeProvider>
    );
    expect(screen.getByText('D')).toBeInTheDocument();

    // Test with no names
    const clientNoNames = { ...mockClient, first_name: null, last_name: null };
    rerender(
      <ThemeProvider theme={theme}>
        <ClientProfileCard client={clientNoNames} />
      </ThemeProvider>
    );
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('has proper accessibility structure', () => {
    renderWithTheme(<ClientProfileCard client={mockClient} />);

    // Check for proper heading hierarchy
    expect(
      screen.getByRole('heading', { level: 2, name: 'John Doe' })
    ).toBeInTheDocument();

    // Check for avatar (MUI Avatar doesn't have img role by default)
    expect(screen.getByText('JD')).toBeInTheDocument();
  });
});
