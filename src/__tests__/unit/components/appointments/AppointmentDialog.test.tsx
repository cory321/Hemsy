import React from 'react';
import {
  render,
  screen,
  waitFor,
  fireEvent,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppointmentDialog } from '@/components/appointments/AppointmentDialog';
import { searchClients } from '@/lib/actions/clients';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import {
  createMockClient,
  createMockShopHours,
  createMockAppointment,
} from '@/lib/testing/mock-factories';

// Mock the actions
jest.mock('@/lib/actions/clients', () => ({
  searchClients: jest.fn(),
  createClient: jest.fn(),
}));
jest.mock('@/lib/actions/appointments', () => ({
  createAppointment: jest.fn(),
  updateAppointment: jest.fn(),
}));
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: jest.fn(),
  }),
}));

const mockClients = [
  createMockClient({
    id: '1',
    shop_id: 'shop1',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    phone_number: '1234567890',
  }),
  createMockClient({
    id: '2',
    shop_id: 'shop1',
    first_name: 'Jane',
    last_name: 'Smith',
    email: 'jane@example.com',
    phone_number: '0987654321',
  }),
];

const defaultProps = {
  open: true,
  onClose: jest.fn(),
  shopHours: [
    createMockShopHours({
      day_of_week: 1,
      open_time: '09:00',
      close_time: '17:00',
      is_closed: false,
    }),
  ],
  existingAppointments: [],
  calendarSettings: {
    buffer_time_minutes: 15,
    default_appointment_duration: 30,
  },
};

const renderWithLocalization = (component: React.ReactElement) => {
  return render(
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      {component}
    </LocalizationProvider>
  );
};

