import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'react-hot-toast';
import CreateServiceDialog from '@/components/services/CreateServiceDialog';
import AddServiceForm from '@/components/services/AddServiceForm';
import * as servicesActions from '@/lib/actions/services';

// Mock the toast library
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

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
      const duplicateError = new Error(
        'A service with this name already exists. Please choose a different name.'
      );
      (servicesActions.addService as jest.Mock).mockRejectedValueOnce(
        duplicateError
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
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('should clear error when user types in name field', async () => {
      const duplicateError = new Error(
        'A service with this name already exists. Please choose a different name.'
      );
      (servicesActions.addService as jest.Mock).mockRejectedValueOnce(
        duplicateError
      );

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
        expect(toast.error).toHaveBeenCalledWith(
          'Error adding service: Network error'
        );
      });

      // No error alert should be shown in the dialog
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should clear error when dialog is closed', async () => {
      const duplicateError = new Error(
        'A service with this name already exists. Please choose a different name.'
      );
      (servicesActions.addService as jest.Mock).mockRejectedValueOnce(
        duplicateError
      );

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
      const duplicateError = new Error(
        'A service with this name already exists. Please choose a different name.'
      );
      (servicesActions.addService as jest.Mock).mockRejectedValueOnce(
        duplicateError
      );

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
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('should clear error when user types in name field', async () => {
      const duplicateError = new Error(
        'A service with this name already exists. Please choose a different name.'
      );
      (servicesActions.addService as jest.Mock).mockRejectedValueOnce(
        duplicateError
      );

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
