import { render, screen, fireEvent } from '@testing-library/react';
import AddClientCtas from '@/components/clients/AddClientCtas';

describe('AddClientCtas', () => {
  it('opens and closes the create client dialog', async () => {
    render(<AddClientCtas />);

    const addButtons = screen.getAllByRole('button', { name: /add client/i });
    expect(addButtons.length).toBeGreaterThan(0);
    fireEvent.click(addButtons[0]!);

    expect(await screen.findByText('Add New Client')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(screen.queryByText('Add New Client')).not.toBeInTheDocument();
  });
});
