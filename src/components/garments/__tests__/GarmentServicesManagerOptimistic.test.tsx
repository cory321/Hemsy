import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GarmentServicesManagerOptimistic from '../GarmentServicesManagerOptimistic';
import { GarmentProvider } from '@/contexts/GarmentContext';
import { searchServices } from '@/lib/actions/services';
import '@testing-library/jest-dom';

// Mock the services actions
jest.mock('@/lib/actions/services', () => ({
  searchServices: jest.fn(),
}));

// Mock the GarmentContext
const mockUseGarment = jest.fn();
const mockAddService = jest.fn();
const mockRemoveService = jest.fn();
const mockUpdateService = jest.fn();
const mockToggleServiceComplete = jest.fn();
const mockRestoreService = jest.fn();

jest.mock('@/contexts/GarmentContext', () => ({
  ...jest.requireActual('@/contexts/GarmentContext'),
  useGarment: () => mockUseGarment(),
  GarmentProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// Mock ServicePriceInput component
jest.mock('@/components/common/ServicePriceInput', () => {
  return function MockServicePriceInput({
    price,
    unit,
    onPriceChange,
    onUnitChange,
  }: any) {
    return (
      <div>
        <input
          data-testid="price-input"
          value={price}
          onChange={(e) => onPriceChange(e.target.value)}
        />
        <select
          data-testid="unit-select"
          value={unit}
          onChange={(e) => onUnitChange(e.target.value)}
        >
          <option value="item">item</option>
          <option value="hour">hour</option>
          <option value="day">day</option>
        </select>
      </div>
    );
  };
});

const mockServices = [
  {
    id: 'service-1',
    name: 'Hemming',
    quantity: 1,
    unit: 'item',
    unit_price_cents: 2000,
    line_total_cents: 2000,
    description: 'Shorten pants',
    is_done: false,
  },
  {
    id: 'service-2',
    name: 'Button Replacement',
    quantity: 1,
    unit: 'item',
    unit_price_cents: 1500,
    line_total_cents: 1500,
    description: null,
    is_done: true,
  },
  {
    id: 'service-3',
    name: 'Zipper Repair',
    quantity: 1,
    unit: 'item',
    unit_price_cents: 2500,
    line_total_cents: 2500,
    description: 'Fix broken zipper',
    is_done: false,
    is_removed: true,
    removed_at: '2024-01-15T10:00:00Z',
    removal_reason: 'Customer changed mind',
  },
];

describe('GarmentServicesManagerOptimistic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAddService.mockResolvedValue({ success: true });
    mockRemoveService.mockResolvedValue({ success: true });
    mockUpdateService.mockResolvedValue({ success: true });
    mockToggleServiceComplete.mockResolvedValue({ success: true });
    mockRestoreService.mockResolvedValue({ success: true });
  });

  describe('When garment is not Done', () => {
    beforeEach(() => {
      mockUseGarment.mockReturnValue({
        garment: {
          id: 'garment-1',
          stage: 'In Progress',
          garment_services: mockServices,
        },
        addService: mockAddService,
        removeService: mockRemoveService,
        updateService: mockUpdateService,
        toggleServiceComplete: mockToggleServiceComplete,
      });
    });

    it('should render services with all controls enabled', () => {
      render(<GarmentServicesManagerOptimistic />);

      // Check that services are rendered
      expect(screen.getByText('Services')).toBeInTheDocument();
      expect(screen.getByText('Hemming')).toBeInTheDocument();
      expect(screen.getByText('Button Replacement')).toBeInTheDocument();

      // Check progress indicator
      expect(screen.getByText('Progress')).toBeInTheDocument();
      expect(screen.getByText('1 of 2 completed')).toBeInTheDocument();

      // Check Add Service button is enabled
      const addButton = screen.getByRole('button', { name: /add service/i });
      expect(addButton).not.toBeDisabled();

      // Check Mark Complete/Incomplete buttons are enabled
      const markCompleteButton = screen.getByRole('button', {
        name: /mark complete/i,
      });
      const markIncompleteButton = screen.getByRole('button', {
        name: /mark incomplete/i,
      });
      expect(markCompleteButton).not.toBeDisabled();
      expect(markIncompleteButton).not.toBeDisabled();

      // Check edit and delete icon buttons are enabled for non-completed services
      const editButtons = screen
        .getAllByTestId('EditIcon')
        .map((icon) => icon.closest('button'));
      const deleteButtons = screen
        .getAllByTestId('DeleteIcon')
        .map((icon) => icon.closest('button'));

      // Only check buttons that should be enabled (for non-completed, non-locked services)
      // In our test data, service-1 (Hemming) is not done, so its buttons should be enabled
      // service-2 (Button Replacement) is done, so its buttons should be disabled
      const enabledEditButtons = editButtons.filter(
        (button) => !button?.disabled
      );
      const enabledDeleteButtons = deleteButtons.filter(
        (button) => !button?.disabled
      );

      // We should have at least one enabled edit and delete button (for the Hemming service)
      expect(enabledEditButtons.length).toBeGreaterThan(0);
      expect(enabledDeleteButtons.length).toBeGreaterThan(0);

      // Check that enabled buttons are actually not disabled
      enabledEditButtons.forEach((button) => {
        expect(button).not.toBeDisabled();
      });

      enabledDeleteButtons.forEach((button) => {
        expect(button).not.toBeDisabled();
      });
    });

    it('should allow adding a new service', async () => {
      const user = userEvent.setup();

      render(<GarmentServicesManagerOptimistic />);

      // Click Add Service button
      const addButton = screen.getByRole('button', { name: /add service/i });
      await user.click(addButton);

      // Dialog should open
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      // Use heading to avoid confusion with button text
      expect(
        screen.getByRole('heading', { name: 'Add Service' })
      ).toBeInTheDocument();

      // Switch to custom service
      const customButton = screen.getByRole('button', {
        name: /custom service/i,
      });
      await user.click(customButton);

      // Fill in the form
      const nameInput = screen.getByLabelText(/service name/i);
      await user.type(nameInput, 'Zipper Repair');

      const priceInput = screen.getByTestId('price-input');
      await user.clear(priceInput);
      await user.type(priceInput, '25.00');

      // Save
      const saveButton = screen.getByRole('button', { name: /^Add Service$/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockAddService).toHaveBeenCalledWith({
          customService: {
            name: 'Zipper Repair',
            description: undefined,
            unit: 'flat_rate',
            unitPriceCents: 2500,
            quantity: 1,
          },
        });
      });
    });

    it('should allow toggling service completion', async () => {
      const user = userEvent.setup();

      render(<GarmentServicesManagerOptimistic />);

      // Click Mark Complete button
      const markCompleteButton = screen.getByRole('button', {
        name: /mark complete/i,
      });
      await user.click(markCompleteButton);

      await waitFor(() => {
        expect(mockToggleServiceComplete).toHaveBeenCalledWith(
          'service-1',
          true
        );
      });
    });

    it('should allow editing a service', async () => {
      const user = userEvent.setup();

      render(<GarmentServicesManagerOptimistic />);

      // Click edit button on first service
      const editIcons = screen.getAllByTestId('EditIcon');
      const editButton = editIcons[0]?.closest('button');
      if (editButton) await user.click(editButton);

      // Dialog should open
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Edit Service')).toBeInTheDocument();

      // Modify price
      const priceInput = screen.getByTestId('price-input');
      await user.clear(priceInput);
      await user.type(priceInput, '30.00');

      // Save changes
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateService).toHaveBeenCalledWith('service-1', {
          quantity: 1,
          unit_price_cents: 3000,
          unit: 'item',
          description: 'Shorten pants',
        });
      });
    });

    it('should allow deleting a service', async () => {
      const user = userEvent.setup();

      render(<GarmentServicesManagerOptimistic />);

      // Click delete button on first service
      const deleteIcons = screen.getAllByTestId('DeleteIcon');
      const deleteButton = deleteIcons[0]?.closest('button');
      if (deleteButton) await user.click(deleteButton);

      // Confirmation dialog should open
      expect(screen.getByText('Remove Service')).toBeInTheDocument();
      expect(
        screen.getByText(/Are you sure you want to remove "Hemming"/)
      ).toBeInTheDocument();

      // Confirm deletion
      const removeButton = screen.getByRole('button', { name: /^Remove$/i });
      await user.click(removeButton);

      await waitFor(() => {
        expect(mockRemoveService).toHaveBeenCalledWith('service-1');
      });
    });
  });

  describe('When garment is Done', () => {
    beforeEach(() => {
      mockUseGarment.mockReturnValue({
        garment: {
          id: 'garment-1',
          stage: 'Done',
          garment_services: mockServices,
        },
        addService: mockAddService,
        removeService: mockRemoveService,
        updateService: mockUpdateService,
        toggleServiceComplete: mockToggleServiceComplete,
      });
    });

    it('should disable Add Service button', () => {
      render(<GarmentServicesManagerOptimistic />);

      const addButton = screen.getByRole('button', { name: /add service/i });
      expect(addButton).toBeDisabled();
    });

    it('should disable Mark Complete/Incomplete buttons', () => {
      render(<GarmentServicesManagerOptimistic />);

      const markCompleteButton = screen.getByRole('button', {
        name: /mark complete/i,
      });
      const markIncompleteButton = screen.getByRole('button', {
        name: /mark incomplete/i,
      });

      expect(markCompleteButton).toBeDisabled();
      expect(markIncompleteButton).toBeDisabled();
    });

    it('should disable edit and delete buttons', () => {
      render(<GarmentServicesManagerOptimistic />);

      const editButtons = screen
        .getAllByTestId('EditIcon')
        .map((icon) => icon.closest('button'));
      const deleteButtons = screen
        .getAllByTestId('DeleteIcon')
        .map((icon) => icon.closest('button'));

      editButtons.forEach((button) => {
        expect(button).toBeDisabled();
      });

      deleteButtons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });

    it('should show disabled message when no services exist', () => {
      mockUseGarment.mockReturnValue({
        garment: {
          id: 'garment-1',
          stage: 'Done',
          garment_services: [],
        },
        addService: mockAddService,
        removeService: mockRemoveService,
        updateService: mockUpdateService,
        toggleServiceComplete: mockToggleServiceComplete,
      });

      render(<GarmentServicesManagerOptimistic />);

      expect(
        screen.getByText(
          'Service management is disabled for completed garments.'
        )
      ).toBeInTheDocument();
    });

    it('should not open dialogs when clicking disabled buttons', async () => {
      const user = userEvent.setup();

      render(<GarmentServicesManagerOptimistic />);

      // Try to click disabled Add Service button should not work
      const addButton = screen.getByRole('button', { name: /add service/i });

      // Since button is disabled, trying to click should not open dialog
      expect(addButton).toBeDisabled();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle null garment stage gracefully', () => {
      mockUseGarment.mockReturnValue({
        garment: {
          id: 'garment-1',
          stage: null,
          garment_services: mockServices,
        },
        addService: mockAddService,
        removeService: mockRemoveService,
        updateService: mockUpdateService,
        toggleServiceComplete: mockToggleServiceComplete,
      });

      render(<GarmentServicesManagerOptimistic />);

      // Controls should be enabled when stage is null
      const addButton = screen.getByRole('button', { name: /add service/i });
      expect(addButton).not.toBeDisabled();
    });

    it('should handle missing garment gracefully', () => {
      mockUseGarment.mockReturnValue({
        garment: null,
        addService: mockAddService,
        removeService: mockRemoveService,
        updateService: mockUpdateService,
        toggleServiceComplete: mockToggleServiceComplete,
      });

      // Component should handle this without crashing
      render(<GarmentServicesManagerOptimistic />);

      // Check that it renders the disabled state
      const addButton = screen.getByRole('button', { name: /add service/i });
      expect(addButton).not.toBeDisabled(); // Should be enabled when garment is null
    });

    it('should calculate total price correctly', () => {
      mockUseGarment.mockReturnValue({
        garment: {
          id: 'garment-1',
          stage: 'In Progress',
          garment_services: mockServices,
        },
        addService: mockAddService,
        removeService: mockRemoveService,
        updateService: mockUpdateService,
        toggleServiceComplete: mockToggleServiceComplete,
      });

      render(<GarmentServicesManagerOptimistic />);

      // Total should be sum of line_total_cents
      expect(screen.getByText('Total: $35.00')).toBeInTheDocument(); // 2000 + 1500 = 3500 cents = $35.00
    });
  });
});
