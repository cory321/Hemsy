import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Step1ClientSelection from '../Step1ClientSelection';
import { OrderFlowProvider } from '@/contexts/OrderFlowContext';
import { searchClients, createClient } from '@/lib/actions/clients';
import type { Client } from '@/types';

// Mock dependencies
jest.mock('@/lib/actions/clients');
jest.mock('@/hooks/useResponsive', () => ({
  useResponsive: () => ({ isMobile: false, isDesktop: true }),
}));
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockClient: Client = {
  id: '1',
  shop_id: 'shop-1',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
  phone_number: '555-1234',
  notes: null,
  mailing_address: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  accept_email: true,
  accept_sms: false,
};

const renderComponent = (initialClientId?: string) => {
  return render(
    <OrderFlowProvider {...(initialClientId ? { initialClientId } : {})}>
      <Step1ClientSelection />
    </OrderFlowProvider>
  );
};

describe('Step1ClientSelection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (searchClients as jest.Mock).mockResolvedValue([mockClient]);
    (createClient as jest.Mock).mockResolvedValue({
      success: true,
      data: mockClient,
    });
  });

  it('renders with "Existing client" selected by default', () => {
    renderComponent();

    expect(screen.getByText('Add Client')).toBeInTheDocument();
    expect(screen.getByLabelText('Existing client')).toBeChecked();
    expect(screen.getByLabelText('Create new client')).not.toBeChecked();
    expect(
      screen.getByPlaceholderText('Find client by name')
    ).toBeInTheDocument();
  });

  it('switches to "Create new client" mode when radio is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    const createNewRadio = screen.getByLabelText('Create new client');
    await user.click(createNewRadio);

    expect(createNewRadio).toBeChecked();
    expect(screen.getByLabelText('Existing client')).not.toBeChecked();
    expect(
      screen.queryByPlaceholderText('Find client by name')
    ).not.toBeInTheDocument();

    // Check for form sections
    expect(screen.getByText('Basic Information')).toBeInTheDocument();
    expect(screen.getByText('Communication Preferences*')).toBeInTheDocument();
    expect(screen.getByText('Additional Information')).toBeInTheDocument();
  });

  it('switches back to "Existing client" mode', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Switch to create new mode
    await user.click(screen.getByLabelText('Create new client'));
    expect(
      screen.queryByPlaceholderText('Find client by name')
    ).not.toBeInTheDocument();

    // Switch back to existing mode
    await user.click(screen.getByLabelText('Existing client'));
    expect(
      screen.getByPlaceholderText('Find client by name')
    ).toBeInTheDocument();
  });

  it('searches for clients when typing in the search field', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Type in search field
    const searchField = screen.getByPlaceholderText('Find client by name');
    await user.type(searchField, 'John');

    // Wait for search results
    await waitFor(() => {
      expect(searchClients).toHaveBeenCalledWith('John');
    });

    // Check if client is displayed in autocomplete
    await waitFor(() => {
      const clientOption = screen.getByText('John Doe');
      expect(clientOption).toBeInTheDocument();
    });
  });

  it('maintains radio selection state when switching between modes', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Start with existing client mode
    expect(screen.getByLabelText('Existing client')).toBeChecked();

    // Switch to create new
    await user.click(screen.getByLabelText('Create new client'));
    expect(screen.getByLabelText('Create new client')).toBeChecked();

    // Switch back to existing
    await user.click(screen.getByLabelText('Existing client'));
    expect(screen.getByLabelText('Existing client')).toBeChecked();
  });

  it('shows the Add Client button in create new mode', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Switch to create new mode
    await user.click(screen.getByLabelText('Create new client'));

    // Check for submit button
    const submitButton = screen.getByRole('button', { name: /add client/i });
    expect(submitButton).toBeInTheDocument();
  });

  it('shows communication preference switches in create new mode', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Switch to create new mode
    await user.click(screen.getByLabelText('Create new client'));

    // Check communication preference switches
    expect(
      screen.getByLabelText('Accept Email Communications')
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('Accept SMS Communications')
    ).toBeInTheDocument();
  });
});
