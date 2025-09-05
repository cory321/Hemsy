import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import GarmentCard from '@/components/garments/GarmentCard';
import { GarmentStage } from '@/types';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock the image components
jest.mock('@/components/ui/SafeCldImage', () => {
  return function MockSafeCldImage({ src, alt }: any) {
    return <img src={src} alt={alt} data-testid="safe-cld-image" />;
  };
});

jest.mock('@/components/ui/InlinePresetSvg', () => {
  return function MockInlinePresetSvg(props: any) {
    return <div data-testid="preset-svg" {...props} />;
  };
});

// Mock the utils
jest.mock('@/utils/displayImage', () => ({
  resolveGarmentDisplayImage: jest.fn((args: any) => {
    if (args?.cloudPublicId) {
      return { kind: 'cloud' };
    }
    if (args?.photoUrl) {
      return { kind: 'photo', src: args.photoUrl };
    }
    if (args?.presetIconKey) {
      return { kind: 'preset', src: args.presetIconKey };
    }
    return { kind: 'none' };
  }),
}));

jest.mock('@/constants/garmentStages', () => ({
  getStageColor: jest.fn(() => '#BD8699'),
}));

const mockPush = jest.fn();
(useRouter as jest.Mock).mockReturnValue({
  push: mockPush,
});

// Helper function to create a base garment
const createMockGarment = (overrides = {}) => ({
  id: 'garment-1',
  name: 'Test Dress',
  client_name: 'Jane Doe',
  stage: 'In Progress' as GarmentStage,
  stage_name: 'In Progress',
  ...overrides,
});

