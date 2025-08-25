import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GarmentServicesManager from '../GarmentServicesManager';
import { toggleServiceCompletion } from '@/lib/actions/garment-services';
import { useRouter } from 'next/navigation';

// Mock dependencies
jest.mock('@/lib/actions/garment-services');
jest.mock('@/lib/actions/garments');
jest.mock('@/lib/actions/services');
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const mockRouter = {
  refresh: jest.fn(),
};

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
    quantity: 4,
    unit: 'item',
    unit_price_cents: 500,
    line_total_cents: 2000,
    description: null,
    is_done: true,
  },
  {
    id: 'service-3',
    name: 'Zipper Repair',
    quantity: 1,
    unit: 'item',
    unit_price_cents: 3000,
    line_total_cents: 3000,
    description: null,
    is_done: false,
  },
];

describe('GarmentServicesManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it('should render services with progress indicator', () => {
    render(
      <GarmentServicesManager
        garmentId="garment-123"
        services={mockServices}
        onServiceChange={jest.fn()}
      />
    );

    // Check progress indicator
    expect(screen.getByText('Progress')).toBeInTheDocument();
    expect(screen.getByText('1 of 3 completed')).toBeInTheDocument();

    // Check service items
    expect(screen.getByText('Hemming')).toBeInTheDocument();
    expect(screen.getByText('Button Replacement')).toBeInTheDocument();
    expect(screen.getByText('Zipper Repair')).toBeInTheDocument();

    // Check completed service has the completed chip
    const completedChips = screen.getAllByText('Completed');
    expect(completedChips).toHaveLength(1);
  });

  it('should display correct completion buttons based on service status', () => {
    render(
      <GarmentServicesManager
        garmentId="garment-123"
        services={mockServices}
        onServiceChange={jest.fn()}
      />
    );

    // Check for incomplete services having "Mark Complete" button
    const markCompleteButtons = screen.getAllByText('Mark Complete');
    expect(markCompleteButtons).toHaveLength(2); // Hemming and Zipper Repair

    // Check for completed service having "Mark Incomplete" button
    const markIncompleteButtons = screen.getAllByText('Mark Incomplete');
    expect(markIncompleteButtons).toHaveLength(1); // Button Replacement
  });

  it('should toggle service completion when button is clicked', async () => {
    const mockOnServiceChange = jest.fn();
    (toggleServiceCompletion as jest.Mock).mockResolvedValue({
      success: true,
      updatedStage: 'In Progress',
    });

    render(
      <GarmentServicesManager
        garmentId="garment-123"
        services={mockServices}
        onServiceChange={mockOnServiceChange}
      />
    );

    // Click the first "Mark Complete" button
    const markCompleteButtons = screen.getAllByText('Mark Complete');
    await userEvent.click(markCompleteButtons[0]!);

    await waitFor(() => {
      expect(toggleServiceCompletion).toHaveBeenCalledWith({
        garmentServiceId: 'service-1',
        isDone: true,
      });
      expect(mockRouter.refresh).toHaveBeenCalled();
      expect(mockOnServiceChange).toHaveBeenCalled();
    });
  });

  it('should toggle service incompletion when button is clicked', async () => {
    const mockOnServiceChange = jest.fn();
    (toggleServiceCompletion as jest.Mock).mockResolvedValue({
      success: true,
      updatedStage: 'In Progress',
    });

    render(
      <GarmentServicesManager
        garmentId="garment-123"
        services={mockServices}
        onServiceChange={mockOnServiceChange}
      />
    );

    // Click the "Mark Incomplete" button
    const markIncompleteButton = screen.getByText('Mark Incomplete');
    await userEvent.click(markIncompleteButton);

    await waitFor(() => {
      expect(toggleServiceCompletion).toHaveBeenCalledWith({
        garmentServiceId: 'service-2',
        isDone: false,
      });
      expect(mockRouter.refresh).toHaveBeenCalled();
      expect(mockOnServiceChange).toHaveBeenCalled();
    });
  });

  it('should show error message when toggle fails', async () => {
    (toggleServiceCompletion as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Failed to update service completion',
    });

    render(
      <GarmentServicesManager
        garmentId="garment-123"
        services={mockServices}
        onServiceChange={jest.fn()}
      />
    );

    // Click a "Mark Complete" button
    const markCompleteButtons = screen.getAllByText('Mark Complete');
    await userEvent.click(markCompleteButtons[0]!);

    await waitFor(() => {
      expect(
        screen.getByText('Failed to update service completion')
      ).toBeInTheDocument();
    });
  });

  it('should calculate and display correct progress percentage', () => {
    render(
      <GarmentServicesManager
        garmentId="garment-123"
        services={mockServices}
        onServiceChange={jest.fn()}
      />
    );

    // Progress should be rounded in aria-valuenow (MUI rounds the value)
    const progressBar = screen.getByRole('progressbar');
    const completedCount = mockServices.filter((s) => s.is_done).length;
    const totalCount = mockServices.length;
    const expectedRounded = Math.round((completedCount / totalCount) * 100);
    expect(progressBar).toHaveAttribute(
      'aria-valuenow',
      String(expectedRounded)
    );
  });

  it('should apply visual styling to completed services', () => {
    const { container } = render(
      <GarmentServicesManager
        garmentId="garment-123"
        services={mockServices}
        onServiceChange={jest.fn()}
      />
    );

    // Find the completed service list item
    const listItems = container.querySelectorAll('.MuiListItem-root');
    const completedServiceItem = Array.from(listItems).find((item) =>
      item.textContent?.includes('Button Replacement')
    );

    // Check for reduced opacity styling
    expect(completedServiceItem).toHaveStyle({ opacity: '0.6' });
  });

  it('should display total price correctly', () => {
    render(
      <GarmentServicesManager
        garmentId="garment-123"
        services={mockServices}
        onServiceChange={jest.fn()}
      />
    );

    // Total should be $70.00 (20 + 20 + 30)
    expect(screen.getByText('Total: $70.00')).toBeInTheDocument();
  });

  it('should not show progress indicator when no services exist', () => {
    render(
      <GarmentServicesManager
        garmentId="garment-123"
        services={[]}
        onServiceChange={jest.fn()}
      />
    );

    expect(screen.queryByText('Progress')).not.toBeInTheDocument();
    expect(screen.getByText('No services added')).toBeInTheDocument();
  });

  it('should show 100% progress when all services are completed', () => {
    const allCompletedServices = mockServices.map((service) => ({
      ...service,
      is_done: true,
    }));

    render(
      <GarmentServicesManager
        garmentId="garment-123"
        services={allCompletedServices}
        onServiceChange={jest.fn()}
      />
    );

    expect(screen.getByText('3 of 3 completed')).toBeInTheDocument();
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '100');
  });

  it('should show check icon for completed services', () => {
    render(
      <GarmentServicesManager
        garmentId="garment-123"
        services={mockServices}
        onServiceChange={jest.fn()}
      />
    );

    // There should be one CheckCircleIcon for the completed service
    const checkIcons = screen.getAllByTestId('CheckCircleIcon');
    // Note: There might be multiple due to buttons and list items
    expect(checkIcons.length).toBeGreaterThan(0);
  });

  it('excludes soft-deleted services from total price calculation', () => {
    const servicesWithSoftDeleted = [
      ...mockServices,
      {
        id: 'service-4',
        name: 'Soft Deleted Service',
        quantity: 1,
        unit: 'item',
        unit_price_cents: 1000,
        line_total_cents: 1000,
        description: null,
        is_done: false,
        is_removed: true,
        removed_at: '2024-01-01T00:00:00Z',
        removal_reason: 'Test removal',
      },
    ];

    render(
      <GarmentServicesManager
        garmentId="garment-123"
        services={servicesWithSoftDeleted}
        onServiceChange={jest.fn()}
      />
    );

    // Total should only include active services: $20.00 + $20.00 + $30.00 = $70.00
    // Should NOT include the soft-deleted service ($10.00)
    expect(screen.getByText('Total: $70.00')).toBeInTheDocument();

    // Verify the soft-deleted service is not included in the total
    expect(screen.queryByText('Total: $80.00')).not.toBeInTheDocument();
  });

  it('shows $0.00 total when all services are soft-deleted', () => {
    const allSoftDeletedServices = [
      {
        id: 'service-1',
        name: 'Soft Deleted Service 1',
        quantity: 1,
        unit: 'item',
        unit_price_cents: 2000,
        line_total_cents: 2000,
        description: null,
        is_done: false,
        is_removed: true,
        removed_at: '2024-01-01T00:00:00Z',
        removal_reason: 'Test removal',
      },
      {
        id: 'service-2',
        name: 'Soft Deleted Service 2',
        quantity: 1,
        unit: 'item',
        unit_price_cents: 3000,
        line_total_cents: 3000,
        description: null,
        is_done: true,
        is_removed: true,
        removed_at: '2024-01-01T00:00:00Z',
        removal_reason: 'Test removal',
      },
    ];

    render(
      <GarmentServicesManager
        garmentId="garment-123"
        services={allSoftDeletedServices}
        onServiceChange={jest.fn()}
      />
    );

    // Total should be $0.00 since all services are soft-deleted
    expect(screen.getByText('Total: $0.00')).toBeInTheDocument();

    // Progress indicator should not be shown when there are no active services
    expect(screen.queryByText('0%')).not.toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});
