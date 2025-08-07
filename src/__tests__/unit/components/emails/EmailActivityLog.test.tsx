import { render, screen, waitFor } from '@testing-library/react';
import { EmailActivityLog } from '@/components/../app/(app)/settings/components/emails/monitoring/EmailActivityLog';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';

// Mock the email actions
jest.mock('@/lib/actions/emails', () => ({
  getEmailLogs: jest.fn().mockResolvedValue({
    success: true,
    data: {
      logs: [],
      total: 0,
    },
  }),
}));

// Mock the toast hook
jest.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    showToast: jest.fn(),
  }),
}));

const theme = createTheme();

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <ThemeProvider theme={theme}>{component}</ThemeProvider>
    </LocalizationProvider>
  );
};

describe('EmailActivityLog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders without LocalizationProvider error', async () => {
    renderWithProviders(<EmailActivityLog />);

    // Should render the main title
    expect(screen.getByText('Email Activity')).toBeInTheDocument();

    // Should render filter fields including date pickers
    expect(screen.getByLabelText('Status')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Start Date')).toBeInTheDocument();
    expect(screen.getByLabelText('End Date')).toBeInTheDocument();

    // Wait for loading to complete
    await waitFor(() => {
      expect(
        screen.getByText('No emails found matching your filters.')
      ).toBeInTheDocument();
    });
  });

  test('date picker fields are functional', async () => {
    renderWithProviders(<EmailActivityLog />);

    // Date picker fields should be present and not throw errors
    const startDateInput = screen.getByLabelText('Start Date');
    const endDateInput = screen.getByLabelText('End Date');

    expect(startDateInput).toBeInTheDocument();
    expect(endDateInput).toBeInTheDocument();

    // Both should be input elements
    expect(startDateInput).toBeInstanceOf(HTMLInputElement);
    expect(endDateInput).toBeInstanceOf(HTMLInputElement);
  });
});
