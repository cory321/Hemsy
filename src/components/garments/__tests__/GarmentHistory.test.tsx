import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import GarmentHistory from '../GarmentHistory';
import { getGarmentHistory } from '@/lib/actions/garments';

// Mock the dependencies
jest.mock('@/lib/actions/garments');

const mockGetGarmentHistory = getGarmentHistory as jest.MockedFunction<
  typeof getGarmentHistory
>;

describe('GarmentHistory - Stage Change Display', () => {
  it('should display stage changes in the correct format', async () => {
    const mockHistory = [
      {
        id: 'history-1',
        garment_id: 'garment-123',
        changed_by: 'user-123',
        changed_at: new Date().toISOString(),
        field_name: 'stage',
        old_value: 'Ready For Pickup',
        new_value: 'Done',
        change_type: 'field_update',
        related_service_id: null,
        changed_by_user: {
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
        },
      },
    ];

    mockGetGarmentHistory.mockResolvedValue({
      success: true,
      history: mockHistory,
    });

    render(<GarmentHistory garmentId="garment-123" />);

    // Wait for the history to load
    await screen.findByText('Stage updated');

    // Verify the stage change is displayed with the correct format
    expect(screen.getByText('Stage updated')).toBeInTheDocument();
    expect(screen.getByText('Ready For Pickup → Done')).toBeInTheDocument();
  });

  it('should display other field changes with arrow format', async () => {
    const mockHistory = [
      {
        id: 'history-2',
        garment_id: 'garment-123',
        changed_by: 'user-123',
        changed_at: new Date().toISOString(),
        field_name: 'name',
        old_value: 'Blue Dress',
        new_value: 'Blue Evening Dress',
        change_type: 'field_update',
        related_service_id: null,
        changed_by_user: {
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane@example.com',
        },
      },
    ];

    mockGetGarmentHistory.mockResolvedValue({
      success: true,
      history: mockHistory,
    });

    render(<GarmentHistory garmentId="garment-123" />);

    // Wait for the history to load
    await screen.findByText('Name changed');

    // Verify the name change is displayed with the arrow format
    expect(screen.getByText('Name changed')).toBeInTheDocument();
    expect(
      screen.getByText('"Blue Dress" → "Blue Evening Dress"')
    ).toBeInTheDocument();
  });
});
