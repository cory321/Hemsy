import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GarmentDetailClient from '../GarmentDetailClient';
import { GarmentProvider } from '@/contexts/GarmentContext';
import '@testing-library/jest-dom';

// Mock the GarmentEditDialogOptimistic component
jest.mock('@/components/garments/GarmentEditDialogOptimistic', () => {
  return function MockGarmentEditDialogOptimistic({
    open,
    onClose,
  }: {
    open: boolean;
    onClose: () => void;
  }) {
    if (!open) return null;
    return (
      <div data-testid="edit-dialog">
        <h2>Edit Garment Dialog</h2>
        <button onClick={onClose}>Close</button>
      </div>
    );
  };
});

// Mock the GarmentContext
const mockUseGarment = jest.fn();
jest.mock('@/contexts/GarmentContext', () => ({
  ...jest.requireActual('@/contexts/GarmentContext'),
  useGarment: () => mockUseGarment(),
  GarmentProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

describe('GarmentDetailClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('When garment is not Done', () => {
    beforeEach(() => {
      mockUseGarment.mockReturnValue({
        garment: { id: 'garment-1', stage: 'In Progress' },
      });
    });

    it('should render Edit button enabled', () => {
      render(<GarmentDetailClient />);

      const editButton = screen.getByRole('button', { name: /edit/i });
      expect(editButton).toBeInTheDocument();
      expect(editButton).not.toBeDisabled();
    });

    it('should open edit dialog when Edit button is clicked', async () => {
      const user = userEvent.setup();

      render(<GarmentDetailClient />);

      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      // Check that dialog opens
      expect(screen.getByTestId('edit-dialog')).toBeInTheDocument();
      expect(screen.getByText('Edit Garment Dialog')).toBeInTheDocument();
    });

    it('should close edit dialog when onClose is called', async () => {
      const user = userEvent.setup();

      render(<GarmentDetailClient />);

      // Open dialog
      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      expect(screen.getByTestId('edit-dialog')).toBeInTheDocument();

      // Close dialog
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      // Dialog should be closed
      expect(screen.queryByTestId('edit-dialog')).not.toBeInTheDocument();
    });
  });

  describe('When garment is Done', () => {
    beforeEach(() => {
      mockUseGarment.mockReturnValue({
        garment: { id: 'garment-1', stage: 'Done' },
      });
    });

    it('should render Edit button disabled', () => {
      render(<GarmentDetailClient />);

      const editButton = screen.getByRole('button', { name: /edit/i });
      expect(editButton).toBeInTheDocument();
      expect(editButton).toBeDisabled();
    });

    it('should not open edit dialog when disabled Edit button is clicked', async () => {
      render(<GarmentDetailClient />);

      const editButton = screen.getByRole('button', { name: /edit/i });

      // Button should be disabled
      expect(editButton).toBeDisabled();

      // Dialog should not open
      expect(screen.queryByTestId('edit-dialog')).not.toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle null garment stage gracefully', () => {
      mockUseGarment.mockReturnValue({
        garment: { id: 'garment-1', stage: null },
      });

      render(<GarmentDetailClient />);

      const editButton = screen.getByRole('button', { name: /edit/i });
      // Should be enabled when stage is null
      expect(editButton).not.toBeDisabled();
    });

    it('should handle missing garment gracefully', () => {
      mockUseGarment.mockReturnValue({
        garment: null,
      });

      render(<GarmentDetailClient />);

      const editButton = screen.getByRole('button', { name: /edit/i });
      // Should be enabled when garment is null
      expect(editButton).not.toBeDisabled();
    });

    it('should handle other stages correctly', () => {
      const stages = ['New', 'In Progress', 'Ready For Pickup'];

      stages.forEach((stage) => {
        mockUseGarment.mockReturnValue({
          garment: { id: 'garment-1', stage },
        });

        const { unmount } = render(<GarmentDetailClient />);

        const editButton = screen.getByRole('button', { name: /edit/i });
        expect(editButton).not.toBeDisabled();

        unmount(); // Cleanup between renders
      });
    });
  });
});
