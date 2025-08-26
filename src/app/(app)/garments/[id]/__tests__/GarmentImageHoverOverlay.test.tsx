import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import GarmentImageHoverOverlay from '../GarmentImageHoverOverlay';
import { useGarment } from '@/contexts/GarmentContext';

// Mock the GarmentContext
jest.mock('@/contexts/GarmentContext');
const mockUseGarment = useGarment as jest.MockedFunction<typeof useGarment>;

// Mock next-cloudinary with a variable mock
let mockOpen: jest.Mock | undefined;

jest.mock('next-cloudinary', () => ({
  CldUploadWidget: ({
    children,
  }: {
    children: (props: any) => React.ReactNode;
  }) => {
    return children({ open: mockOpen });
  },
}));

const theme = createTheme();

const mockGarment = {
  id: 'test-garment-id',
  name: 'Test Garment',
  preset_icon_key: 'test-icon',
  preset_fill_color: '#000000',
  due_date: '2024-12-31',
  event_date: null,
  preset_outline_color: '#000000',
  notes: null,
  stage: 'Measuring',
  measurements: null,
  photo_url: null,
  image_cloud_id: null,
  is_removed: false,
  shop_id: 'test-shop',
  order_id: 'test-order',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  garment_services: [],
  totalPriceCents: 0,
};

const mockGarmentContext = {
  garment: mockGarment,
  updateGarmentOptimistic: jest.fn(),
  updateGarmentIcon: jest.fn(),
  updateGarmentPhoto: jest.fn(),
  deleteGarmentPhoto: jest.fn(),
  addService: jest.fn(),
  removeService: jest.fn(),
  restoreService: jest.fn(),
  updateService: jest.fn(),
  toggleServiceComplete: jest.fn(),
  markAsPickedUp: jest.fn(),
  refreshGarment: jest.fn(),
  refreshHistory: jest.fn(),
  historyKey: 0,
  optimisticHistoryEntry: null,
  historyRefreshSignal: 0,
};

describe('GarmentImageHoverOverlay', () => {
  beforeEach(() => {
    mockUseGarment.mockReturnValue(mockGarmentContext);
    jest.clearAllMocks();
    mockOpen = undefined; // Reset to undefined for each test
  });

  it('should handle undefined open function gracefully', async () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    mockOpen = undefined; // Explicitly set to undefined

    const { container } = render(
      <ThemeProvider theme={theme}>
        <GarmentImageHoverOverlay imageType="icon">
          <div>Test Child</div>
        </GarmentImageHoverOverlay>
      </ThemeProvider>
    );

    // Trigger hover to show the overlay
    const overlay = container.firstChild as HTMLElement;
    fireEvent.mouseEnter(overlay);

    await waitFor(() => {
      // Find the upload photo button (should be disabled when open is undefined)
      const uploadButtons = screen.getAllByLabelText(
        /Upload Photo|Update Photo/
      );
      expect(uploadButtons.length).toBeGreaterThan(0);

      // The button should be disabled when open is undefined
      uploadButtons.forEach((button) => {
        expect(button).toBeDisabled();
      });

      // Try clicking the button - should not crash
      // Since the button is disabled, we need to force the click event
      const firstButton = uploadButtons[0];
      if (firstButton) {
        fireEvent.click(firstButton, { force: true });
      }

      // The button being disabled is the correct behavior when open is undefined
      // We can verify this by checking the disabled state
      expect(uploadButtons[0]).toBeDisabled();
    });

    consoleSpy.mockRestore();
  });

  it('should work normally when open function is available', async () => {
    mockOpen = jest.fn(); // Set to a mock function

    const { container } = render(
      <ThemeProvider theme={theme}>
        <GarmentImageHoverOverlay imageType="icon">
          <div>Test Child</div>
        </GarmentImageHoverOverlay>
      </ThemeProvider>
    );

    // Trigger hover to show the overlay
    const overlay = container.firstChild as HTMLElement;
    fireEvent.mouseEnter(overlay);

    await waitFor(() => {
      const uploadButtons = screen.getAllByLabelText(
        /Upload Photo|Update Photo/
      );

      // The button should not be disabled when open is available
      uploadButtons.forEach((button) => {
        expect(button).not.toBeDisabled();
      });

      // Click should call the open function
      const firstButton = uploadButtons[0];
      if (firstButton) {
        fireEvent.click(firstButton);
        expect(mockOpen).toHaveBeenCalled();
      }
    });
  });
});
