import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { toast } from 'react-hot-toast';
import ServiceList from '@/components/services/ServiceList';
import { editService } from '@/lib/actions/services';
import { Service } from '@/lib/utils/serviceUtils';

// Mock dependencies
jest.mock('react-hot-toast');
jest.mock('@/lib/actions/services');

const mockEditService = editService as jest.MockedFunction<typeof editService>;
const mockToast = toast as jest.Mocked<typeof toast>;

describe('ServiceList', () => {
  const mockSetServices = jest.fn();

  const mockServices: Service[] = [
    {
      id: '1',
      name: 'Hem Pants',
      description: 'Basic hem alteration',
      default_qty: 1,
      default_unit: 'flat_rate',
      default_unit_price_cents: 2500,
      frequently_used: false,
      frequently_used_position: null,
    },
    {
      id: '2',
      name: 'Take In Waist',
      description: 'Waist adjustment',
      default_qty: 1,
      default_unit: 'flat_rate',
      default_unit_price_cents: 3500,
      frequently_used: true,
      frequently_used_position: 1,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('frequently used updates', () => {
    it('should update service state when marking as frequently used', async () => {
      const updatedService = {
        id: '1',
        shop_id: 'shop_123',
        name: 'Hem Pants',
        description: 'Basic hem alteration',
        default_qty: 1,
        default_unit: 'flat_rate',
        default_unit_price_cents: 2500,
        frequently_used: true,
        frequently_used_position: 2,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockEditService.mockResolvedValue(updatedService);

      render(
        <ServiceList services={mockServices} setServices={mockSetServices} />
      );

      // Find and click the menu button for the first service
      const menuButtons = screen.getAllByTestId('MoreVertIcon');
      expect(menuButtons[0]).toBeDefined();
      const menuButton = menuButtons[0]?.closest('button');
      expect(menuButton).not.toBeNull();
      fireEvent.click(menuButton!);

      // Click edit
      const editButton = screen.getByText('Edit service');
      fireEvent.click(editButton);

      // The edit dialog should open
      await waitFor(() => {
        expect(screen.getByText('Edit Service')).toBeInTheDocument();
      });

      // Check the frequently used checkbox
      const checkbox = screen.getByLabelText('Mark as frequently used');
      fireEvent.click(checkbox);

      // Save the changes
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        // Verify that setServices was called with the updated service
        expect(mockSetServices).toHaveBeenCalledWith(expect.any(Function));

        // Get the updater function and test it
        const updaterFn = mockSetServices.mock.calls[0][0];
        const result = updaterFn(mockServices);

        // Verify the service was updated with frequently_used = true
        expect(result[0].frequently_used).toBe(true);
        expect(result[0].frequently_used_position).toBe(2);
        expect(result[1]).toEqual(mockServices[1]); // Other service unchanged
      });

      // Verify success toast
      expect(mockToast.success).toHaveBeenCalledWith(
        'Service updated successfully'
      );
    });

    it('should update service state when unmarking as frequently used', async () => {
      const updatedService = {
        id: '2',
        shop_id: 'shop_123',
        name: 'Take In Waist',
        description: 'Waist adjustment',
        default_qty: 1,
        default_unit: 'flat_rate',
        default_unit_price_cents: 3500,
        frequently_used: false,
        frequently_used_position: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockEditService.mockResolvedValue(updatedService);

      render(
        <ServiceList services={mockServices} setServices={mockSetServices} />
      );

      // Find and click the menu button for the second service (which is frequently used)
      const menuButtons = screen.getAllByTestId('MoreVertIcon');
      expect(menuButtons[1]).toBeDefined();
      const menuButton = menuButtons[1]?.closest('button');
      expect(menuButton).not.toBeNull();
      fireEvent.click(menuButton!);

      // Click edit
      const editButton = screen.getByText('Edit service');
      fireEvent.click(editButton);

      // The edit dialog should open
      await waitFor(() => {
        expect(screen.getByText('Edit Service')).toBeInTheDocument();
      });

      // Uncheck the frequently used checkbox
      const checkbox = screen.getByLabelText('Mark as frequently used');
      expect(checkbox).toBeChecked();
      fireEvent.click(checkbox);

      // Save the changes
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        // Verify that setServices was called with the updated service
        expect(mockSetServices).toHaveBeenCalledWith(expect.any(Function));

        // Get the updater function and test it
        const updaterFn = mockSetServices.mock.calls[0][0];
        const result = updaterFn(mockServices);

        // Verify the service was updated with frequently_used = false
        expect(result[0]).toEqual(mockServices[0]); // First service unchanged
        expect(result[1].frequently_used).toBe(false);
        expect(result[1].frequently_used_position).toBeNull();
      });

      // Verify success toast
      expect(mockToast.success).toHaveBeenCalledWith(
        'Service updated successfully'
      );
    });
  });
});