describe('AppointmentDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (searchClients as jest.Mock).mockResolvedValue(mockClients);
  });

  it('searches and displays clients when typing', async () => {
    const user = userEvent.setup();
    renderWithLocalization(<AppointmentDialog {...defaultProps} />);

    // Type in the client search field
    const clientInput = screen.getByPlaceholderText(
      'Search by name, email, or phone...'
    );
    await user.type(clientInput, 'john');

    // Wait for search to be called
    await waitFor(() => {
      expect(searchClients).toHaveBeenCalledWith('john');
    });

    // Check if clients are displayed in the dropdown
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(
        screen.getByText('john@example.com • (123) 456-7890')
      ).toBeInTheDocument();
    });
  });

  it('filters clients based on search input', async () => {
    const user = userEvent.setup();

    // Mock different results for different searches
    (searchClients as jest.Mock).mockImplementation((searchTerm) => {
      if (searchTerm === 'jane') {
        return Promise.resolve([mockClients[1]]); // Only Jane
      }
      return Promise.resolve(mockClients);
    });

    renderWithLocalization(<AppointmentDialog {...defaultProps} />);

    // Type in the client search field
    const clientInput = screen.getByPlaceholderText(
      'Search by name, email, or phone...'
    );
    await user.type(clientInput, 'jane');

    // Check if only Jane is shown
    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });
  });

  it('handles error when searching clients fails', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    (searchClients as jest.Mock).mockRejectedValue(
      new Error('Failed to search clients')
    );

    const user = userEvent.setup();
    renderWithLocalization(<AppointmentDialog {...defaultProps} />);

    // Type to trigger search
    const clientInput = screen.getByPlaceholderText(
      'Search by name, email, or phone...'
    );
    await user.type(clientInput, 'test');

    // Wait for error to be logged
    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        'Failed to search clients:',
        expect.any(Error)
      );
    });

    consoleError.mockRestore();
  });

  it('shows loading state while searching clients', async () => {
    const user = userEvent.setup();

    // Create a promise we can control
    let resolveSearch: any;
    const searchPromise = new Promise((resolve) => {
      resolveSearch = resolve;
    });

    (searchClients as jest.Mock).mockReturnValue(searchPromise);

    renderWithLocalization(<AppointmentDialog {...defaultProps} />);

    // Type to trigger search
    const clientInput = screen.getByPlaceholderText(
      'Search by name, email, or phone...'
    );
    await user.type(clientInput, 'test');

    // Look for loading indicator
    await waitFor(() => {
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    // Resolve the search
    resolveSearch(mockClients);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });

  it('selects a client and updates form state', async () => {
    const user = userEvent.setup();
    renderWithLocalization(<AppointmentDialog {...defaultProps} />);

    // Search for a client
    const clientInput = screen.getByPlaceholderText(
      'Search by name, email, or phone...'
    );
    await user.type(clientInput, 'john');

    // Wait for search results
    await waitFor(() => {
      expect(searchClients).toHaveBeenCalled();
    });

    // Select John Doe
    const johnOption = await screen.findByText('John Doe');
    await user.click(johnOption);

    // Verify the client is selected
    expect(clientInput).toHaveValue('John Doe');
  });

  it('allows clearing the selected client', async () => {
    const user = userEvent.setup();
    renderWithLocalization(<AppointmentDialog {...defaultProps} />);

    // Search and select a client
    const clientInput = screen.getByPlaceholderText(
      'Search by name, email, or phone...'
    );
    await user.type(clientInput, 'john');

    await waitFor(() => {
      expect(searchClients).toHaveBeenCalled();
    });

    const johnOption = await screen.findByText('John Doe');
    await user.click(johnOption);

    // Clear the selection
    const clearButton = screen.getByTitle('Clear');
    await user.click(clearButton);

    // Verify the client is cleared
    expect(clientInput).toHaveValue('');
  });

  it('handles duplicate client names without key warnings', async () => {
    const clientsWithDuplicates = [
      ...mockClients,
      {
        id: '3',
        shop_id: 'shop1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john2@example.com',
        phone_number: '5555555555',
        date_of_birth: '1992-01-01',
        address: '789 Elm St',
        city: 'Chicago',
        postal_code: '60601',
        country: 'USA',
        notes: null,
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      },
    ];

    (searchClients as jest.Mock).mockResolvedValue(clientsWithDuplicates);

    // Spy on console.error to catch React key warnings
    const consoleError = jest.spyOn(console, 'error').mockImplementation();

    const user = userEvent.setup();
    renderWithLocalization(<AppointmentDialog {...defaultProps} />);

    // Search for John to show duplicates
    const clientInput = screen.getByPlaceholderText(
      'Search by name, email, or phone...'
    );
    await user.type(clientInput, 'john');

    // Wait for search to complete
    await waitFor(() => {
      expect(searchClients).toHaveBeenCalled();
    });

    // Check that both John Doe entries are displayed
    const johnDoeOptions = await screen.findAllByText('John Doe');
    expect(johnDoeOptions).toHaveLength(2);

    // Verify no React key warnings were logged
    const keyWarnings = consoleError.mock.calls.filter((call) =>
      call.some(
        (arg) =>
          typeof arg === 'string' &&
          arg.includes('Encountered two children with the same key')
      )
    );
    expect(keyWarnings).toHaveLength(0);

    consoleError.mockRestore();
  });

  it('clears the client field when opening for a new appointment', async () => {
    const user = userEvent.setup();
    // Render dialog with a pre-selected client (simulate editing)
    const firstClient = mockClients[0];
    const appointment = createMockAppointment({
      id: 'apt1',
      client_id: firstClient?.id || '',
      ...(firstClient && { client: firstClient }),
      date: '2024-06-01',
      start_time: '10:00',
      end_time: '10:30',
      type: 'consultation',
      notes: '',
      shop_id: 'shop1',
      status: 'pending',
    });
    const { rerender } = renderWithLocalization(
      <AppointmentDialog
        {...defaultProps}
        open={true}
        appointment={appointment}
      />
    );
    // Client field should be pre-filled
    const clientInput = screen.getByPlaceholderText(
      'Search by name, email, or phone...'
    );
    expect(clientInput).toHaveValue('John Doe');

    // Now rerender as if opening for a new appointment
    rerender(
      <AppointmentDialog {...defaultProps} open={true} appointment={null} />
    );
    // Wait for the effect to clear the client (re-query input after rerender)
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText('Search by name, email, or phone...')
      ).toHaveValue('');
    });
  });

  it('opens quick-add, creates a client, and populates the client field', async () => {
    const user = userEvent.setup();
    const { createClient } = jest.requireMock('@/lib/actions/clients');

    const created = {
      id: 'new1',
      shop_id: 'shop1',
      first_name: 'Alice',
      last_name: 'Wonder',
      email: 'alice@example.com',
      phone_number: '5554443333',
      accept_email: true,
      accept_sms: false,
      notes: null,
      mailing_address: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    (createClient as jest.Mock).mockResolvedValue(created);

    renderWithLocalization(<AppointmentDialog {...defaultProps} />);

    // Open quick-add dialog
    const addLink = await screen.findByTestId('add-new-client-link');
    await user.click(addLink);

    // Wait for the dialog and scope queries within it
    const quickAddDialog = await screen.findByRole('dialog', {
      name: /add new client/i,
    });
    const inDialog = within(quickAddDialog);

    // Fill minimal required fields
    await user.type(inDialog.getByLabelText(/First Name/i), 'Alice');
    await user.type(inDialog.getByLabelText(/Last Name/i), 'Wonder');
    await user.type(
      inDialog.getByLabelText(/Email Address/i),
      'alice@example.com'
    );
    await user.type(inDialog.getByLabelText(/Phone Number/i), '5554443333');

    // Submit
    await user.click(inDialog.getByRole('button', { name: /add client/i }));

    // Client field should now have the new client's name
    await waitFor(() => {
      const clientInput = screen.getByPlaceholderText(
        'Search by name, email, or phone...'
      );
      expect(clientInput).toHaveValue('Alice Wonder');
    });
  });
});
