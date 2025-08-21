import { render, screen, fireEvent } from '@testing-library/react';
import ServiceItem from '@/components/services/ServiceItem';

const baseService = {
  id: 'svc_1',
  name: 'Hem Pants',
  description: 'Shorten hem',
  default_qty: 1,
  default_unit: 'flat_rate' as const,
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

  describe('Service display logic', () => {
    it('displays "Flat rate service" for flat_rate services', () => {
      render(
        <ServiceItem
          service={baseService as any}
          onEdit={jest.fn()}
          onDelete={jest.fn()}
          onDuplicate={jest.fn()}
        />
      );

      expect(screen.getByText('Flat rate service')).toBeInTheDocument();
      expect(
        screen.queryByText('Default: 1 flat rate')
      ).not.toBeInTheDocument();
    });

    it('displays quantity and unit for hourly services', () => {
      const hourlyService = {
        ...baseService,
        default_unit: 'hour' as const,
        default_qty: 2,
      };

      render(
        <ServiceItem
          service={hourlyService as any}
          onEdit={jest.fn()}
          onDelete={jest.fn()}
          onDuplicate={jest.fn()}
        />
      );

      expect(screen.getByText('Default: 2 hours')).toBeInTheDocument();
      expect(screen.queryByText('Flat rate service')).not.toBeInTheDocument();
    });

    it('displays quantity and unit for daily services', () => {
      const dailyService = {
        ...baseService,
        default_unit: 'day' as const,
        default_qty: 3,
      };

      render(
        <ServiceItem
          service={dailyService as any}
          onEdit={jest.fn()}
          onDelete={jest.fn()}
          onDuplicate={jest.fn()}
        />
      );

      expect(screen.getByText('Default: 3 days')).toBeInTheDocument();
      expect(screen.queryByText('Flat rate service')).not.toBeInTheDocument();
    });

    it('displays singular unit when quantity is 1', () => {
      const hourlyService = {
        ...baseService,
        default_unit: 'hour' as const,
        default_qty: 1,
      };

      render(
        <ServiceItem
          service={hourlyService as any}
          onEdit={jest.fn()}
          onDelete={jest.fn()}
          onDuplicate={jest.fn()}
        />
      );

      expect(screen.getByText('Default: 1 hour')).toBeInTheDocument();
    });
  });
});
