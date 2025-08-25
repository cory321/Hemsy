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
};

const mockGarmentContext = {
  garment: mockGarment,
  updateGarmentIcon: jest.fn(),
  updateGarmentPhoto: jest.fn(),
  deleteGarmentPhoto: jest.fn(),
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
      fireEvent.click(uploadButtons[0], { force: true });

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
      fireEvent.click(uploadButtons[0]);
      expect(mockOpen).toHaveBeenCalled();
    });
  });
});
