import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Step1ClientSelection from '@/components/orders/steps/Step1ClientSelection';
import { OrderFlowProvider } from '@/contexts/OrderFlowContext';

// Mock ClientSearchField to avoid external calls
jest.mock('@/components/appointments/ClientSearchField', () => ({
  ClientSearchField: ({ placeholder }: any) => (
    <input aria-label="Client" placeholder={placeholder} />
  ),
}));

const renderWithProvider = () =>
  render(
    <OrderFlowProvider>
      <Step1ClientSelection />
    </OrderFlowProvider>
  );

describe('Step1ClientSelection layout (current UI)', () => {
  it('renders heading and radio toggle', () => {
    renderWithProvider();
    expect(screen.getByText('Add Client')).toBeInTheDocument();
    expect(screen.getByLabelText('Existing client')).toBeChecked();
    expect(screen.getByLabelText('Create new client')).toBeInTheDocument();
  });

  it('switches between existing and new client modes', async () => {
    const user = userEvent.setup();
    renderWithProvider();

    // Default: existing client search visible
    expect(
      screen.getByPlaceholderText('Find client by name')
    ).toBeInTheDocument();

    // Switch to create new client
    await user.click(screen.getByLabelText('Create new client'));
    expect(screen.getByLabelText('Create new client')).toBeChecked();
    expect(
      screen.queryByPlaceholderText('Find client by name')
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /add client/i })
    ).toBeInTheDocument();
  });
});
