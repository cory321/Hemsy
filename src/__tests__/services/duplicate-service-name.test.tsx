import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { showSuccessToast, showErrorToast } from '@/lib/utils/toast';
import CreateServiceDialog from '@/components/services/CreateServiceDialog';
import AddServiceForm from '@/components/services/AddServiceForm';
import * as servicesActions from '@/lib/actions/services';

// Mock the consolidated toast system
jest.mock('@/lib/utils/toast');

// Mock the service actions
jest.mock('@/lib/actions/services', () => ({
  addService: jest.fn(),
}));

// Mock Material-UI's useMediaQuery
jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  useMediaQuery: () => false,
}));

describe('Duplicate Service Name Handling', () => {
  const mockOnClose = jest.fn();
  const mockOnServiceSelect = jest.fn();
  const mockSetServices = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CreateServiceDialog', () => {
    it('should display duplicate name error in the dialog', async () => {
      (servicesActions.addService as jest.Mock).mockResolvedValueOnce({
        success: false,
        error:
          'A service with this name already exists. Please choose a different name.',
      });

      render(
        <CreateServiceDialog
          open={true}
          onClose={mockOnClose}
          onServiceSelect={mockOnServiceSelect}
        />
      );

      // Fill in the form
      const nameInput = screen.getByLabelText(/Service Name/i);
      await userEvent.type(nameInput, 'Existing Service');

      // Set a price (required field)
      const priceInput = screen.getByLabelText(/Price/i);
      await userEvent.clear(priceInput);
      await userEvent.type(priceInput, '50.00');

      // Submit the form
      const addButton = screen.getByRole('button', { name: /Add Service/i });
      fireEvent.click(addButton);

      // Wait for the error to be displayed
      await waitFor(() => {
        expect(
          screen.getByText(/A service with this name already exists/i)
        ).toBeInTheDocument();
      });

      // The error should be shown in an Alert component
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent(
        'A service with this name already exists'
      );

      // The name field should show error state
      expect(nameInput).toHaveAttribute('aria-invalid', 'true');

      // The dialog should not close
      expect(mockOnClose).not.toHaveBeenCalled();

      // Toast should not be shown for duplicate name errors
      expect(showErrorToast).not.toHaveBeenCalled();
    });

    it('should clear error when user types in name field', async () => {
      (servicesActions.addService as jest.Mock).mockResolvedValueOnce({
        success: false,
        error:
          'A service with this name already exists. Please choose a different name.',
      });

      render(
        <CreateServiceDialog
          open={true}
          onClose={mockOnClose}
          onServiceSelect={mockOnServiceSelect}
        />
      );

      // Fill in and submit to trigger error
      const nameInput = screen.getByLabelText(/Service Name/i);
      await userEvent.type(nameInput, 'Existing Service');

      const priceInput = screen.getByLabelText(/Price/i);
      await userEvent.clear(priceInput);
      await userEvent.type(priceInput, '50.00');

      const addButton = screen.getByRole('button', { name: /Add Service/i });
      fireEvent.click(addButton);

      // Wait for error
      await waitFor(() => {
        expect(
          screen.getByText(/A service with this name already exists/i)
        ).toBeInTheDocument();
      });

      // Type in the name field to clear error
      await userEvent.type(nameInput, ' New');

      // Error should be cleared
      await waitFor(() => {
        expect(
          screen.queryByText(/A service with this name already exists/i)
        ).not.toBeInTheDocument();
      });

      expect(nameInput).not.toHaveAttribute('aria-invalid', 'true');
    });

    it('should show toast for other errors', async () => {
      const otherError = new Error('Network error');
      (servicesActions.addService as jest.Mock).mockRejectedValueOnce(
        otherError
      );

      render(
        <CreateServiceDialog
          open={true}
          onClose={mockOnClose}
          onServiceSelect={mockOnServiceSelect}
        />
      );

      // Fill in the form
      const nameInput = screen.getByLabelText(/Service Name/i);
      await userEvent.type(nameInput, 'New Service');

      const priceInput = screen.getByLabelText(/Price/i);
      await userEvent.clear(priceInput);
      await userEvent.type(priceInput, '50.00');

      // Submit the form
      const addButton = screen.getByRole('button', { name: /Add Service/i });
      fireEvent.click(addButton);

      // Wait for toast to be called
      await waitFor(() => {
        expect(showErrorToast).toHaveBeenCalledWith(
          'An unexpected error occurred while adding the service'
        );
      });

      // No error alert should be shown in the dialog
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should clear error when dialog is closed', async () => {
      (servicesActions.addService as jest.Mock).mockResolvedValueOnce({
        success: false,
        error:
          'A service with this name already exists. Please choose a different name.',
      });

      const { rerender } = render(
        <CreateServiceDialog
          open={true}
          onClose={mockOnClose}
          onServiceSelect={mockOnServiceSelect}
        />
      );

      // Trigger error
      const nameInput = screen.getByLabelText(/Service Name/i);
      await userEvent.type(nameInput, 'Existing Service');

      const priceInput = screen.getByLabelText(/Price/i);
      await userEvent.clear(priceInput);
      await userEvent.type(priceInput, '50.00');

      const addButton = screen.getByRole('button', { name: /Add Service/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(
          screen.getByText(/A service with this name already exists/i)
        ).toBeInTheDocument();
      });

      // Close and reopen dialog
      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButton);

      rerender(
        <CreateServiceDialog
          open={false}
          onClose={mockOnClose}
          onServiceSelect={mockOnServiceSelect}
        />
      );

      rerender(
        <CreateServiceDialog
          open={true}
          onClose={mockOnClose}
          onServiceSelect={mockOnServiceSelect}
        />
      );

      // Error should be cleared
      expect(
        screen.queryByText(/A service with this name already exists/i)
      ).not.toBeInTheDocument();
    });
  });

  describe('AddServiceForm', () => {
    it('should display duplicate name error in the form', async () => {
      (servicesActions.addService as jest.Mock).mockResolvedValueOnce({
        success: false,
        error:
          'A service with this name already exists. Please choose a different name.',
      });

      render(
        <AddServiceForm setServices={mockSetServices} onClose={mockOnClose} />
      );

      // Fill in the form
      const nameInput = screen.getByLabelText(/Name/i);
      await userEvent.type(nameInput, 'Existing Service');

      // Set a price
      const priceInput = screen.getByLabelText(/Price/i);
      await userEvent.clear(priceInput);
      await userEvent.type(priceInput, '50.00');

      // Submit the form
      const addButton = screen.getByRole('button', { name: /Add Service/i });
      fireEvent.click(addButton);

      // Wait for the error to be displayed
      await waitFor(() => {
        expect(
          screen.getByText(/A service with this name already exists/i)
        ).toBeInTheDocument();
      });

      // The error should be shown in an Alert component
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent(
        'A service with this name already exists'
      );

      // The name field should show error state
      expect(nameInput).toHaveAttribute('aria-invalid', 'true');

      // The form should not close
      expect(mockOnClose).not.toHaveBeenCalled();

      // Toast should not be shown for duplicate name errors
      expect(showErrorToast).not.toHaveBeenCalled();
    });

    it('should clear error when user types in name field', async () => {
      (servicesActions.addService as jest.Mock).mockResolvedValueOnce({
        success: false,
        error:
          'A service with this name already exists. Please choose a different name.',
      });

      render(
        <AddServiceForm setServices={mockSetServices} onClose={mockOnClose} />
      );

      // Fill in and submit to trigger error
      const nameInput = screen.getByLabelText(/Name/i);
      await userEvent.type(nameInput, 'Existing Service');

      const priceInput = screen.getByLabelText(/Price/i);
      await userEvent.clear(priceInput);
      await userEvent.type(priceInput, '50.00');

      const addButton = screen.getByRole('button', { name: /Add Service/i });
      fireEvent.click(addButton);

      // Wait for error
      await waitFor(() => {
        expect(
          screen.getByText(/A service with this name already exists/i)
        ).toBeInTheDocument();
      });

      // Type in the name field to clear error
      await userEvent.type(nameInput, ' New');

      // Error should be cleared
      await waitFor(() => {
        expect(
          screen.queryByText(/A service with this name already exists/i)
        ).not.toBeInTheDocument();
      });

      expect(nameInput).not.toHaveAttribute('aria-invalid', 'true');
    });
  });
});
