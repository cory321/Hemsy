import React from 'react';
import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ServicesSearch from '@/components/services/ServicesSearch';
import { searchServices } from '@/lib/actions/services';

// Mock the server action
jest.mock('@/lib/actions/services', () => ({
  searchServices: jest.fn(),
}));

// Mock the debounce utility
jest.mock('@/lib/utils/debounce', () => ({
  debounce: (fn: any) => {
    const debounced = (...args: any[]) => fn(...args);
    return debounced;
  },
}));

// Mock the CreateServiceDialog component
jest.mock('@/components/services/CreateServiceDialog', () => ({
  __esModule: true,
  default: ({ open, onClose }: any) =>
    open ? (
      <div data-testid="create-service-dialog">Create Service Dialog</div>
    ) : null,
}));

describe('ServicesSearch', () => {
  const mockOnServiceSelect = jest.fn();
  const mockSearchServices = searchServices as jest.MockedFunction<
    typeof searchServices
  >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the search field and new service button', () => {
    render(<ServicesSearch onServiceSelect={mockOnServiceSelect} />);

    expect(screen.getByLabelText('Search services')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /new service/i })
    ).toBeInTheDocument();
  });

  it('should show loading spinner when searching', async () => {
    let resolveSearch: any;
    mockSearchServices.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSearch = resolve;
        })
    );

    render(<ServicesSearch onServiceSelect={mockOnServiceSelect} />);

    const input = screen.getByLabelText('Search services');

    await act(async () => {
      await userEvent.type(input, 'test');
    });

    // Should show loading spinner
    await waitFor(() => {
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    // Resolve the search
    await act(async () => {
      resolveSearch([]);
    });

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });

  it('should search for services when typing', async () => {
    const mockServices = [
      {
        id: 'service-1',
        shop_id: 'shop-1',
        name: 'Hemming',
        description: 'Basic hemming service',
        default_qty: 1,
        default_unit: 'item' as const,
        default_unit_price_cents: 1500,
        frequently_used: true,
        frequently_used_position: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 'service-2',
        shop_id: 'shop-1',
        name: 'Alterations',
        description: null,
        default_qty: 1,
        default_unit: 'hour' as const,
        default_unit_price_cents: 5000,
        frequently_used: false,
        frequently_used_position: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ];

    mockSearchServices.mockResolvedValue(mockServices);

    render(<ServicesSearch onServiceSelect={mockOnServiceSelect} />);

    const input = screen.getByLabelText('Search services');
    await userEvent.type(input, 'hem');

    await waitFor(() => {
      expect(mockSearchServices).toHaveBeenCalledWith('hem');
    });

    // Should display search results
    expect(screen.getByText('Hemming')).toBeInTheDocument();
    expect(screen.getByText('Basic hemming service')).toBeInTheDocument();
    expect(screen.getByText('$15.00 per item')).toBeInTheDocument();
    expect(screen.getByText('Frequently Used')).toBeInTheDocument();
  });

  it('should not search with less than 2 characters', async () => {
    render(<ServicesSearch onServiceSelect={mockOnServiceSelect} />);

    const input = screen.getByLabelText('Search services');
    await userEvent.type(input, 'h');

    await waitFor(() => {
      expect(mockSearchServices).not.toHaveBeenCalled();
    });

    expect(
      screen.getByText('Type at least 2 characters to search')
    ).toBeInTheDocument();
  });

  it('should handle service selection', async () => {
    const mockService = {
      id: 'service-1',
      shop_id: 'shop-1',
      name: 'Hemming',
      description: 'Basic hemming service',
      default_qty: 1,
      default_unit: 'item' as const,
      default_unit_price_cents: 1500,
      frequently_used: true,
      frequently_used_position: 1,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    mockSearchServices.mockResolvedValue([mockService]);

    render(<ServicesSearch onServiceSelect={mockOnServiceSelect} />);

    const input = screen.getByLabelText('Search services');

    await act(async () => {
      await userEvent.type(input, 'hem');
    });

    await waitFor(() => {
      expect(screen.getByText('Hemming')).toBeInTheDocument();
    });

    // Find the list item option instead of just the text
    const option = screen.getByRole('option', { name: /Hemming/ });

    await act(async () => {
      fireEvent.click(option);
    });

    await waitFor(() => {
      expect(mockOnServiceSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'service-1',
          name: 'Hemming',
          default_qty: 1,
          default_unit: 'item',
          default_unit_price_cents: 1500,
          frequently_used: true,
          frequently_used_position: 1,
          description: 'Basic hemming service',
        })
      );
      // Input should be cleared after selection
      expect(input).toHaveValue('');
    });
  });

  it('should handle search errors gracefully', async () => {
    mockSearchServices.mockRejectedValue(new Error('Search failed'));

    render(<ServicesSearch onServiceSelect={mockOnServiceSelect} />);

    const input = screen.getByLabelText('Search services');
    await userEvent.type(input, 'test');

    await waitFor(() => {
      expect(mockSearchServices).toHaveBeenCalledWith('test');
    });

    // Should show no results
    expect(screen.getByText('No services found')).toBeInTheDocument();
  });

  it('should open create service dialog when clicking new service button', async () => {
    render(<ServicesSearch onServiceSelect={mockOnServiceSelect} />);

    const newServiceButton = screen.getByRole('button', {
      name: /new service/i,
    });
    fireEvent.click(newServiceButton);

    expect(screen.getByTestId('create-service-dialog')).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<ServicesSearch onServiceSelect={mockOnServiceSelect} disabled />);

    expect(screen.getByLabelText('Search services')).toBeDisabled();
    expect(screen.getByRole('button', { name: /new service/i })).toBeDisabled();
  });
});