describe('GarmentCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders garment name and client name', () => {
      const garment = createMockGarment();
      render(<GarmentCard garment={garment} orderId="order-1" />);

      expect(screen.getByText('Test Dress')).toBeInTheDocument();
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });

    it('renders without client name when not provided', () => {
      const garment = createMockGarment({ client_name: undefined });
      render(<GarmentCard garment={garment} orderId="order-1" />);

      expect(screen.getByText('Test Dress')).toBeInTheDocument();
      expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();
    });

    it('navigates to garment detail on click', () => {
      const garment = createMockGarment();
      render(<GarmentCard garment={garment} orderId="order-1" />);

      fireEvent.click(
        screen.getByTestId('garment-name').closest('div')!.parentElement!
      );
      expect(mockPush).toHaveBeenCalledWith('/garments/garment-1');
    });
  });

  describe('Due Date States', () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - 3);
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + 5);

    const formatDateForTest = (date: Date) => {
      // Use the same formatting as the app to avoid timezone issues
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    it('shows "Due today" chip for today due date', () => {
      const garment = createMockGarment({
        due_date: formatDateForTest(today),
      });
      render(<GarmentCard garment={garment} orderId="order-1" />);

      expect(screen.getByText('Due today')).toBeInTheDocument();
    });

    it('shows "Due tomorrow" chip for tomorrow due date', () => {
      const garment = createMockGarment({
        due_date: formatDateForTest(tomorrow),
      });
      render(<GarmentCard garment={garment} orderId="order-1" />);

      expect(screen.getByText('Due tomorrow')).toBeInTheDocument();
    });

    it('shows "Due in X days" chip for future dates', () => {
      const garment = createMockGarment({
        due_date: formatDateForTest(futureDate),
      });
      render(<GarmentCard garment={garment} orderId="order-1" />);

      expect(screen.getByText('Due in 5 days')).toBeInTheDocument();
    });

    it('shows overdue chip when past due and services incomplete', () => {
      const garment = createMockGarment({
        due_date: formatDateForTest(pastDate),
        garment_services: [
          { id: 'service-1', is_done: false, is_removed: false },
        ],
      });
      render(<GarmentCard garment={garment} orderId="order-1" />);

      expect(screen.getByText('3 days overdue')).toBeInTheDocument();
    });

    it('shows "Ready for Pickup" with proper styling when past due but all services complete', () => {
      const garment = createMockGarment({
        due_date: formatDateForTest(pastDate),
        garment_services: [
          { id: 'service-1', is_done: true, is_removed: false },
          { id: 'service-2', is_done: true, is_removed: false },
        ],
      });
      render(<GarmentCard garment={garment} orderId="order-1" />);

      const readyChip = screen.getByText('Ready for Pickup');
      expect(readyChip).toBeInTheDocument();

      // Check that the chip has the custom Ready for Pickup stage color
      const chipElement = readyChip.closest('.MuiChip-root');
      expect(chipElement).toHaveStyle('background-color: rgb(189, 134, 153)'); // #BD8699
    });
  });

  describe('Done Stage', () => {
    it('shows "Done" chip with proper styling when garment stage is Done', () => {
      const formatDateForTest = (date: Date) => {
        return date.toISOString().split('T')[0];
      };

      const garment = createMockGarment({
        stage: 'Done' as GarmentStage,
        stage_name: 'Done',
        due_date: formatDateForTest(new Date()),
      });
      render(<GarmentCard garment={garment} orderId="order-1" />);

      const doneChip = screen.getByText('Done');
      expect(doneChip).toBeInTheDocument();

      // Check that the chip has the custom Done stage color
      const chipElement = doneChip.closest('.MuiChip-root');
      expect(chipElement).toHaveStyle('background-color: rgb(195, 179, 209)'); // #c3b3d1
    });

    it('shows "Done" chip even without due date when stage is Done', () => {
      const garment = createMockGarment({
        stage: 'Done' as GarmentStage,
        stage_name: 'Done',
        due_date: undefined,
      });
      render(<GarmentCard garment={garment} orderId="order-1" />);

      expect(screen.getByText('Done')).toBeInTheDocument();
    });

    it('prioritizes "Done" status over due date status', () => {
      const formatDateForTest = (date: Date) => {
        return date.toISOString().split('T')[0];
      };

      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 3);

      const garment = createMockGarment({
        stage: 'Done' as GarmentStage,
        stage_name: 'Done',
        due_date: formatDateForTest(pastDate),
        garment_services: [
          { id: 'service-1', is_done: false, is_removed: false },
        ],
      });
      render(<GarmentCard garment={garment} orderId="order-1" />);

      // Should show "Done" instead of "3 days overdue"
      expect(screen.getByText('Done')).toBeInTheDocument();
      expect(screen.queryByText('3 days overdue')).not.toBeInTheDocument();
    });
  });

  describe('Event Date', () => {
    it('shows event date when provided', () => {
      const eventDate = '2024-12-25';
      const garment = createMockGarment({
        event_date: eventDate,
      });
      render(<GarmentCard garment={garment} orderId="order-1" />);

      expect(screen.getByText(/Event:/)).toBeInTheDocument();
      expect(screen.getByText(/12\/25\/2024/)).toBeInTheDocument();
    });

    it('does not show event date when not provided', () => {
      const garment = createMockGarment();
      render(<GarmentCard garment={garment} orderId="order-1" />);

      expect(screen.queryByText(/Event:/)).not.toBeInTheDocument();
    });
  });

  describe('Service Price', () => {
    it('shows total price when services have prices', () => {
      const garment = createMockGarment({
        services: [
          { quantity: 1, unit_price_cents: 2550 },
          { quantity: 1, unit_price_cents: 1500 },
        ],
      });
      render(<GarmentCard garment={garment} orderId="order-1" />);

      expect(screen.getByText('$40.50')).toBeInTheDocument();
    });

    it('does not show price when total is zero', () => {
      const garment = createMockGarment({
        services: [],
      });
      render(<GarmentCard garment={garment} orderId="order-1" />);

      expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
    });
  });

  describe('Stage Indicator', () => {
    it('shows stage color dot when stage is provided', () => {
      const garment = createMockGarment({
        stage: 'In Progress' as GarmentStage,
        stage_name: 'In Progress',
      });
      render(<GarmentCard garment={garment} orderId="order-1" />);

      // The Tooltip title should make the element accessible by name
      const labeled = screen.getByLabelText('Stage: In Progress');
      expect(labeled).toBeInTheDocument();
    });
  });

  describe('Image Display', () => {
    it('renders cloudinary image when available', () => {
      const garment = createMockGarment({
        image_cloud_id: 'test-cloud-id',
      });
      render(<GarmentCard garment={garment} orderId="order-1" />);

      expect(screen.getByTestId('safe-cld-image')).toBeInTheDocument();
    });

    it('renders preset SVG when preset icon is available', () => {
      const garment = createMockGarment({
        preset_icon_key: 'dress-icon',
        preset_fill_color: '#FF0000',
      });
      render(<GarmentCard garment={garment} orderId="order-1" />);

      expect(screen.getByTestId('preset-svg')).toBeInTheDocument();
    });

    it('renders fallback avatar when no image is available', () => {
      const garment = createMockGarment({
        image_cloud_id: undefined,
        photo_url: undefined,
        preset_icon_key: null,
      });
      render(<GarmentCard garment={garment} orderId="order-1" />);

      // Should show first letter of garment name
      expect(screen.getByText('T')).toBeInTheDocument(); // First letter of "Test Dress"
    });
  });
});
