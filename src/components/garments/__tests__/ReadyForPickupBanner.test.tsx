import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReadyForPickupBanner from '../ReadyForPickupBanner';
import { useGarment } from '@/contexts/GarmentContext';
// Mock the dependencies
jest.mock('@/contexts/GarmentContext');

const mockUseGarment = useGarment as jest.MockedFunction<typeof useGarment>;

describe('ReadyForPickupBanner', () => {
	const mockMarkAsPickedUp = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
		mockUseGarment.mockReturnValue({
			garment: {
				id: 'test-garment-id',
				name: 'Test Garment',
				stage: 'Ready For Pickup',
			} as any,
			markAsPickedUp: mockMarkAsPickedUp,
		} as any);
	});

	it('renders the banner with correct message', () => {
		render(
			<ReadyForPickupBanner
				garmentId="test-garment-id"
				garmentName="Test Garment"
			/>
		);

		expect(screen.getByText('All services complete!')).toBeInTheDocument();
		expect(
			screen.getByText(
				'This garment is ready for pickup. Mark it as picked up when the client collects it.'
			)
		).toBeInTheDocument();
		expect(screen.getByText('Mark as Picked Up')).toBeInTheDocument();
	});

	it('calls markAsPickedUp when button is clicked', async () => {
		mockMarkAsPickedUp.mockResolvedValue(undefined);

		render(
			<ReadyForPickupBanner
				garmentId="test-garment-id"
				garmentName="Test Garment"
			/>
		);

		const button = screen.getByText('Mark as Picked Up');
		fireEvent.click(button);

		// Button should show loading state
		expect(screen.getByText('Marking...')).toBeInTheDocument();

		await waitFor(() => {
			expect(mockMarkAsPickedUp).toHaveBeenCalledTimes(1);
		});
	});

	it('disables button while loading', async () => {
		mockMarkAsPickedUp.mockImplementation(
			() => new Promise((resolve) => setTimeout(resolve, 100))
		);

		render(
			<ReadyForPickupBanner
				garmentId="test-garment-id"
				garmentName="Test Garment"
			/>
		);

		const button = screen.getByRole('button');
		fireEvent.click(button);

		expect(button).toBeDisabled();
		expect(screen.getByText('Marking...')).toBeInTheDocument();

		await waitFor(() => {
			expect(button).not.toBeDisabled();
			expect(screen.getByText('Mark as Picked Up')).toBeInTheDocument();
		});
	});

	it('handles errors gracefully', async () => {
		const consoleErrorSpy = jest
			.spyOn(console, 'error')
			.mockImplementation(() => {});
		mockMarkAsPickedUp.mockRejectedValue(new Error('Test error'));

		render(
			<ReadyForPickupBanner
				garmentId="test-garment-id"
				garmentName="Test Garment"
			/>
		);

		const button = screen.getByText('Mark as Picked Up');
		fireEvent.click(button);

		await waitFor(() => {
			expect(consoleErrorSpy).toHaveBeenCalledWith(
				'Error marking garment as picked up:',
				expect.any(Error)
			);
		});

		// Button should be enabled again after error
		expect(button).not.toBeDisabled();
		expect(screen.getByText('Mark as Picked Up')).toBeInTheDocument();

		consoleErrorSpy.mockRestore();
	});
});
