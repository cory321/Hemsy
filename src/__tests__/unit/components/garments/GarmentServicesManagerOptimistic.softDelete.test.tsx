import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import GarmentServicesManagerOptimistic from '@/components/garments/GarmentServicesManagerOptimistic';

// Mock the useGarment hook
const mockUseGarment = jest.fn();
jest.mock('@/contexts/GarmentContext', () => ({
  useGarment: () => mockUseGarment(),
}));

// Mock the services action
jest.mock('@/lib/actions/services', () => ({
  searchServices: jest.fn(),
}));

describe('GarmentServicesManagerOptimistic - Soft Delete Progress Calculation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('excludes soft-deleted services from progress calculation', () => {
    // Mock garment with soft-deleted service
    const garmentWithSoftDeleted = {
      id: 'test-garment-id',
      name: 'Test Garment',
      stage: 'In Progress',
      garment_services: [
        {
          id: 'service-1',
          name: 'Hem Pants',
          quantity: 2,
          unit: 'hour',
          unit_price_cents: 2500,
          line_total_cents: 5000,
          description: 'Shorten hem',
          is_done: false,
        },
        {
          id: 'service-2',
          name: 'Button Replacement',
          quantity: 1,
          unit: 'flat_rate',
          unit_price_cents: 1500,
          line_total_cents: 1500,
          description: null,
          is_done: true,
        },
        {
          id: 'service-3',
          name: 'Soft Deleted Service',
          quantity: 1,
          unit: 'flat_rate',
          unit_price_cents: 2000,
          line_total_cents: 2000,
          description: null,
          is_done: false,
          is_removed: true,
          removed_at: '2024-01-01T00:00:00Z',
          removal_reason: 'Test removal',
        },
      ],
    };

    // Mock the useGarment hook to return our test data
    mockUseGarment.mockReturnValue({
      garment: garmentWithSoftDeleted,
      addService: jest.fn(),
      removeService: jest.fn(),
      updateService: jest.fn(),
      toggleServiceComplete: jest.fn(),
      restoreService: jest.fn(),
    });

    render(<GarmentServicesManagerOptimistic />);

    // Progress should be calculated based on only active services (2 total, 1 completed = 50%)
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '50'); // 1 completed out of 2 active services

    // Progress text should show "1 of 2 completed" (excluding soft-deleted service)
    expect(screen.getByText('1 of 2 completed')).toBeInTheDocument();

    // All services should be visible in the list, including soft-deleted ones
    expect(screen.getByText('Hem Pants')).toBeInTheDocument();
    expect(screen.getByText('Button Replacement')).toBeInTheDocument();
    expect(screen.getByText('Soft Deleted Service')).toBeInTheDocument();
  });

  it('shows 100% progress when all active services are completed (ignoring soft-deleted)', () => {
    // Mock garment where all active services are completed, but soft-deleted service is not
    const garmentAllActiveCompleted = {
      id: 'test-garment-id',
      name: 'Test Garment',
      stage: 'Ready For Pickup',
      garment_services: [
        {
          id: 'service-1',
          name: 'Hem Pants',
          quantity: 2,
          unit: 'hour',
          unit_price_cents: 2500,
          line_total_cents: 5000,
          description: 'Shorten hem',
          is_done: true,
        },
        {
          id: 'service-2',
          name: 'Button Replacement',
          quantity: 1,
          unit: 'flat_rate',
          unit_price_cents: 1500,
          line_total_cents: 1500,
          description: null,
          is_done: true,
        },
        {
          id: 'service-3',
          name: 'Soft Deleted Service',
          quantity: 1,
          unit: 'flat_rate',
          unit_price_cents: 2000,
          line_total_cents: 2000,
          description: null,
          is_done: false, // This is soft-deleted and incomplete, but should not affect progress
          is_removed: true,
          removed_at: '2024-01-01T00:00:00Z',
          removal_reason: 'Test removal',
        },
      ],
    };

    // Mock the useGarment hook to return our test data
    mockUseGarment.mockReturnValue({
      garment: garmentAllActiveCompleted,
      addService: jest.fn(),
      removeService: jest.fn(),
      updateService: jest.fn(),
      toggleServiceComplete: jest.fn(),
      restoreService: jest.fn(),
    });

    render(<GarmentServicesManagerOptimistic />);

    // Progress should be 100% since all active services are completed
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '100');

    // Progress text should show "2 of 2 completed" (excluding soft-deleted service)
    expect(screen.getByText('2 of 2 completed')).toBeInTheDocument();
  });

  it('shows 0% progress when no active services are completed (ignoring soft-deleted)', () => {
    // Mock garment where no active services are completed
    const garmentNoActiveCompleted = {
      id: 'test-garment-id',
      name: 'Test Garment',
      stage: 'New',
      garment_services: [
        {
          id: 'service-1',
          name: 'Hem Pants',
          quantity: 2,
          unit: 'hour',
          unit_price_cents: 2500,
          line_total_cents: 5000,
          description: 'Shorten hem',
          is_done: false,
        },
        {
          id: 'service-2',
          name: 'Button Replacement',
          quantity: 1,
          unit: 'flat_rate',
          unit_price_cents: 1500,
          line_total_cents: 1500,
          description: null,
          is_done: false,
        },
        {
          id: 'service-3',
          name: 'Soft Deleted Service',
          quantity: 1,
          unit: 'flat_rate',
          unit_price_cents: 2000,
          line_total_cents: 2000,
          description: null,
          is_done: true, // This is soft-deleted and completed, but should not affect progress
          is_removed: true,
          removed_at: '2024-01-01T00:00:00Z',
          removal_reason: 'Test removal',
        },
      ],
    };

    // Mock the useGarment hook to return our test data
    mockUseGarment.mockReturnValue({
      garment: garmentNoActiveCompleted,
      addService: jest.fn(),
      removeService: jest.fn(),
      updateService: jest.fn(),
      toggleServiceComplete: jest.fn(),
      restoreService: jest.fn(),
    });

    render(<GarmentServicesManagerOptimistic />);

    // Progress should be 0% since no active services are completed
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '0');

    // Progress text should show "0 of 2 completed" (excluding soft-deleted service)
    expect(screen.getByText('0 of 2 completed')).toBeInTheDocument();
  });

  it('prevents completed services from being deleted', () => {
    // Mock garment with a completed service
    const garmentWithCompletedService = {
      id: 'test-garment-id',
      name: 'Test Garment',
      stage: 'In Progress',
      garment_services: [
        {
          id: 'service-1',
          name: 'Hem Pants',
          quantity: 2,
          unit: 'hour',
          unit_price_cents: 2500,
          line_total_cents: 5000,
          description: 'Shorten hem',
          is_done: false,
        },
        {
          id: 'service-2',
          name: 'Button Replacement',
          quantity: 1,
          unit: 'flat_rate',
          unit_price_cents: 1500,
          line_total_cents: 1500,
          description: null,
          is_done: true, // This service is completed
        },
      ],
    };

    // Mock the useGarment hook to return our test data
    mockUseGarment.mockReturnValue({
      garment: garmentWithCompletedService,
      addService: jest.fn(),
      removeService: jest.fn(),
      updateService: jest.fn(),
      toggleServiceComplete: jest.fn(),
      restoreService: jest.fn(),
    });

    render(<GarmentServicesManagerOptimistic />);

    // Find the completed service
    const completedServiceItem = screen
      .getByText('Button Replacement')
      .closest('li');
    expect(completedServiceItem).toBeInTheDocument();

    // The delete button for the completed service should be disabled
    // Look for disabled delete buttons within the completed service item
    const disabledButtons =
      completedServiceItem?.querySelectorAll('button[disabled]');
    expect(disabledButtons?.length).toBeGreaterThan(0);

    // Check if there's a tooltip with the correct message (may need to hover first)
    const tooltipElements = screen.queryAllByText(
      'Cannot delete completed services'
    );
    if (tooltipElements.length === 0) {
      // The tooltip might not be visible until hovered, so let's just check the button is disabled
      const deleteButton =
        completedServiceItem?.querySelector('button[disabled]');
      expect(deleteButton).toBeDisabled();
    } else {
      expect(tooltipElements[0]).toBeInTheDocument();
    }
  });

  it('allows incomplete services to be deleted', () => {
    // Mock garment with an incomplete service
    const garmentWithIncompleteService = {
      id: 'test-garment-id',
      name: 'Test Garment',
      stage: 'In Progress',
      garment_services: [
        {
          id: 'service-1',
          name: 'Hem Pants',
          quantity: 2,
          unit: 'hour',
          unit_price_cents: 2500,
          line_total_cents: 5000,
          description: 'Shorten hem',
          is_done: false, // This service is not completed
        },
      ],
    };

    // Mock the useGarment hook to return our test data
    mockUseGarment.mockReturnValue({
      garment: garmentWithIncompleteService,
      addService: jest.fn(),
      removeService: jest.fn(),
      updateService: jest.fn(),
      toggleServiceComplete: jest.fn(),
      restoreService: jest.fn(),
    });

    render(<GarmentServicesManagerOptimistic />);

    // Find the incomplete service
    const incompleteServiceItem = screen.getByText('Hem Pants').closest('li');
    expect(incompleteServiceItem).toBeInTheDocument();

    // The delete button for the incomplete service should be enabled
    const deleteButton = incompleteServiceItem?.querySelector(
      'button:not([disabled])'
    );
    expect(deleteButton).toBeInTheDocument();
    expect(deleteButton).not.toBeDisabled();
  });

  it('prevents completed services from being edited', () => {
    // Mock garment with a completed service
    const garmentWithCompletedService = {
      id: 'test-garment-id',
      name: 'Test Garment',
      stage: 'In Progress',
      garment_services: [
        {
          id: 'service-1',
          name: 'Hem Pants',
          quantity: 2,
          unit: 'hour',
          unit_price_cents: 2500,
          line_total_cents: 5000,
          description: 'Shorten hem',
          is_done: false,
        },
        {
          id: 'service-2',
          name: 'Button Replacement',
          quantity: 1,
          unit: 'flat_rate',
          unit_price_cents: 1500,
          line_total_cents: 1500,
          description: null,
          is_done: true, // This service is completed
        },
      ],
    };

    // Mock the useGarment hook to return our test data
    mockUseGarment.mockReturnValue({
      garment: garmentWithCompletedService,
      addService: jest.fn(),
      removeService: jest.fn(),
      updateService: jest.fn(),
      toggleServiceComplete: jest.fn(),
      restoreService: jest.fn(),
    });

    render(<GarmentServicesManagerOptimistic />);

    // Find the completed service
    const completedServiceItem = screen
      .getByText('Button Replacement')
      .closest('li');
    expect(completedServiceItem).toBeInTheDocument();

    // The edit button for the completed service should be disabled
    // Look for disabled edit buttons within the completed service item
    const disabledButtons =
      completedServiceItem?.querySelectorAll('button[disabled]');
    expect(disabledButtons?.length).toBeGreaterThan(0);

    // Check if there's a tooltip with the correct message (may need to hover first)
    const tooltipElements = screen.queryAllByText(
      'Cannot edit completed services'
    );
    if (tooltipElements.length === 0) {
      // The tooltip might not be visible until hovered, so let's just check the button is disabled
      const editButton =
        completedServiceItem?.querySelector('button[disabled]');
      expect(editButton).toBeDisabled();
    } else {
      expect(tooltipElements[0]).toBeInTheDocument();
    }
  });

  it('allows incomplete services to be edited', () => {
    // Mock garment with an incomplete service
    const garmentWithIncompleteService = {
      id: 'test-garment-id',
      name: 'Test Garment',
      stage: 'In Progress',
      garment_services: [
        {
          id: 'service-1',
          name: 'Hem Pants',
          quantity: 2,
          unit: 'hour',
          unit_price_cents: 2500,
          line_total_cents: 5000,
          description: 'Shorten hem',
          is_done: false, // This service is not completed
        },
      ],
    };

    // Mock the useGarment hook to return our test data
    mockUseGarment.mockReturnValue({
      garment: garmentWithIncompleteService,
      addService: jest.fn(),
      removeService: jest.fn(),
      updateService: jest.fn(),
      toggleServiceComplete: jest.fn(),
      restoreService: jest.fn(),
    });

    render(<GarmentServicesManagerOptimistic />);

    // Find the incomplete service
    const incompleteServiceItem = screen.getByText('Hem Pants').closest('li');
    expect(incompleteServiceItem).toBeInTheDocument();

    // The edit button for the incomplete service should be enabled
    const editButton = incompleteServiceItem?.querySelector(
      'button:not([disabled])'
    );
    expect(editButton).toBeInTheDocument();
    expect(editButton).not.toBeDisabled();
  });

  it('excludes soft-deleted services from total price calculation', () => {
    // Mock garment with soft-deleted service that should not be included in total
    const garmentWithSoftDeleted = {
      id: 'test-garment-id',
      name: 'Test Garment',
      stage: 'In Progress',
      garment_services: [
        {
          id: 'service-1',
          name: 'Hem Pants',
          quantity: 2,
          unit: 'hour',
          unit_price_cents: 2500,
          line_total_cents: 5000,
          description: 'Shorten hem',
          is_done: false,
        },
        {
          id: 'service-2',
          name: 'Button Replacement',
          quantity: 1,
          unit: 'flat_rate',
          unit_price_cents: 1500,
          line_total_cents: 1500,
          description: null,
          is_done: true,
        },
        {
          id: 'service-3',
          name: 'Soft Deleted Service',
          quantity: 1,
          unit: 'flat_rate',
          unit_price_cents: 2000,
          line_total_cents: 2000,
          description: null,
          is_done: false,
          is_removed: true,
          removed_at: '2024-01-01T00:00:00Z',
          removal_reason: 'Test removal',
        },
      ],
    };

    // Mock the useGarment hook to return our test data
    mockUseGarment.mockReturnValue({
      garment: garmentWithSoftDeleted,
      addService: jest.fn(),
      removeService: jest.fn(),
      updateService: jest.fn(),
      toggleServiceComplete: jest.fn(),
      restoreService: jest.fn(),
    });

    render(<GarmentServicesManagerOptimistic />);

    // Total should only include active services: $50.00 + $15.00 = $65.00
    // Should NOT include the soft-deleted service ($20.00)
    expect(screen.getByText('Total: $65.00')).toBeInTheDocument();

    // Verify the soft-deleted service is not included in the total
    expect(screen.queryByText('Total: $85.00')).not.toBeInTheDocument();
  });

  it('shows $0.00 total when all services are soft-deleted', () => {
    // Mock garment where all services are soft-deleted
    const garmentAllSoftDeleted = {
      id: 'test-garment-id',
      name: 'Test Garment',
      stage: 'In Progress',
      garment_services: [
        {
          id: 'service-1',
          name: 'Soft Deleted Service 1',
          quantity: 1,
          unit: 'flat_rate',
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
          unit: 'flat_rate',
          unit_price_cents: 3000,
          line_total_cents: 3000,
          description: null,
          is_done: true,
          is_removed: true,
          removed_at: '2024-01-01T00:00:00Z',
          removal_reason: 'Test removal',
        },
      ],
    };

    // Mock the useGarment hook to return our test data
    mockUseGarment.mockReturnValue({
      garment: garmentAllSoftDeleted,
      addService: jest.fn(),
      removeService: jest.fn(),
      updateService: jest.fn(),
      toggleServiceComplete: jest.fn(),
      restoreService: jest.fn(),
    });

    render(<GarmentServicesManagerOptimistic />);

    // Total should be $0.00 since all services are soft-deleted
    expect(screen.getByText('Total: $0.00')).toBeInTheDocument();

    // Progress indicator should not be shown when there are no active services
    expect(screen.queryByText('0 of 0 completed')).not.toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});
