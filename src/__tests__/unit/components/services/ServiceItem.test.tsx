import { render, screen, fireEvent } from '@testing-library/react';
import ServiceItem from '@/components/services/ServiceItem';

const baseService = {
  id: 'svc_1',
  name: 'Hem Pants',
  description: 'Shorten hem',
  default_qty: 1,
  default_unit: 'item',
  default_unit_price_cents: 1500,
  frequently_used: false,
  frequently_used_position: null,
};

describe('ServiceItem', () => {
  it('opens edit dialog when card is clicked', () => {
    render(
      <ServiceItem
        service={baseService as any}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onDuplicate={jest.fn()}
      />
    );

    // Click the card via its text content
    fireEvent.click(screen.getByText('Hem Pants'));

    expect(screen.getByText('Edit Service')).toBeInTheDocument();
  });

  it('does not open edit dialog when menu button is clicked or when clicking outside to dismiss menu', () => {
    render(
      <ServiceItem
        service={baseService as any}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onDuplicate={jest.fn()}
      />
    );

    // Click the kebab/menu icon button
    const menuButton = screen.getByRole('button');
    fireEvent.click(menuButton);

    // Menu should appear but dialog should not
    expect(screen.queryByText('Edit Service')).not.toBeInTheDocument();

    // Click outside to close the menu; dialog should still not appear
    fireEvent.mouseDown(document.body);
    fireEvent.click(document.body);
    expect(screen.queryByText('Edit Service')).not.toBeInTheDocument();
  });
});
