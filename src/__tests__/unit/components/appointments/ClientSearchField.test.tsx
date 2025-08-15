import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClientSearchField } from '@/components/appointments/ClientSearchField';
import { searchClients } from '@/lib/actions/clients';
import { createMockClient } from '@/lib/testing/mock-factories';

jest.mock('@/lib/actions/clients');

const mockSearchClients = searchClients as jest.MockedFunction<
  typeof searchClients
>;

const mockClients = [
  createMockClient({
    id: '1',
    shop_id: 'shop1',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    phone_number: '5551234567',
  }),
  createMockClient({
    id: '2',
    shop_id: 'shop1',
    first_name: 'Jane',
    last_name: 'Smith',
    email: 'jane@example.com',
    phone_number: '5559876543',
  }),
];

describe('ClientSearchField', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchClients.mockResolvedValue([] as any);
  });

  it('renders with search placeholder', () => {
    render(<ClientSearchField value={null} onChange={jest.fn()} />);

    expect(screen.getByLabelText('Client')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Search by name, email, or phone...')
    ).toBeInTheDocument();
    // Default helper text is undefined now; appointment-specific text should be passed where needed
    expect(
      screen.queryByText('Select a client for this appointment')
    ).not.toBeInTheDocument();
  });

  it('searches clients when typing', async () => {
    const user = userEvent.setup();
    mockSearchClients.mockResolvedValue(mockClients as any);

    render(<ClientSearchField value={null} onChange={jest.fn()} />);

    const input = screen.getByPlaceholderText(
      'Search by name, email, or phone...'
    );
    await user.type(input, 'john');

    await waitFor(() => {
      expect(mockSearchClients).toHaveBeenCalledWith('john');
    });
  });

  it('displays search results with name, email, and phone', async () => {
    const user = userEvent.setup();
    mockSearchClients.mockResolvedValue(mockClients as any);

    render(<ClientSearchField value={null} onChange={jest.fn()} />);

    const input = screen.getByPlaceholderText(
      'Search by name, email, or phone...'
    );
    await user.type(input, 'test');

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(
        screen.getByText('john@example.com • (555) 123-4567')
      ).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(
        screen.getByText('jane@example.com • (555) 987-6543')
      ).toBeInTheDocument();
    });
  });

  it('calls onChange when selecting a client', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    mockSearchClients.mockResolvedValue(mockClients as any);

    render(<ClientSearchField value={null} onChange={onChange} />);

    const input = screen.getByPlaceholderText(
      'Search by name, email, or phone...'
    );
    await user.type(input, 'john');

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('John Doe'));

    expect(onChange).toHaveBeenCalledWith(mockClients[0]!);
  });

  it('searches but returns no results when none match', async () => {
    const user = userEvent.setup();
    mockSearchClients.mockResolvedValue([] as any);

    render(<ClientSearchField value={null} onChange={jest.fn()} />);

    const input = screen.getByPlaceholderText(
      'Search by name, email, or phone...'
    );
    await user.type(input, 'nonexistent');

    // Verify search was called with correct parameters
    await waitFor(() => {
      expect(mockSearchClients).toHaveBeenCalledWith('nonexistent');
    });

    // When no results, the input should still have the typed value
    expect(input).toHaveValue('nonexistent');

    // Verify no options are shown in the dropdown
    const listbox = screen.queryByRole('listbox');
    if (listbox) {
      expect(listbox.children).toHaveLength(0);
    }
  });

  it('displays selected client value', () => {
    const selectedClient = mockClients[0]!;
    render(<ClientSearchField value={selectedClient} onChange={jest.fn()} />);

    const input = screen.getByDisplayValue('John Doe');
    expect(input).toBeInTheDocument();
  });

  it('debounces search requests', async () => {
    const user = userEvent.setup();
    render(<ClientSearchField value={null} onChange={jest.fn()} />);

    const input = screen.getByPlaceholderText(
      'Search by name, email, or phone...'
    );

    // Type quickly
    await user.type(input, 'j');
    await user.type(input, 'o');
    await user.type(input, 'h');
    await user.type(input, 'n');

    // Should not have called yet (debounce in progress) - allow a tiny tick
    await new Promise((r) => setTimeout(r, 10));
    expect(mockSearchClients).not.toHaveBeenCalled();

    // Wait for debounce
    await waitFor(
      () => {
        expect(mockSearchClients).toHaveBeenCalledTimes(1);
        expect(mockSearchClients).toHaveBeenCalledWith('john');
      },
      { timeout: 400 }
    );
  });

  it('shows loading state while searching', async () => {
    const user = userEvent.setup();

    // Create a promise we can control
    let resolveSearch: any;
    const searchPromise = new Promise((resolve) => {
      resolveSearch = resolve;
    });

    mockSearchClients.mockReturnValue(searchPromise as any);

    render(<ClientSearchField value={null} onChange={jest.fn()} />);

    const input = screen.getByPlaceholderText(
      'Search by name, email, or phone...'
    );
    await user.type(input, 'test');

    await waitFor(() => {
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    // Resolve the search
    resolveSearch(mockClients as any);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });

  it('does not show dropdown when input is empty', async () => {
    render(<ClientSearchField value={null} onChange={jest.fn()} />);

    const input = screen.getByPlaceholderText(
      'Search by name, email, or phone...'
    );

    // Focus without typing
    fireEvent.focus(input);

    // Should not call search
    await waitFor(
      () => {
        expect(mockSearchClients).not.toHaveBeenCalled();
      },
      { timeout: 400 }
    );

    // No dropdown options should be visible
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('displays the client name in input field when value is provided', () => {
    const selectedClient = mockClients[0]!; // John Doe
    render(<ClientSearchField value={selectedClient} onChange={jest.fn()} />);

    const input = screen.getByDisplayValue('John Doe');
    expect(input).toBeInTheDocument();
  });

  it('updates input field when value changes', () => {
    const { rerender } = render(
      <ClientSearchField value={null} onChange={jest.fn()} />
    );

    // Initially empty
    expect(screen.getByDisplayValue('')).toBeInTheDocument();

    // Update with client
    const selectedClient = mockClients[1]!; // Jane Smith
    rerender(<ClientSearchField value={selectedClient} onChange={jest.fn()} />);

    expect(screen.getByDisplayValue('Jane Smith')).toBeInTheDocument();

    // Clear selection
    rerender(<ClientSearchField value={null} onChange={jest.fn()} />);

    expect(screen.getByDisplayValue('')).toBeInTheDocument();
  });
});
