import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Step1ClientSelection from '@/components/orders/steps/Step1ClientSelection';
import { OrderFlowProvider } from '@/contexts/OrderFlowContext';

// Mock ClientSearchField to avoid external calls
jest.mock('@/components/appointments/ClientSearchField', () => ({
  ClientSearchField: ({ onChange }: any) => (
    <input aria-label="Client" onChange={(e) => onChange(null)} />
  ),
}));

// Mock ClientCreateDialog to make open state testable
jest.mock('@/components/clients/ClientCreateDialog', () => ({
  __esModule: true,
  default: ({ open }: { open: boolean }) => (
    <div data-testid="client-create-dialog" data-open={open} />
  ),
}));

jest.mock('@/lib/actions/clients', () => ({
  getClient: jest.fn(async () => ({
    id: 'c1',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    phone_number: '5551234567',
    notes: null,
  })),
}));

const renderWithProvider = (props?: { initialClientId?: string }) =>
  render(
    <OrderFlowProvider {...props}>
      <Step1ClientSelection />
    </OrderFlowProvider>
  );

describe('Step1ClientSelection layout', () => {
  it('renders centered search-first layout with or-separator and Add New Client', () => {
    renderWithProvider();

    // Heading
    expect(screen.getByText('Select Client')).toBeInTheDocument();
    // Separator and add button present
    expect(screen.getByTestId('or-separator')).toHaveTextContent('- or -');
    expect(screen.getByTestId('add-new-client-button')).toBeInTheDocument();
  });

  it('opens create dialog when clicking Add New Client', () => {
    renderWithProvider();

    const addBtn = screen.getByTestId('add-new-client-button');
    expect(screen.getByTestId('client-create-dialog')).toHaveAttribute(
      'data-open',
      'false'
    );
    fireEvent.click(addBtn);
    expect(screen.getByTestId('client-create-dialog')).toHaveAttribute(
      'data-open',
      'true'
    );
  });

  it('shows only the Selected Client card when a client is selected, with controls to clear', async () => {
    renderWithProvider({ initialClientId: 'c1' });

    // Selected client card should appear
    await waitFor(() =>
      expect(screen.getByTestId('selected-client-card')).toBeInTheDocument()
    );
    expect(screen.getByText('Selected Client')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();

    // Change controls present
    expect(screen.getByTestId('close-selected-client')).toBeInTheDocument();
    expect(screen.getByTestId('choose-different-client')).toBeInTheDocument();

    // Clear via the text button and return to search/add view
    fireEvent.click(screen.getByTestId('choose-different-client'));
    await waitFor(() =>
      expect(
        screen.queryByTestId('selected-client-card')
      ).not.toBeInTheDocument()
    );
    expect(screen.getByTestId('or-separator')).toBeInTheDocument();
  });
});
