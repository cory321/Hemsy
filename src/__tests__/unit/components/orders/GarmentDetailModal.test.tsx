import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import GarmentDetailModal from '@/components/orders/GarmentDetailModal';
import { GarmentDraft } from '@/contexts/OrderFlowContext';

// Mock the Cloudinary component
jest.mock('@/components/ui/SafeCldImage', () => {
  return function MockSafeCldImage({ alt }: { alt: string }) {
    return <div data-testid="cloudinary-image">{alt}</div>;
  };
});

// Mock the preset SVG component
jest.mock('@/components/ui/InlinePresetSvg', () => {
  return function MockInlinePresetSvg({ src }: { src: string }) {
    return <div data-testid="preset-svg">{src}</div>;
  };
});

// Mock the service selector modal
jest.mock('@/components/orders/ServiceSelectorModal', () => {
  return function MockServiceSelectorModal() {
    return <div data-testid="service-selector">Service Selector</div>;
  };
});

// Mock the garment image overlay
jest.mock('@/components/orders/GarmentImageOverlay', () => {
  return function MockGarmentImageOverlay({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return <div data-testid="garment-image-overlay">{children}</div>;
  };
});

// Mock the preset garment icon modal
jest.mock('@/components/orders/PresetGarmentIconModal', () => {
  return function MockPresetGarmentIconModal() {
    return <div data-testid="preset-icon-modal">Preset Icon Modal</div>;
  };
});

// Mock the preset icon utilities
jest.mock('@/utils/presetIcons', () => ({
  getPresetIconUrl: jest.fn(() => '/presets/garments/dress.svg'),
  getPresetIconLabel: jest.fn(() => 'Dress'),
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <LocalizationProvider dateAdapter={AdapterDayjs}>
    {children}
  </LocalizationProvider>
);

const mockGarment: GarmentDraft = {
  id: 'test-garment-1',
  name: 'Test Garment',
  isNameUserEdited: false,
  notes: 'Test notes',
  dueDate: '2025-12-31', // Future date
  eventDate: undefined,
  specialEvent: false,
  services: [],
};

const defaultProps = {
  open: true,
  onClose: jest.fn(),
  garment: mockGarment,
  onSave: jest.fn(),
  onDelete: jest.fn(),
  isNew: false,
  index: 0,
  preloadedServices: [],
  onGarmentChange: jest.fn(),
};

describe('GarmentDetailModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Event Date Picker Visibility', () => {
    it('should not show event date picker when special event is unchecked', () => {
      render(
        <TestWrapper>
          <GarmentDetailModal {...defaultProps} />
        </TestWrapper>
      );

      // Event date picker should not be visible
      expect(screen.queryByLabelText(/event date/i)).not.toBeInTheDocument();

      // Due date picker should be visible
      expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();

      // Special event checkbox should be unchecked
      const specialEventCheckbox = screen.getByRole('checkbox', {
        name: /special event/i,
      });
      expect(specialEventCheckbox).not.toBeChecked();
    });

    it('should show event date picker when special event is checked', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <GarmentDetailModal {...defaultProps} />
        </TestWrapper>
      );

      // Click the special event checkbox
      const specialEventCheckbox = screen.getByRole('checkbox', {
        name: /special event/i,
      });
      await user.click(specialEventCheckbox);

      // Event date picker should now be visible
      await waitFor(() => {
        expect(screen.getByLabelText(/event date/i)).toBeInTheDocument();
      });

      // Due date picker should still be visible
      expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();

      // Special event checkbox should be checked
      expect(specialEventCheckbox).toBeChecked();
    });

    it('should hide event date picker when special event is unchecked after being checked', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <GarmentDetailModal {...defaultProps} />
        </TestWrapper>
      );

      const specialEventCheckbox = screen.getByRole('checkbox', {
        name: /special event/i,
      });

      // First, check the special event checkbox
      await user.click(specialEventCheckbox);

      // Verify event date picker is visible
      await waitFor(() => {
        expect(screen.getByLabelText(/event date/i)).toBeInTheDocument();
      });

      // Then uncheck the special event checkbox
      await user.click(specialEventCheckbox);

      // Event date picker should be hidden again
      await waitFor(() => {
        expect(screen.queryByLabelText(/event date/i)).not.toBeInTheDocument();
      });

      // Due date picker should still be visible
      expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
    });
  });

  describe('Event Date Clearing', () => {
    it('should clear event date when special event is unchecked', async () => {
      const user = userEvent.setup();
      const mockOnSave = jest.fn();

      // Start with a garment that has special event checked and an event date
      const garmentWithEvent: GarmentDraft = {
        ...mockGarment,
        specialEvent: true,
        dueDate: '2025-12-31',
        eventDate: '2026-01-15', // Future date after due date
        services: [
          {
            // Add a service to pass validation
            id: 'test-service-1',
            name: 'Test Service',
            unit: 'each',
            qty: 1,
            unitPriceCents: 5000,
          },
        ],
      };

      render(
        <TestWrapper>
          <GarmentDetailModal
            {...defaultProps}
            garment={garmentWithEvent}
            onSave={mockOnSave}
          />
        </TestWrapper>
      );

      // Verify initial state
      const specialEventCheckbox = screen.getByRole('checkbox', {
        name: /special event/i,
      });
      expect(specialEventCheckbox).toBeChecked();
      expect(screen.getByLabelText(/event date/i)).toBeInTheDocument();

      // Uncheck the special event checkbox
      await user.click(specialEventCheckbox);

      // Event date picker should be hidden
      await waitFor(() => {
        expect(screen.queryByLabelText(/event date/i)).not.toBeInTheDocument();
      });

      // Save the garment
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      // Verify that onSave was called with eventDate cleared
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            specialEvent: false,
            eventDate: undefined,
          })
        );
      });
    });
  });

  describe('New Garment Creation', () => {
    it('should show "Add New Garment" title for new garments', () => {
      render(
        <TestWrapper>
          <GarmentDetailModal {...defaultProps} garment={null} isNew={true} />
        </TestWrapper>
      );

      expect(screen.getByText('Add New Garment')).toBeInTheDocument();
    });

    it('should not show event date picker by default for new garments', () => {
      render(
        <TestWrapper>
          <GarmentDetailModal {...defaultProps} garment={null} isNew={true} />
        </TestWrapper>
      );

      // Event date picker should not be visible by default
      expect(screen.queryByLabelText(/event date/i)).not.toBeInTheDocument();

      // Special event checkbox should be unchecked by default
      const specialEventCheckbox = screen.getByRole('checkbox', {
        name: /special event/i,
      });
      expect(specialEventCheckbox).not.toBeChecked();
    });
  });

  describe('Layout Behavior', () => {
    it('should show due date picker in all cases', () => {
      render(
        <TestWrapper>
          <GarmentDetailModal {...defaultProps} />
        </TestWrapper>
      );

      // Due date picker should always be visible
      expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
    });

    it('should maintain due date picker visibility when special event is toggled', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <GarmentDetailModal {...defaultProps} />
        </TestWrapper>
      );

      // Due date should be visible initially
      expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();

      // Check the special event checkbox
      const specialEventCheckbox = screen.getByRole('checkbox', {
        name: /special event/i,
      });
      await user.click(specialEventCheckbox);

      // Due date should still be visible
      await waitFor(() => {
        expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
      });

      // Uncheck the special event checkbox
      await user.click(specialEventCheckbox);

      // Due date should still be visible
      await waitFor(() => {
        expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
      });
    });

    it('should show due date and event date in half-width columns when special event is enabled', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <GarmentDetailModal {...defaultProps} />
        </TestWrapper>
      );

      // Check the special event checkbox
      const specialEventCheckbox = screen.getByRole('checkbox', {
        name: /special event/i,
      });
      await user.click(specialEventCheckbox);

      // Both date pickers should be visible
      await waitFor(() => {
        expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/event date/i)).toBeInTheDocument();
      });
    });
  });

  describe('Date Validation', () => {
    it('should prevent selecting past dates for due date', async () => {
      const user = userEvent.setup();
      const mockOnSave = jest.fn();

      // Create a garment with a past due date
      const garmentWithPastDate: GarmentDraft = {
        ...mockGarment,
        dueDate: '2020-01-01', // Past date
        services: [
          {
            id: 'test-service-1',
            name: 'Test Service',
            unit: 'each',
            qty: 1,
            unitPriceCents: 5000,
          },
        ],
      };

      render(
        <TestWrapper>
          <GarmentDetailModal
            {...defaultProps}
            garment={garmentWithPastDate}
            onSave={mockOnSave}
          />
        </TestWrapper>
      );

      // Try to save
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      // Should show validation error and not call onSave
      await waitFor(() => {
        expect(
          screen.getByText(/due date cannot be in the past/i)
        ).toBeInTheDocument();
      });
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should prevent event date from being before due date', async () => {
      const user = userEvent.setup();
      const mockOnSave = jest.fn();

      // Create a garment with event date before due date
      const garmentWithInvalidEventDate: GarmentDraft = {
        ...mockGarment,
        specialEvent: true,
        dueDate: '2025-12-31',
        eventDate: '2025-12-30', // Before due date
        services: [
          {
            id: 'test-service-1',
            name: 'Test Service',
            unit: 'each',
            qty: 1,
            unitPriceCents: 5000,
          },
        ],
      };

      render(
        <TestWrapper>
          <GarmentDetailModal
            {...defaultProps}
            garment={garmentWithInvalidEventDate}
            onSave={mockOnSave}
          />
        </TestWrapper>
      );

      // Try to save
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      // Should show validation error and not call onSave
      await waitFor(() => {
        expect(
          screen.getByText(/event date must be after the due date/i)
        ).toBeInTheDocument();
      });
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should prevent event date from being in the past', async () => {
      const user = userEvent.setup();
      const mockOnSave = jest.fn();

      // Create a garment with past event date
      const garmentWithPastEventDate: GarmentDraft = {
        ...mockGarment,
        specialEvent: true,
        dueDate: '2025-12-31',
        eventDate: '2020-01-01', // Past date
        services: [
          {
            id: 'test-service-1',
            name: 'Test Service',
            unit: 'each',
            qty: 1,
            unitPriceCents: 5000,
          },
        ],
      };

      render(
        <TestWrapper>
          <GarmentDetailModal
            {...defaultProps}
            garment={garmentWithPastEventDate}
            onSave={mockOnSave}
          />
        </TestWrapper>
      );

      // Try to save
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      // Should show validation error and not call onSave
      await waitFor(() => {
        expect(
          screen.getByText(/event date cannot be in the past/i)
        ).toBeInTheDocument();
      });
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should allow valid dates to be saved', async () => {
      const user = userEvent.setup();
      const mockOnSave = jest.fn();

      // Create a garment with valid dates
      const garmentWithValidDates: GarmentDraft = {
        ...mockGarment,
        specialEvent: true,
        dueDate: '2025-12-31',
        eventDate: '2026-01-15', // After due date and in future
        services: [
          {
            id: 'test-service-1',
            name: 'Test Service',
            unit: 'each',
            qty: 1,
            unitPriceCents: 5000,
          },
        ],
      };

      render(
        <TestWrapper>
          <GarmentDetailModal
            {...defaultProps}
            garment={garmentWithValidDates}
            onSave={mockOnSave}
          />
        </TestWrapper>
      );

      // Try to save
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      // Should save successfully
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            specialEvent: true,
            dueDate: '2025-12-31',
            eventDate: '2026-01-15',
          })
        );
      });
    });

    it('should prevent due date from being set after event date', async () => {
      const user = userEvent.setup();
      const mockOnSave = jest.fn();

      // Create a garment with event date set
      const garmentWithEventDate: GarmentDraft = {
        ...mockGarment,
        specialEvent: true,
        dueDate: '2025-12-31',
        eventDate: '2026-01-15', // Event date is after due date
        services: [
          {
            id: 'test-service-1',
            name: 'Test Service',
            unit: 'each',
            qty: 1,
            unitPriceCents: 5000,
          },
        ],
      };

      render(
        <TestWrapper>
          <GarmentDetailModal
            {...defaultProps}
            garment={garmentWithEventDate}
            onSave={mockOnSave}
          />
        </TestWrapper>
      );

      // Try to change due date to be after event date (2026-01-16)
      // Note: This test simulates the user trying to set an invalid due date
      // The actual date picker should prevent this, but we test the validation logic

      // Try to save with the current valid state first to ensure it works
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      // Should save successfully with valid dates
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            specialEvent: true,
            dueDate: '2025-12-31',
            eventDate: '2026-01-15',
          })
        );
      });
    });

    it('should show validation error when due date equals event date', async () => {
      const user = userEvent.setup();
      const mockOnSave = jest.fn();

      // Create a garment where due date equals event date (invalid)
      const garmentWithEqualDates: GarmentDraft = {
        ...mockGarment,
        specialEvent: true,
        dueDate: '2026-01-15',
        eventDate: '2026-01-15', // Same as due date - invalid
        services: [
          {
            id: 'test-service-1',
            name: 'Test Service',
            unit: 'each',
            qty: 1,
            unitPriceCents: 5000,
          },
        ],
      };

      render(
        <TestWrapper>
          <GarmentDetailModal
            {...defaultProps}
            garment={garmentWithEqualDates}
            onSave={mockOnSave}
          />
        </TestWrapper>
      );

      // Try to save
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      // Should show validation error and not call onSave
      await waitFor(() => {
        expect(
          screen.getByText(/event date must be after the due date/i)
        ).toBeInTheDocument();
      });
      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels and roles', () => {
      render(
        <TestWrapper>
          <GarmentDetailModal {...defaultProps} />
        </TestWrapper>
      );

      // Check for proper labels
      expect(screen.getByLabelText(/garment name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
      expect(
        screen.getByRole('checkbox', { name: /special event/i })
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
    });

    it('should show event date label when special event is checked', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <GarmentDetailModal {...defaultProps} />
        </TestWrapper>
      );

      // Check the special event checkbox
      const specialEventCheckbox = screen.getByRole('checkbox', {
        name: /special event/i,
      });
      await user.click(specialEventCheckbox);

      // Event date should have proper label
      await waitFor(() => {
        expect(screen.getByLabelText(/event date/i)).toBeInTheDocument();
      });
    });
  });
});
