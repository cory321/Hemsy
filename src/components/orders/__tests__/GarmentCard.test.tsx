import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import GarmentCard from '../GarmentCard';
import { GarmentDraft } from '@/contexts/OrderFlowContext';

// Mock the formatCurrency function
jest.mock('@/lib/utils/currency', () => ({
  formatCurrency: (amount: number) => `$${amount.toFixed(2)}`,
}));

// Mock the getPresetIconUrl function
jest.mock('@/utils/presetIcons', () => ({
  getPresetIconUrl: (key: string) => {
    const mockUrls: Record<string, string> = {
      'dresses.wedding_dress':
        '/presets/garments/dresses and formal/wedding-dress.svg',
    };
    return mockUrls[key] || '/presets/garments/select-garment.svg';
  },
}));

// Mock InlinePresetSvg component
jest.mock('@/components/ui/InlinePresetSvg', () => {
  return function MockInlinePresetSvg({ src, style }: any) {
    return <div data-testid="inline-preset-svg" data-src={src} style={style} />;
  };
});

describe('GarmentCard', () => {
  const mockOnClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Add Button Card', () => {
    it('renders add button card with select-garment.svg icon', () => {
      render(<GarmentCard isAddButton onClick={mockOnClick} />);

      const addButton = screen.getByText('ADD GARMENT');
      expect(addButton).toBeInTheDocument();

      const icon = screen.getByAltText('Add garment');
      expect(icon).toHaveAttribute(
        'src',
        '/presets/garments/select-garment.svg'
      );
    });

    it('calls onClick when add button is clicked', () => {
      render(<GarmentCard isAddButton onClick={mockOnClick} />);

      const card = screen.getByRole('button');
      fireEvent.click(card);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('has dashed border styling', () => {
      const { container } = render(
        <GarmentCard isAddButton onClick={mockOnClick} />
      );

      const card = container.querySelector('.MuiCard-root');
      expect(card).toHaveStyle({ border: '2px dashed' });
    });
  });

  describe('Garment Card', () => {
    const mockGarment: GarmentDraft = {
      id: 'test-123',
      name: 'Blue Wedding Dress',
      isNameUserEdited: true,
      notes: 'Special instructions',
      dueDate: '2024-03-15',
      specialEvent: true,
      services: [
        {
          id: 'service-1',
          serviceId: 'hemming',
          name: 'Hemming',
          quantity: 2,
          unitPriceCents: 2500,
          unit: 'flat_rate',
        },
        {
          id: 'service-2',
          serviceId: 'alterations',
          name: 'Alterations',
          quantity: 1,
          unitPriceCents: 4500,
          unit: 'flat_rate',
        },
      ],
    };

    it('renders garment with name and services', () => {
      render(
        <GarmentCard garment={mockGarment} onClick={mockOnClick} index={0} />
      );

      expect(screen.getByText('Blue Wedding Dress')).toBeInTheDocument();
      expect(screen.getByText('2 services')).toBeInTheDocument();
      expect(screen.getByText('$95.00')).toBeInTheDocument(); // (2*25 + 1*45)
    });

    it('renders default name when garment name is empty', () => {
      const garmentWithoutName = { ...mockGarment, name: '' };
      render(
        <GarmentCard
          garment={garmentWithoutName}
          onClick={mockOnClick}
          index={2}
        />
      );

      expect(screen.getByText('Garment 3')).toBeInTheDocument();
    });

    it('renders cloudinary image when available', () => {
      const garmentWithImage = {
        ...mockGarment,
        cloudinaryPublicId: 'test-image-id',
        cloudinaryUrl: 'https://example.com/image.jpg',
      };

      render(
        <GarmentCard
          garment={garmentWithImage}
          onClick={mockOnClick}
          index={0}
        />
      );

      const image = screen.getByAltText('Blue Wedding Dress');
      expect(image).toHaveAttribute(
        'src',
        expect.stringContaining('test-image-id')
      );
    });

    it('renders preset icon when available', () => {
      const garmentWithIcon = {
        ...mockGarment,
        presetIconKey: 'dresses.wedding_dress',
        presetFillColor: '#FF0000',
      };

      render(
        <GarmentCard
          garment={garmentWithIcon}
          onClick={mockOnClick}
          index={0}
        />
      );

      const icon = screen.getByTestId('inline-preset-svg');
      expect(icon).toHaveAttribute(
        'data-src',
        '/presets/garments/dresses and formal/wedding-dress.svg'
      );
    });

    it('renders default icon when no image or preset icon', () => {
      render(
        <GarmentCard garment={mockGarment} onClick={mockOnClick} index={0} />
      );

      const icon = screen.getByAltText('Default garment');
      expect(icon).toHaveAttribute(
        'src',
        '/presets/garments/select-garment.svg'
      );
    });

    it('handles click events', () => {
      render(
        <GarmentCard garment={mockGarment} onClick={mockOnClick} index={0} />
      );

      const card = screen.getByRole('button');
      fireEvent.click(card);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('renders correctly with no services', () => {
      const garmentNoServices = { ...mockGarment, services: [] };
      render(
        <GarmentCard
          garment={garmentNoServices}
          onClick={mockOnClick}
          index={0}
        />
      );

      expect(screen.queryByText(/services?/)).not.toBeInTheDocument();
      expect(screen.getByText('$0.00')).toBeInTheDocument();
    });

    it('renders singular service text for one service', () => {
      const garmentOneService = {
        ...mockGarment,
        services: [mockGarment.services[0]!],
      };
      render(
        <GarmentCard
          garment={garmentOneService}
          onClick={mockOnClick}
          index={0}
        />
      );

      expect(screen.getByText('1 service')).toBeInTheDocument();
    });
  });
});
